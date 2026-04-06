/**
 * PRODUCTION-GRADE CHART INTEGRATION EXAMPLE
 * Using TradingView Lightweight Charts + ChartSanitizer
 * 
 * Features:
 * 1. Strict OHLC Validation (Wick Correction)
 * 2. Anti-Spike Rejection (Spike Guard)
 * 3. 'Update Last' Logic (Candle Continuity)
 */

import { createChart } from 'lightweight-charts';
import { sanitizeBatch, validateRealtimeUpdate, getSpikeThreshold } from './chartSanitizer';

// --- INITIALIZATION ---
const chart = createChart(document.getElementById('chart-container'), {
  width: 800,
  height: 600,
  timeScale: { timeVisible: true, secondsVisible: false },
});

const candleSeries = chart.addCandlestickSeries();
let currentBar = null; // Track the forming bar locally
const SYMBOL = 'XAUUSD';

/**
 * 1. HISTORICAL DATA PIPELINE
 */
export async function loadHistoricalData(rawData) {
  // Raw Data -> Validation -> Filtering -> Rendering
  const sanitizedBars = sanitizeBatch(rawData, SYMBOL);
  
  if (sanitizedBars.length > 0) {
    currentBar = sanitizedBars[sanitizedBars.length - 1];
    candleSeries.setData(sanitizedBars);
  }
}

/**
 * 2. REAL-TIME UPDATE PIPELINE (The "Sanket" Pattern)
 */
export function handleLiveTick(tickPrice) {
  if (!currentBar) return;

  // 🛡️ Anti-Spike Guard: Do not allow a 5% jump in 1 tick for Gold
  const result = validateRealtimeUpdate({
    currentBar,
    nextPrice: tickPrice,
    symbol: SYMBOL,
    threshold: 5.0
  });

  if (!result.accepted) {
    console.warn(`[Chart] Dropping abnormal spike tick: ${tickPrice}`);
    return;
  }

  // ✅ Update only the LAST candle until timeframe rolls over
  currentBar = result.bar;
  candleSeries.update(currentBar);
}

/**
 * 3. TIMEFRAME ROLLOVER (Backend Heartbeat / Trigger)
 */
export function handleNewCandle(newCandle) {
  // Ensure the new candle is visually valid before pushing
  const validated = {
    ...newCandle,
    high: Math.max(newCandle.high, newCandle.open, newCandle.close, newCandle.low),
    low: Math.min(newCandle.low, newCandle.open, newCandle.close, newCandle.high)
  };
  
  currentBar = validated;
  candleSeries.update(currentBar);
}
