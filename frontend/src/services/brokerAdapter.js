/**
 * HCFinvest Native Broker Adapter
 * Implements IBrokerTerminal interface for professional TradingView integration.
 */
export class HCFinvestBrokerAdapter {
  constructor(host) {
    this._host = host; // Implementation of IBrokerConnectionAdapterHost
    this._orders = [];
    this._positions = [];
    this._currentAccount = 'live_account';
    this._symbolInfoCache = {};
  }

  // --- IBrokerAccountInfo Implementation ---
  async accountsMetainfo() {
    return [{ id: this._currentAccount, name: 'HCFinvest Live' }];
  }

  currentAccount() {
    return this._currentAccount;
  }

  // --- IBrokerCommon Implementation ---
  connectionStatus() {
    return 1; // 1 = Connected
  }

  async chartContextMenuActions(context, options) {
    return []; // Use default trading actions
  }

  async isTradable(symbol) {
    return true;
  }

  async orders() {
    return this._orders;
  }

  async positions() {
    return this._positions;
  }

  async executions(symbol) {
    return [];
  }

  async symbolInfo(symbol) {
    if (this._symbolInfoCache[symbol]) return this._symbolInfoCache[symbol];

    // v7.50: Dynamic precision mapping to ensure Buy/Sell lines align with Price Candles
    const s = symbol.toUpperCase();
    let pricescale = 100000;
    
    if (s.includes("JPY") || s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("USDT")) {
      pricescale = 100;
    } else if (s.includes("XAG")) {
      pricescale = 1000;
    } else if (s.includes("US100") || s.includes("US30") || s.includes("US500") || s.includes("DE30") || s.includes("GER30") || s.includes("SPA35") || s.includes("ES35") || s.includes("FR40") || s.includes("FRA40")) {
      pricescale = 100;
    }

    const info = {
      name: symbol,
      ticker: symbol,
      description: symbol,
      type: 'forex',
      session: '24x7',
      timezone: 'UTC',
      exchange: 'HCFinvest',
      minmov: 1,
      pricescale: pricescale, 
      pipSize: 1 / pricescale,
      pipValue: 1,
      minTick: 1 / pricescale,
      qty: { min: 0.01, max: 10000, step: 0.01 },
      currency: 'USD',
      unit: '',
    };
    this._symbolInfoCache[symbol] = info;
    return info;
  }

  accountManagerInfo() {
    return {
      accountTitle: 'HCFinvest',
      summary: [
        { label: 'Balance', value: 0 },
        { label: 'Equity', value: 0 },
        { label: 'Margin', value: 0 },
      ],
      pages: [
        {
          id: 'orders',
          title: 'Orders',
          tables: [{ id: 'orders', columns: [], sortProp: 'id' }],
        },
        {
          id: 'positions',
          title: 'Positions',
          tables: [{ id: 'positions', columns: [], sortProp: 'id' }],
        },
      ],
    };
  }

  // --- IBrokerTerminal Implementation (Write Actions) ---
  async placeOrder(order) {
    console.log('[BrokerAdapter] placeOrder', order);
    return { orderId: Date.now().toString() };
  }

  async modifyOrder(order) {
    console.log('[BrokerAdapter] modifyOrder', order);
    // This will be called when SL/TP lines are dragged natives
    if (this._onTradeModify) {
       this._onTradeModify({ 
         tradeId: order.id, 
         sl: order.stopLoss, 
         tp: order.takeProfit 
       });
    }
  }

  async cancelOrder(orderId) {
    console.log('[BrokerAdapter] cancelOrder', orderId);
    if (this._onTradeModify) {
        this._onTradeModify({ tradeId: orderId, cancel: true });
    }
  }

  async closePosition(positionId, amount) {
    console.log('[BrokerAdapter] closePosition', positionId);
  }

  async editPositionBrackets(positionId, brackets) {
    console.log('[BrokerAdapter] editPositionBrackets', positionId, brackets);
    if (this._onTradeModify) {
        this._onTradeModify({
            tradeId: positionId,
            sl: brackets.stopLoss,
            tp: brackets.takeProfit
        });
    }
  }

  // --- Custom Integration Methods ---
  setTradeModifyCallback(callback) {
    this._onTradeModify = callback;
  }

  updateData(trades, symbol) {
     // Transform backend trades into TV Orders and Positions
     const newOrders = [];
     const newPositions = [];

     this._log('updateData', { symbol, tradeCount: trades.length });

     trades.forEach(t => {
        const id = String(t._id || t.id);
        
        // Ensure the symbol matches the chart EXACTLY for visibility
        // If we represent a different symbol, TV won't draw it on this chart.
        const effectiveSymbol = symbol || t.symbol;

        // Position (Entry)
        newPositions.push({
           id,
           symbol: effectiveSymbol,
           qty: t.volume || t.quantity || 0.01,
           side: (t.side || t.type || '').toLowerCase() === 'buy' ? 1 : -1,
           avgPrice: t.openPrice || t.price,
           stopLoss: t.stopLoss || t.sl,
           takeProfit: t.takeProfit || t.tp,
        });
     });

     this._orders = newOrders;
     this._positions = newPositions;

     this._log('pushing updates to host', { positions: this._positions });

     // Notify Host
     if (this._host) {
       this._host.orderUpdate();
       this._host.positionUpdate();
     }
  }

  _log(...args) {
    console.log('[BrokerAdapter]', ...args);
  }
}
