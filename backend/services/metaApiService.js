const MetaApi = require('metaapi.cloud-sdk').default;
const fetch = require('node-fetch');

// Environment Variables
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN;
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID;
const METAAPI_REGION = () => process.env.METAAPI_REGION || 'new-york';
const METAAPI_BASE_URL = () => `https://mt-market-data-client-api-v1.${METAAPI_REGION()}.agiliumtrade.ai`;

const toKey = (symbol = '') => {
  if (!symbol) return '';
  return symbol.toUpperCase().split('.')[0].replace(/[^A-Z0-9]/g, '');
};

class MetaApiService {
  constructor() {
    this.prices = {};
    this.subscribers = new Set();
    this.isConnected = false;
    this.accountSymbols = new Set();
    this.requestToActualMap = new Map();
    this.actualToRequestsMap = new Map();
    
    // Core working symbols (defaults)
    this.workingSymbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD'];
  }

  async connect() {
    if (this.isConnected) return;
    const token = METAAPI_TOKEN();
    const accountId = METAAPI_ACCOUNT_ID();
    
    if (!token || !accountId) {
      console.error('[MetaAPI] Missing credentials');
      return;
    }

    try {
      this.metaApi = new MetaApi(token);
      this.account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      console.log(`[MetaAPI] Connecting to account ${accountId}...`);
      await this.account.waitConnected();
      this.isConnected = true;
      console.log('[MetaAPI] Connected successfully');
      
      // Initialize symbol mapping
      await this.syncSymbolsFromAccount();
      
      // Setup real-time price stream
      this.connection = await this.account.getStreamingConnection();
      await this.connection.connect();
      await this.connection.waitSynchronized();
      
      this.connection.addSynchronizationListener({
        onSymbolPriceUpdated: (instanceIndex, symbol, price) => {
          this.updatePrice(symbol, price);
        }
      });
      
      console.log('[MetaAPI] Real-time price stream active');
    } catch (err) {
      console.error('[MetaAPI] Connection failed:', err.message);
      this.isConnected = false;
    }
  }

  async syncSymbolsFromAccount() {
    const accountId = METAAPI_ACCOUNT_ID();
    const token = METAAPI_TOKEN();
    if (!accountId || !token) return;

    try {
      const url = `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols`;
      const response = await fetch(url, { headers: { 'auth-token': token } });
      
      if (response.ok) {
        const symbols = await response.json();
        this.accountSymbols = new Set(symbols);
        console.log(`[MetaAPI] Synced ${this.accountSymbols.size} symbols from account`);
        this.buildSymbolMappings();
      }
    } catch (err) {
      console.error('[MetaAPI] Symbol sync failed:', err.message);
    }
  }

  buildSymbolMappings() {
    // Hardcoded overrides for common mismatches
    const mappings = [
      { from: 'XAUUSD.i', to: 'XAUUSD' },
      { from: 'GOLD.i', to: 'XAUUSD' },
      { from: 'BTCUSD.i', to: 'BTCUSD' },
      { from: 'ETHUSD.i', to: 'ETHUSD' },
      { from: 'EURUSD.i', to: 'EURUSD' },
      { from: 'GBPUSD.i', to: 'GBPUSD' }
    ];

    mappings.forEach(({ from, to }) => {
      if (this.accountSymbols.has(to)) {
        this.requestToActualMap.set(from, to);
        if (!this.actualToRequestsMap.has(to)) this.actualToRequestsMap.set(to, new Set());
        this.actualToRequestsMap.get(to).add(from);
        console.log(`[MetaAPI] Mapped ${from} -> ${to}`);
      }
    });

    // Dynamic mapping for others
    for (const actual of this.accountSymbols) {
      const key = toKey(actual);
      if (key && !this.actualToRequestsMap.has(actual)) {
        // Find if anything else matches this key
        this.requestToActualMap.set(actual + '.i', actual); // Potential suffix
      }
    }
  }

  resolveSymbolForAccount(symbol) {
    if (this.requestToActualMap.has(symbol)) return this.requestToActualMap.get(symbol);
    if (this.accountSymbols.has(symbol)) return symbol;
    
    // Last resort lookup
    const key = toKey(symbol);
    for (const actual of this.accountSymbols) {
      if (toKey(actual) === key) return actual;
    }
    
    return symbol;
  }

  updatePrice(symbol, priceData) {
    // Store price for requested symbols
    const requestedSymbols = this.actualToRequestsMap.get(symbol) || new Set([symbol]);
    requestedSymbols.forEach(reqSym => {
      this.prices[reqSym] = {
        symbol: reqSym,
        bid: priceData.bid,
        ask: priceData.ask,
        time: priceData.time || new Date(),
        provider: 'metaapi'
      };
      this.notifySubscribers(reqSym, this.prices[reqSym]);
    });
  }

  getPrice(symbol) {
    return this.prices[symbol] || null;
  }

  async getHistoricalCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500) {
    const accountId = METAAPI_ACCOUNT_ID();
    const token = METAAPI_TOKEN();
    if (!accountId || !token) return [];

    const resolvedSymbol = this.resolveSymbolForAccount(symbol);
    const metaTimeframe = timeframe === '1M' ? '1mn' : timeframe; // Simple mapping
    
    const baseUrl = METAAPI_BASE_URL();
    const url = `${baseUrl}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(resolvedSymbol)}/timeframes/${metaTimeframe}/candles?${startTime ? `startTime=${startTime}&` : ''}${endTime ? `endTime=${endTime}&` : ''}limit=${limit}`;
    
    console.error(`[MetaAPI] History Request: ${symbol} -> ${resolvedSymbol} | URL: ${url}`);

    try {
      const response = await fetch(url, { headers: { 'auth-token': token } });
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[MetaAPI] History Failure: ${symbol} (${resolvedSymbol}) | HTTP ${response.status} | ${errorText}`);
        return [];
      }

      const data = await response.json();
      return (data || []).map(c => ({
        time: Math.floor(new Date(c.time).getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume || c.volume || 0
      })).sort((a, b) => a.time - b.time);
    } catch (err) {
      console.error(`[MetaAPI] History Exception for ${symbol}:`, err.message);
      return [];
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(symbol, price) {
    this.subscribers.forEach(callback => callback(symbol, price));
  }

  isSymbolSupported(symbol) {
    return true; // We'll resolve on the fly
  }

  getHeaders() {
    return { 'auth-token': METAAPI_TOKEN(), 'Content-Type': 'application/json' };
  }
}

module.exports = new MetaApiService();
