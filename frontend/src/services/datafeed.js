import { API_URL } from "../config/api";
import priceStreamService from "./priceStream";
import { getPriceEvents } from "./eventSystem";
import { sanitizeBatch } from "../utils/chartSanitizer";

/**
 * Custom Datafeed for TradingView Charting Library
 * Integrates with AllTick data through our optimized backend caching service.
 */

/* Event system used by TradingPage.jsx to receive live price updates */
// Moved to shared eventSystem.js to break circular dependency

const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"]
};

// //sanket - Map TradingView resolution to backend timeframe format
const formatResolution = (res) => {
  const map = {
    '1': '1m', '5': '5m', '15': '15m', '30': '30m',
    '60': '1h', '120': '2h', '240': '4h', 'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M'
  };
  return map[res] || res;
};

//Sanket v2.0 - Strip .i suffix before removing non-alphanumeric so XAUUSD.i and XAUUSD both normalize to XAUUSD
//Sanket v2.0 - Strip ALL suffixes and special chars for strict normalization
const normalizeRealtimeSymbol = (value = '') => {
  if (!value) return '';
  return String(value)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.F$/i, '')
    .replace(/\.C$/i, '')
    .replace(/[^A-Z0-9]/g, '');
};

const toMs = (rawTime) => {
  let timeMs = rawTime;
  if (typeof timeMs === 'number' && timeMs < 10000000000) {
    timeMs = timeMs * 1000;
  } else if (typeof timeMs === 'string') {
    timeMs = new Date(timeMs).getTime();
  }
  return Number.isFinite(timeMs) ? timeMs : NaN;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeBars = (candles = [], symbol = '') => {
  if (!candles || candles.length === 0) return [];
  
  // 1. Basic formatting (timestamps and numbers)
  const rawBars = candles.map(c => ({
    time: toMs(c?.time),
    open: toNumber(c?.open),
    high: toNumber(c?.high),
    low: toNumber(c?.low),
    close: toNumber(c?.close),
    volume: Number.isFinite(Number(c?.volume)) ? Number(c.volume) : 0
  })).filter(b => Number.isFinite(b.time) && b.time > 0);

  // 2. Production Sanitization (Anti-Spike, OHLC correction, Sorting)
  return sanitizeBatch(rawBars, symbol);
};

const applyChartPriceModeToBar = (bar, symbol, adminSpreads, side = 'MID') => {
  if (!bar) return bar;

  // Keep historical bars raw for all chart modes. Applying retail markup at chart layer
  // causes drift versus execution prices, open-position mark prices, and header quotes.
  return bar;
};

const getChartExecutionPrice = (bid, ask, symbol, adminSpreads, side = 'MID') => {
  const numBid = Number(bid);
  const numAsk = Number(ask);

  if (side === 'BUY') {
    return numAsk;
  }

  if (side === 'SELL') {
    return numBid;
  }

  return (numBid + numAsk) / 2;
};

//Sanket v2.0 - All symbols without .i suffix
//Sanket v2.0 - Canonical Symbol Registry (Shared logic with Backend)
const SYMBOL_REGISTRY_FE = {
  'EURUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'GBPUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDJPY': { pricescale: 100,    session: '2200-2200:12345' },
  'USDCHF': { pricescale: 100000, session: '2200-2200:12345' },
  'AUDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'NZDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDCAD': { pricescale: 100000, session: '2200-2200:12345' },
  'XAUUSD': { pricescale: 100,    session: '2200-2200:12345' },
  'XAGUSD': { pricescale: 1000,   session: '2200-2200:12345' },
  'BTCUSD': { pricescale: 100,    session: '24x7' },
  'ETHUSD': { pricescale: 100,    session: '24x7' },
  'BNBUSD': { pricescale: 100,    session: '24x7' },
  'SOLUSD': { pricescale: 100,    session: '24x7' },
  'US30':   { pricescale: 10,     session: '2200-2200:12345' },
  'US500':  { pricescale: 100,    session: '2200-2200:12345' },
  'US100':  { pricescale: 10,     session: '2200-2200:12345' },
  'UK100':  { pricescale: 10,     session: '2200-2200:12345' },
};

const ALL_SYMBOLS = [
  // Forex
  { symbol: 'EURUSD', description: 'Euro / US Dollar', type: 'forex' },
  { symbol: 'GBPUSD', description: 'Great British Pound / US Dollar', type: 'forex' },
  { symbol: 'USDJPY', description: 'US Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'USDCHF', description: 'US Dollar / Swiss Franc', type: 'forex' },
  { symbol: 'AUDUSD', description: 'Australian Dollar / US Dollar', type: 'forex' },
  { symbol: 'NZDUSD', description: 'New Zealand Dollar / US Dollar', type: 'forex' },
  { symbol: 'USDCAD', description: 'US Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'EURGBP', description: 'Euro / Great British Pound', type: 'forex' },
  { symbol: 'EURJPY', description: 'Euro / Japanese Yen', type: 'forex' },
  { symbol: 'GBPJPY', description: 'Great British Pound / Japanese Yen', type: 'forex' },
  { symbol: 'EURAUD', description: 'Euro / Australian Dollar', type: 'forex' },
  { symbol: 'EURCAD', description: 'Euro / Canadian Dollar', type: 'forex' },
  { symbol: 'EURCHF', description: 'Euro / Swiss Franc', type: 'forex' },
  { symbol: 'AUDJPY', description: 'Australian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CADJPY', description: 'Canadian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CHFJPY', description: 'Swiss Franc / Japanese Yen', type: 'forex' },
  { symbol: 'GBPAUD', description: 'Great British Pound / Australian Dollar', type: 'forex' },
  { symbol: 'GBPCAD', description: 'Great British Pound / Canadian Dollar', type: 'forex' },
  { symbol: 'AUDCAD', description: 'Australian Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'NZDJPY', description: 'New Zealand Dollar / Japanese Yen', type: 'forex' },
  // Metals
  { symbol: 'XAUUSD', description: 'CFDs on Gold (US$ / OZ)', type: 'commodity' },
  { symbol: 'XAGUSD', description: 'CFDs on Silver (US$ / OZ)', type: 'commodity' },
  // Energy & Commodities
  { symbol: 'USOIL',  description: 'US Crude Oil (WTI)', type: 'commodity' },
  { symbol: 'UKOIL',  description: 'UK Brent Crude Oil', type: 'commodity' },
  { symbol: 'NGAS',   description: 'Natural Gas', type: 'commodity' },
  { symbol: 'COPPER', description: 'Copper', type: 'commodity' },
  // Indices
  { symbol: 'US30',  description: 'US Wall Street 30', type: 'index' },
  { symbol: 'US500', description: 'US S&P 500', type: 'index' },
  { symbol: 'US100', description: 'US NASDAQ 100', type: 'index' },
  { symbol: 'UK100', description: 'UK FTSE 100', type: 'index' },
  { symbol: 'ES35',  description: 'Spain 35', type: 'index' },
  // Crypto
  { symbol: 'BTCUSD', description: 'Bitcoin / US Dollar', type: 'crypto' },
  { symbol: 'ETHUSD', description: 'Ethereum / US Dollar', type: 'crypto' },
  { symbol: 'BNBUSD', description: 'Binance Coin / US Dollar', type: 'crypto' },
  { symbol: 'SOLUSD', description: 'Solana / US Dollar', type: 'crypto' },
];

const Datafeed = {
  interval: null,
  _adminSpreads: {},
  _chartPriceSide: 'MID',
  //Sanket v2.0 - Offset in ms between server clock and local Date.now(); set by getServerTime on each call
  _serverTimeOffsetMs: 0,

  setAdminSpreads: (spreads) => {
    Datafeed._adminSpreads = spreads || {};
    // console.log('[DATAFEED] Admin spreads updated', Object.keys(Datafeed._adminSpreads).length);
  },

  setChartPriceSide: (side) => {
    Datafeed._chartPriceSide = side === 'BUY' || side === 'SELL' ? side : 'MID';
  },

  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  //Sanket v2.0 - Fixed: always call callback so TradingView countdown never hangs on network failure
  //Sanket v2.0 - Added half-RTT latency compensation so bar-close countdown matches real server time
  //Sanket v2.0 - Stores _serverTimeOffsetMs so bootstrapLiveBar uses server-aligned bucket boundaries
  getServerTime: (callback) => {
    const _fetchStart = Date.now();
    fetch(`${API_URL}/prices/time`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Number.isFinite(json.time)) {
          //Sanket v2.0 - Compensate for ~half of round-trip network latency
          const _latencyMs = (Date.now() - _fetchStart) / 2;
          const _adjustedSec = json.time + Math.round(_latencyMs / 1000);
          //Sanket v2.0 - Store server-client offset so all bucket calculations are server-time-aligned
          Datafeed._serverTimeOffsetMs = (json.time * 1000 + _latencyMs) - Date.now();
          callback(_adjustedSec);
        } else {
          callback(Math.floor(Date.now() / 1000));
        }
      })
      .catch(() => {
        //Sanket v2.0 - Always call back: TradingView bar-close countdown is broken if this never fires
        callback(Math.floor(Date.now() / 1000));
      });
  },

  // Required by TradingView â€” powers the built-in symbol search dialog
  searchSymbols: (userInput, _exchange, _symbolType, onResult) => {
    const query = (userInput || '').toUpperCase();
    const results = ALL_SYMBOLS
      .filter(s => s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query))
      .map(s => ({
        symbol: s.symbol,
        full_name: s.symbol,
        description: s.description,
        exchange: 'AllTick',
        type: s.type,
        ticker: s.symbol,
      }));
    onResult(results);
  },

  //Sanket v2.0 - Added try/catch + onResolveErrorCallback so chart doesn't hang on bad symbols
  resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    try {
      // v7.77 Strict Normalization using Registry
      const cleanName = normalizeRealtimeSymbol(symbolName);
      const meta = SYMBOL_REGISTRY_FE[cleanName] || {};
      
      const pricescale = meta.pricescale || 100000;
      const session = meta.session || '24x7';
      
      const symbolItem = ALL_SYMBOLS.find(s => s.symbol === cleanName);
      
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: symbolItem ? symbolItem.description : symbolName,
        type: symbolItem ? symbolItem.type : 'forex',
        session: session, // âœ… THE FIX: Native session support
        timezone: 'Etc/UTC',
        exchange: 'AllTick',
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240'],
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: 'streaming'
      };
      // console.log(`[v7.77] resolveSymbol: ${symbolName} using session ${session} and pricescale ${pricescale}`);
      console.log(`[CHART-DIAG] resolveSymbol: name="${symbolInfo.name}" ticker="${symbolInfo.ticker}" pricescale=${pricescale}`);
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    } catch (err) {
      console.error(`[DATAFEED] resolveSymbol failed for ${symbolName}:`, err.message);
      if (onResolveErrorCallback) {
        onResolveErrorCallback(`Failed to resolve symbol: ${symbolName}`);
      }
    }
  },

  /**
   * //sanket - Fetch historical candles from our backend cache
   * CRITICAL: Returns bars with time in UNIX MILLISECONDS (TradingView requirement)
   */
  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    try {
      const { from, to, countBack, firstDataRequest } = periodParams;
      const timeframe = formatResolution(resolution);
      const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
      const intradayTimeframes = new Set(['1m', '5m', '15m', '30m', '1h', '2h', '4h']);
      const useLiveCache = firstDataRequest && intradayTimeframes.has(timeframe);
      
      // Ensure minimum 500 candles for proper chart display
      const limit = Math.max(countBack || 300, 500);
      const params = new URLSearchParams();
      params.set('symbol', symbolInfo.name);
      params.set('resolution', timeframe);
      if (Number.isFinite(from)) params.set('from', String(from));
      if (Number.isFinite(to)) params.set('to', String(to));
      params.set('limit', String(limit));
      if (useLiveCache) params.set('preferLive', '1');
      params.set('v', '3'); // ðŸ”¥ THE FIX: Bust Browser HTTP Cache so TradingView pulls the newly pruned payload
      const url = `${API_URL}/prices/history?${params.toString()}`;
      
      // console.log(`[DATAFEED] getBars: ${symbolInfo.name} (${resolution}â†’${timeframe}) from=${from} to=${to} limit=${limit}`);
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[DATAFEED] âŒ getBars HTTP ${res.status} for ${symbolInfo.name}`);
        // CRITICAL: Call onError instead of onHistory([], {noData: true})
        // This prevents TradingView from permanently marking this timeframe as "EMPTY"
        // if we are just experiencing a temporary 429 rate limit.
        onErrorCallback(`HTTP ${res.status}`);
        return;
      }

      const result = await res.json();
      const candleCount = result.candles?.length || 0;
      // console.log(`[DATAFEED] âœ“ getBars received ${candleCount} candles for ${symbolInfo.name}`);

      let bars = [];
      if (result.success && result.candles && result.candles.length > 0) {
        // Apply Retail Lens Markup to historical bars
        const rawBars = normalizeBars(result.candles, symbolInfo.name);
        bars = rawBars.map(bar => applyChartPriceModeToBar(bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));

        //Sanket v2.0 - Sanitize spike wicks baked into historical candle data by AllTick bad ticks
        //Sanket v2.0 - If a bar's low/high deviates >1.5% from its body midpoint, clamp to body range
        if (bars.length > 2) {
          const sym = String(symbolInfo.name).toUpperCase();
          const wickThresholdPct = (sym.includes('BTC') || sym.includes('ETH') || sym.includes('BNB') || sym.includes('SOL') || sym.includes('DOGE')) ? 5
            : (sym.includes('XAU') || sym.includes('XAG')) ? 1.5
            : (sym.includes('OIL') || sym.includes('NGAS') || sym.includes('US30') || sym.includes('US100') || sym.includes('US500')) ? 1
            : 0.5;
          for (let i = 0; i < bars.length; i++) {
            const b = bars[i];
            const bodyMid = (b.open + b.close) / 2;
            const threshold = bodyMid * (wickThresholdPct / 100);
            const bodyLow = Math.min(b.open, b.close);
            const bodyHigh = Math.max(b.open, b.close);
            if (b.low < bodyLow - threshold) {
              bars[i] = { ...b, low: bodyLow - threshold };
            }
            if (bars[i].high > bodyHigh + threshold) {
              bars[i] = { ...bars[i], high: bodyHigh + threshold };
            }
          }
        }
      }

      if (bars.length === 0) {
          // console.log(`[DATAFEED] âš ï¸ No valid bars for ${symbolInfo.name}. Returning noData.`);
          onHistoryCallback([], { noData: true });
      } else {
          //Sanket v2.0 - Inject ONLY recentClosed (completed bars from Redis ZSET) to fill the gap between
          //Sanket v2.0 - stale AllTick history cache and the current time. Do NOT inject the live running candle.
          //Sanket v2.0 - TV CL v30 treats bars from onHistoryCallback as finalized history and won't accept
          //Sanket v2.0 - realtime updates for them via onRealtimeCallback. The current candle is handled
          //Sanket v2.0 - entirely by subscribeBars/bootstrapLiveBar â€” TV sees it as a genuinely NEW bar.
          if (useLiveCache) {
            try {
              const liveRes = await fetch(
                `${API_URL}/prices/current-candle?symbol=${encodeURIComponent(symbolInfo.name)}&resolution=${encodeURIComponent(timeframe)}`
              );
              if (liveRes.ok) {
                const liveJson = await liveRes.json();
                if (liveJson?.success) {
                  const recentClosed = Array.isArray(liveJson.recentClosed) ? liveJson.recentClosed : [];

                  //Sanket v2.0 - Merge only CLOSED bars from Redis ZSET into history to fill the cache gap
                  if (recentClosed.length > 0) {
                    const lastHistTime = bars[bars.length - 1].time;
                    for (const rc of recentClosed) {
                      if (!Number.isFinite(rc.time) || rc.time <= 0) continue;
                      if (rc.time <= lastHistTime) {
                        const idx = bars.findIndex(b => b.time === rc.time);
                        if (idx !== -1) bars[idx] = applyChartPriceModeToBar(rc, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
                      } else {
                        bars.push(applyChartPriceModeToBar(rc, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));
                      }
                    }
                    bars.sort((a, b) => a.time - b.time);
                    // console.log(`[DATAFEED] âœ… Merged ${recentClosed.length} Redis closed candles for ${symbolInfo.name}`);
                  }
                }
              }
            } catch (_liveErr) {
              // Non-fatal: history bars will still be returned normally
            }
          }

          //Sanket v2.0 - Strip the current running candle from history output.
          //Sanket v2.0 - AllTick API returns partial current-bucket bars in its history response, and Redis
          //Sanket v2.0 - cache preserves them. TV CL v30 treats ALL bars from onHistoryCallback as finalized
          //Sanket v2.0 - and silently ignores onRealtimeCallback updates for the same bar time. By stripping
          //Sanket v2.0 - the current bucket here, subscribeBars/bootstrapLiveBar can push it as a genuinely
          //Sanket v2.0 - NEW bar that TV fully accepts for live open/high/low/close updates.
          if (firstDataRequest && bars.length > 0) {
            const _resMsLookup = { '1m': 60000, '5m': 300000, '15m': 900000, '30m': 1800000, '1h': 3600000, '2h': 7200000, '4h': 14400000, '1d': 86400000, '1w': 604800000, '1M': 2592000000 };
            const _resMs = _resMsLookup[timeframe] || 60000;
            const _nowMs = Date.now() + (Datafeed._serverTimeOffsetMs || 0);
            const _currentBucket = Math.floor(_nowMs / _resMs) * _resMs;
            let _stripped = 0;
            while (bars.length > 0 && bars[bars.length - 1].time >= _currentBucket) {
              bars.pop();
              _stripped++;
            }
            if (_stripped > 0) {
              console.log(`[CHART-DEBUG] getBars STRIPPED ${_stripped} bars, bucket=${_currentBucket} nowMs=${_nowMs}`);
            }
          }

          if (bars.length === 0) {
            // console.log(`[DATAFEED] âš ï¸ All bars were current-bucket â€” returning noData`);
            onHistoryCallback([], { noData: true });
          } else {
            Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
            //Sanket v2.0 - Only update if this batch is more recent. Backward pagination batches
            // arrive AFTER the first (most-recent) batch and would overwrite _lastHistoryBars with
            // stale old bars. subscribeBars seeds lastPushedBarTime from this value, so if it's
            // stale, bootstrapLiveBar and handleCandleUpdate can push bars older than TV's last
            // getBars bar, causing putToCacheNewBar time violations on 1W/1D/higher timeframes.
            const candidateBar = bars[bars.length - 1];
            if (!Datafeed._lastHistoryBars[historyKey] || candidateBar.time > Datafeed._lastHistoryBars[historyKey].time) {
              Datafeed._lastHistoryBars[historyKey] = { ...candidateBar };
            }
            console.log(`[CHART-DEBUG] getBars DONE ${symbolInfo.name} bars=${bars.length} lastBar.time=${candidateBar.time} (${new Date(candidateBar.time).toISOString()}) lastBar.close=${candidateBar.close}`);
            onHistoryCallback(bars, { noData: false });
          }
      }
    } catch (err) {
      console.error("[DATAFEED] âŒ getBars Exception:", err.message);
      onErrorCallback(err);
    }
  },

    //Sanket v2.0 - Clean rewrite: single onRealtimeCallback path, no RAF, no buildCandleFromTick
  //Sanket v2.0 - Standard TradingView CL pattern: lastBar + bucket logic + direct push on every tick
  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    let resolutionMinutes = 1;
    if (resolution === '1M' || resolution === 'M') resolutionMinutes = 30 * 24 * 60;
    else if (resolution === '1W' || resolution === 'W') resolutionMinutes = 7 * 24 * 60;
    else if (resolution === '1D' || resolution === 'D') resolutionMinutes = 24 * 60;
    else if (resolution === '4h' || resolution === '240') resolutionMinutes = 4 * 60;
    else if (resolution === '2h' || resolution === '120') resolutionMinutes = 2 * 60;
    else if (resolution === '1h' || resolution === '60') resolutionMinutes = 60;
    else resolutionMinutes = parseInt(resolution) || 1;

    const resolutionMs = resolutionMinutes * 60 * 1000;
    const timeframe = formatResolution(resolution);
    const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
    const normalizedSym = normalizeRealtimeSymbol(symbolInfo.name);

    let currentBar = null;
    let isActive = true;
    let lastTickTime = 0;
    let tickCount = 0;

    //Sanket v2.0 - Seed from getBars history so first tick extends the correct bar
    const seededBar = Datafeed._lastHistoryBars?.[historyKey];
    if (seededBar && Number.isFinite(seededBar.time)) {
      currentBar = { ...seededBar };
    }
    console.log(`[CHART] subscribeBars ${symbolInfo.name} res=${resolution} seeded=${currentBar ? new Date(currentBar.time).toISOString() : 'null'}`);

    //Sanket v2.0 - Diagnostic: wrap TV's onRealtimeCallback to detect silent rejections
    const _origCallback = onRealtimeCallback;
    const _wrappedCallback = (bar) => {
      try {
        _origCallback(bar);
      } catch (err) {
        console.error(`[CHART] onRealtimeCallback THREW:`, err.message, bar);
      }
    };
    //Sanket v2.0 - Use wrapped callback everywhere instead of raw onRealtimeCallback
    let _pushCount = 0;
    const pushBar = (bar) => {
      _pushCount++;
      if (_pushCount <= 5) {
        console.log(`[CHART-DIAG] pushBar#${_pushCount} sym="${symbolInfo.name}" bar=`, JSON.stringify(bar));
      }
      _wrappedCallback(bar);
    };
    //Sanket v2.0 - Bootstrap: fetch current running candle from backend so chart doesn't start empty
    const bootstrapLiveBar = async () => {
      try {
        const res = await fetch(
          `${API_URL}/prices/current-candle?symbol=${encodeURIComponent(symbolInfo.name)}&resolution=${encodeURIComponent(timeframe)}`
        );
        if (!res.ok || !isActive) return;
        const json = await res.json();
        if (!isActive) return;
        if (json?.success && json.candle && Number.isFinite(json.candle.time) && json.candle.time > 0) {
          const bar = {
            time: json.candle.time,
            open: Number(json.candle.open),
            high: Number(json.candle.high),
            low: Number(json.candle.low),
            close: Number(json.candle.close),
            volume: Number(json.candle.volume) || 0
          };
          //Sanket v2.0 - Only bootstrap if backend candle is same or newer than what ticks built
          if (!currentBar || bar.time >= currentBar.time) {
            currentBar = bar;
            Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
            Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
            pushBar(currentBar);
            console.log(`[CHART] ${symbolInfo.name} bootstrap time=${new Date(bar.time).toISOString()} close=${bar.close}`);
          }
        }
      } catch (_e) { /* non-fatal */ }
    };
    bootstrapLiveBar();

    //Sanket v2.0 - Core tick handler: standard TradingView lastBar + bucket pattern
    //Sanket v2.0 - Filters by symbol FIRST, then builds candle, then calls onRealtimeCallback directly
    const handlePriceUpdate = (e) => {
      if (!isActive) return;
      const { symbol, bid, ask } = e.detail;
      if (normalizeRealtimeSymbol(symbol) !== normalizedSym) return;

      //Sanket v2.0 - tickCount only increments for THIS symbol's ticks (not all symbols)
      tickCount++;
      lastTickTime = Date.now();

      const price = getChartExecutionPrice(bid, ask, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
      if (!Number.isFinite(price) || price <= 0) return;

      const tickTime = Date.now() + (Datafeed._serverTimeOffsetMs || 0);
      const bucketTime = Math.floor(tickTime / resolutionMs) * resolutionMs;

      if (!currentBar) {
        //Sanket v2.0 - No seeded bar: create first candle from tick
        currentBar = { time: bucketTime, open: price, high: price, low: price, close: price, volume: 1 };
      } else if (bucketTime > currentBar.time) {
        //Sanket v2.0 - New candle: open snaps to previous close for continuity
        currentBar = {
          time: bucketTime,
          open: currentBar.close,
          high: Math.max(currentBar.close, price),
          low: Math.min(currentBar.close, price),
          close: price,
          volume: 1
        };
      } else {
        //Sanket v2.0 - Same candle: update high/low/close
        currentBar = {
          ...currentBar,
          high: Math.max(currentBar.high, price),
          low: Math.min(currentBar.low, price),
          close: price,
          volume: (currentBar.volume || 0) + 1
        };
      }

      //Sanket v2.0 - Keep shared state fresh for re-subscriptions
      Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
      Datafeed._lastHistoryBars[historyKey] = { ...currentBar };

      //Sanket v2.0 - Push to TradingView on EVERY tick - single path, no intermediaries
      pushBar(currentBar);

      if (tickCount <= 3 || tickCount % 200 === 0) {
        console.log(`[CHART] ${symbolInfo.name} tick#${tickCount} time=${currentBar.time} close=${currentBar.close.toFixed(2)} bucket=${bucketTime}`);
      }
    };

    //Sanket v2.0 - Tab recovery: re-bootstrap when returning from inactive tab
    const handleTabVisibility = () => {
      if (document.visibilityState === 'visible' && isActive) {
        bootstrapLiveBar();
      }
    };
    document.addEventListener('visibilitychange', handleTabVisibility);

    //Sanket v2.0 - Data gap monitor: re-bootstrap if no ticks for 60s
    const dataGapMonitor = setInterval(() => {
      if (isActive && lastTickTime > 0 && Date.now() - lastTickTime > 60000) {
        lastTickTime = Date.now();
        bootstrapLiveBar();
      }
    }, 15000);

    //Sanket v2.0 - Subscribe to price stream + set priority
    priceStreamService.subscribeBars(symbolInfo.name);
    const existingPriority = Array.isArray(priceStreamService.prioritySymbols) ? priceStreamService.prioritySymbols : [];
    if (!existingPriority.includes(normalizedSym)) {
      priceStreamService.setPrioritySymbols([...existingPriority, normalizedSym]);
    }

    //Sanket v2.0 - Ghost cleanup: kill ALL existing subscriptions for same symbol before registering
    Datafeed._subscribers = Datafeed._subscribers || {};
    for (const [uid, sub] of Object.entries(Datafeed._subscribers)) {
      if (sub.symbol && normalizeRealtimeSymbol(sub.symbol) === normalizedSym) {
        getPriceEvents().removeEventListener("priceUpdate", sub.priceUpdate);
        if (sub.dataGapMonitor) clearInterval(sub.dataGapMonitor);
        if (sub.deactivate) sub.deactivate();
        delete Datafeed._subscribers[uid];
      }
    }
    Datafeed._subscribers[subscriberUID] = {
      priceUpdate: handlePriceUpdate,
      symbol: symbolInfo.name,
      dataGapMonitor,
      deactivate: () => { isActive = false; }
    };

    getPriceEvents().addEventListener("priceUpdate", handlePriceUpdate);

    return function cleanup() {
      isActive = false;
      clearInterval(dataGapMonitor);
      document.removeEventListener('visibilitychange', handleTabVisibility);
      priceStreamService.unsubscribeBars(symbolInfo.name);
      getPriceEvents().removeEventListener("priceUpdate", handlePriceUpdate);
      delete Datafeed._subscribers[subscriberUID];
      const remainingPriority = (priceStreamService.prioritySymbols || []).filter(s => s !== normalizedSym);
      priceStreamService.setPrioritySymbols(remainingPriority);
    };
  },

  unsubscribeBars: (subscriberUID) => {
    const sub = Datafeed._subscribers && Datafeed._subscribers[subscriberUID];
    if (sub) {
      getPriceEvents().removeEventListener("priceUpdate", sub.priceUpdate);
      if (sub.dataGapMonitor) clearInterval(sub.dataGapMonitor);
      if (sub.symbol) priceStreamService.unsubscribeBars(sub.symbol);
      if (sub.deactivate) sub.deactivate();
      delete Datafeed._subscribers[subscriberUID];
    }
  }
};

export default Datafeed;
