/**
 * CHART SANITIZER (Production-Grade)
 * Refined logic for high-accuracy candlestick charts (TradingView/Exness style)
 * 
 * Functions:
 * 1. STRICT OHLC VALIDATION: Ensures visual integrity (H>=O/C>=L)
 * 2. ANTI-SPIKE FILTER: Rejects "fat finger" or outlier data jumps
 * 3. GAP HANDLING: Detects time discontinuity
 */

const DEFAULT_THRESHOLD_FX = 3.0; // 3% jump max for Forex
const DEFAULT_THRESHOLD_COMMODITY = 5.0; // 5% for Gold/Oil/Indices
const DEFAULT_THRESHOLD_CRYPTO = 20.0; // 20% for Crypto volatility

/**
 * Returns the appropriate spike rejection threshold based on asset class
 */
export const getSpikeThreshold = (symbol = '') => {
  const upper = String(symbol).toUpperCase();
  if (['BTC','ETH','SOL','BNB','DOGE','XRP','ADA','LTC'].some(s => upper.includes(s))) return DEFAULT_THRESHOLD_CRYPTO;
  if (['XAU','XAG','OIL','NGAS','COPPER','US30','US100','US500','UK100','GER40'].some(s => upper.includes(s))) return DEFAULT_THRESHOLD_COMMODITY;
  return DEFAULT_THRESHOLD_FX;
};

/**
 * Validates and corrects a single candle's OHLC integrity.
 * Ensures the 'High' is always the highest and 'Low' is the lowest.
 */
export const validateOHLC = (bar) => {
  if (!bar) return null;
  const { open, high, low, close } = bar;
  
  const validated = {
    ...bar,
    open: Number(open),
    close: Number(close),
    // Correction: Force High and Low to be mathematically valid
    high: Math.max(Number(high), Number(open), Number(close), Number(low)),
    low: Math.min(Number(low), Number(open), Number(close), Number(high)),
  };

  if (![validated.open, validated.high, validated.low, validated.close].every(Number.isFinite)) {
    console.error(`[Sanitizer] Invalid OHLC values for candle @ ${bar.time}`);
    return null;
  }

  return validated;
};

/**
 * Checks if a price move is an abnormal "Spike" (likely a data error)
 */
export const isSpike = (currentPrice, previousPrice, thresholdPct = 3.0) => {
  if (!previousPrice || previousPrice <= 0 || !currentPrice || currentPrice <= 0) return false;
  const changePct = (Math.abs(currentPrice - previousPrice) / previousPrice) * 100;
  return changePct > thresholdPct;
};

/**
 * Sanitizes an entire batch of historical bars.
 * - Removes invalid candles
 * - Filters out spikes
 * - Corrects OHLC visual artifacts
 */
export const sanitizeBatch = (bars = [], symbol = '', threshold = null) => {
  if (!Array.isArray(bars) || bars.length === 0) return [];
  
  const limit = threshold || getSpikeThreshold(symbol);
  const validated = [];
  let lastValidClose = null;

  // 1. Initial Pass: Sort and basic validation
  const sorted = [...bars].sort((a, b) => a.time - b.time);

  sorted.forEach((rawBar) => {
    const bar = validateOHLC(rawBar);
    if (!bar) return;

    // 2. Anti-Spike Filter
    if (lastValidClose !== null) {
      if (isSpike(bar.close, lastValidClose, limit)) {
        console.warn(`[Sanitizer] Rejected Spike on ${symbol}: ${lastValidClose} -> ${bar.close} (> ${limit}%)`);
        return; // Ignore this candle
      }
    }

    validated.push(bar);
    lastValidClose = bar.close;
  });

  return validated;
};

/**
 * Gap Handling: Identifies where candles are missing and returns discontinuity metadata.
 * Note: TradingView Lightweight Charts handles gaps by just stopping the line, 
 * but you can also choose to fill with "flat" candles for continuity.
 */
export const getGaps = (bars = [], timeframeMs = 60000) => {
  const gaps = [];
  for (let i = 1; i < bars.length; i++) {
    const diff = bars[i].time - bars[i - 1].time;
    if (diff > timeframeMs * 1.5) {
      gaps.push({
        start: bars[i - 1].time,
        end: bars[i].time,
        missingCount: Math.floor(diff / timeframeMs) - 1
      });
    }
  }
  return gaps;
};

/**
 * Real-time Update Guard: Validates a live price update against the current forming candle.
 */
export const validateRealtimeUpdate = ({ currentBar, nextPrice, symbol, threshold = null }) => {
  if (!currentBar) return { accepted: true };
  
  const limit = threshold || getSpikeThreshold(symbol);
  
  // 1. Consistency Check: Price must not jump too far from the current bar's close
  if (isSpike(nextPrice, currentBar.close, limit)) {
    console.warn(`[Sanitizer] Rejected Realtime Spike on ${symbol}: ${currentBar.close} -> ${nextPrice}`);
    return { accepted: false, reason: 'spike_detected' };
  }

  //Sanket v2.0 - Cap the H/L wick at spike threshold even after accepting the tick price.
  // Without this, currentBar.high could drift unbounded if a previously corrupt tick set it high
  // before spike detection was added. Re-clamp every accepted update to stay within bounds.
  const maxAllowed = currentBar.close * (1 + limit / 100);
  const minAllowed = currentBar.close * (1 - limit / 100);

  // 2. OHLC Progression: Returns the updated bar with correct High/Low tracking
  const updatedBar = {
    ...currentBar,
    high: Math.min(Math.max(currentBar.high, nextPrice), maxAllowed),
    low: Math.max(Math.min(currentBar.low, nextPrice), minAllowed),
    close: nextPrice
  };

  return { accepted: true, bar: updatedBar };
};
