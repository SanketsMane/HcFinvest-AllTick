/**
 * candleAggregator.js
 * Utility to synthesize higher timeframe candles from 1-minute raw data.
 */

/**
 * Aggregates 1-minute candles into a larger timeframe with gap filling.
 * This is the "Iterative Bucket" approach which guarantees continuity.
 * @param {Array} candles1m - Array of {time, open, high, low, close, volume}
 * @param {number} timeframeMinutes - The target timeframe in minutes
 * @returns {Array} Continuous aggregated candles
 */
export const aggregateToTimeframe = (candles1m, timeframeMinutes) => {
  if (!candles1m || candles1m.length === 0) return [];
  const intervalMs = timeframeMinutes * 60 * 1000;
  if (timeframeMinutes <= 1) return candles1m;

  // 1. Sort to ensure we iterate forward
  const sorted = [...candles1m].sort((a, b) => a.time - b.time);

  // 2. Identify start and end "buckets"
  const startBucket = Math.floor(sorted[0].time / intervalMs) * intervalMs;
  const endBucket = Math.floor(sorted[sorted.length - 1].time / intervalMs) * intervalMs;

  const result = [];
  let i = 0;
  let lastClose = sorted[0].close;

  // 3. Iterate through every single time bucket
  for (let t = startBucket; t <= endBucket; t += intervalMs) {
    let open = null;
    let high = -Infinity;
    let low = Infinity;
    let close = null;
    let volume = 0;
    let found = false;

    // Collect all 1m candles that fit in this target timeframe bucket
    while (i < sorted.length && sorted[i].time < t + intervalMs) {
      const c = sorted[i];
      if (open === null) open = c.open;
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      close = c.close;
      volume += (Number(c.volume) || 0);
      found = true;
      i++;
    }

    if (!found) {
      // Skip emitting flat candles if the gap to the next real data point is >= 12 hours (weekend)
      if (i < sorted.length && sorted[i].time - t >= 12 * 60 * 60 * 1000) {
        // Fast-forward t to the bucket of the next real candle
        const nextRealCandleBucket = Math.floor(sorted[i].time / intervalMs) * intervalMs;
        t = nextRealCandleBucket - intervalMs; // -intervalMs because the loop will += intervalMs
        continue;
      }
      open = high = low = close = lastClose;
      volume = 0;
    }

    result.push({
      time: t,
      open,
      high,
      low,
      close,
      volume
    });

    lastClose = close;
  }

  return result;
};

/**
 * Fills historical data gaps with "flat" candles.
 * Ensures the chart line is continuous even when no trading occurred.
 * @param {Array} candles - Array of {time, open, high, low, close, volume}
 * @param {number} intervalMinutes - Time interval in minutes
 * @param {number} until - Optional timestamp to fill up to (e.g., current time)
 * @returns {Array} Continuous candles
 */
export const fillGaps = (candles, intervalMinutes, until) => {
  if (!candles || candles.length === 0) return candles;
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const filled = [];
  
  // Ensure data is sorted by time before processing
  const sorted = [...candles].sort((a, b) => a.time - b.time);

  // 1. Fill gaps between candles
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    filled.push(current);

    const currentTime = current.time;
    const nextTime = next.time;

    const gapMs = nextTime - currentTime;
    
    //Sanket v2.0 - Skip weekend gaps (>72h) to prevent memory overflow, fill intra-session gaps with flat candles
    // 72h threshold covers standard forex weekend gaps (~62-64h Friday close → Sunday open)
    // Previously 48h caused all Monday opens to show visible chart breaks
    if (gapMs > intervalMs * 1.5 && gapMs < (72 * 60 * 60 * 1000)) {
      //Sanket v2.0 - Use bucket-aligned fill to prevent overshoot: stop BEFORE the next real candle's bucket
      const nextBucket = Math.floor(nextTime / intervalMs) * intervalMs;
      let fillTime = Math.floor(currentTime / intervalMs) * intervalMs + intervalMs;
      while (fillTime < nextBucket) {
        filled.push({
          time: fillTime,
          open: current.close,
          high: current.close,
          low: current.close,
          close: current.close,
          volume: 0.0001, // Micro-volume for better rendering
          isFilled: true
        });
        fillTime += intervalMs;
      }
    }
  }

  // 2. Push the last real candle
  const lastReal = sorted[sorted.length - 1];
  filled.push(lastReal);

  // 3. Proactive Filling: fill from last real candle up to 'until'
  if (until && Number.isFinite(until)) {
    const untilMs = until < 10000000000 ? until * 1000 : until;
    const lastBucket = Math.floor(lastReal.time / intervalMs) * intervalMs;
    const untilBucket = Math.floor(untilMs / intervalMs) * intervalMs;

    let fillTime = lastBucket + intervalMs;
    // Limit proactive padding to 2 hours max to prevent over-filling during long closures
    const maxPadding = 2 * 60 * 60 * 1000;
    const actualUntil = Math.min(untilBucket, lastBucket + maxPadding);

    while (fillTime <= actualUntil) {
      filled.push({
        time: fillTime,
        open: lastReal.close,
        high: lastReal.close,
        low: lastReal.close,
        close: lastReal.close,
        volume: 0.0001,
        isFilled: true,
        isPadding: true
      });
      fillTime += intervalMs;
    }
  }

  return filled;
};

/**
 * Validates the continuity of a candle dataset.
 * Logs warnings if any gaps are found.
 * @param {Array} candles - Sorted array of candles
 * @param {number} intervalMinutes - Expected interval in minutes
 * @returns {boolean} True if continuous, false if gaps exist
 */
export const validateContinuity = (candles, intervalMinutes) => {
  if (!candles || candles.length < 2) return true;
  const intervalMs = intervalMinutes * 60 * 1000;
  let gapCount = 0;

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].time - candles[i - 1].time;
    // We allow a small 10% jitter but anything larger is a gap
    if (diff > intervalMs * 1.1) {
      gapCount++;
      if (gapCount < 5) { // Log first few gaps to avoid console spam
        console.warn(`[Continuity] ⚠️ GAP DETECTED: ${Math.round(diff / 60000)}m gap between ${new Date(candles[i-1].time).toISOString()} and ${new Date(candles[i].time).toISOString()}`);
      }
    }
  }

  if (gapCount > 0) {
    console.warn(`[Continuity] Total gaps found in ${intervalMinutes}m dataset: ${gapCount}`);
    return false;
  }
  return true;
};

/**
 * Incrementally updates a candle list with a new price tick.
 * This is used for "Proactive Tier Sync" to avoid re-aggregating full history.
 * @param {Array} candles - Current candle list
 * @param {Object} tick - { price, time }
 * @param {number} timeframeMinutes - Timeframe in minutes
 * @returns {Array} Updated candle list
 */
export const updateCandleListWithTick = (candles, tick, timeframeMinutes) => {
  if (!candles) return [];
  if (!tick || !tick.price) return candles;

  const intervalMs = timeframeMinutes * 60 * 1000;
  const tickTime = typeof tick.time === 'number' ? tick.time : new Date(tick.time).getTime();
  const tickPrice = parseFloat(tick.price);
  const bucketTime = Math.floor(tickTime / intervalMs) * intervalMs;

  const updated = [...candles];
  if (updated.length === 0) {
    updated.push({
      time: bucketTime,
      open: tickPrice,
      high: tickPrice,
      low: tickPrice,
      close: tickPrice,
      volume: 1
    });
    return updated;
  }

  const lastIndex = updated.length - 1;
  const lastCandle = updated[lastIndex];

  if (lastCandle.time === bucketTime) {
    // ✍️ Update existing "Live" candle (IMMUTABLE UPDATE)
    updated[lastIndex] = {
      ...lastCandle,
      close: tickPrice,
      high: Math.max(lastCandle.high, tickPrice),
      low: Math.min(lastCandle.low, tickPrice),
      volume: (Number(lastCandle.volume) || 0) + 1
    };
  } else if (bucketTime > lastCandle.time) {
    // 🚀 NEW: Interpolation / Gap Filling logic
    // Fill the gap with flat candles if the gap represents less than 2 hours of missing data.
    // This maintains continuity for the chart library.
    const gapMs = bucketTime - lastCandle.time;
    if (gapMs > intervalMs && gapMs < 2 * 60 * 60 * 1000) {
      let fillTime = lastCandle.time + intervalMs;
      //Sanket v2.0 - Fill intermediate missed buckets with flat candles (capped at 10) to prevent chart holes
      let fillCount = 0;
      while (fillTime < bucketTime && fillCount < 10) {
        updated.push({
          time: fillTime,
          open: lastCandle.close,
          high: lastCandle.close,
          low: lastCandle.close,
          close: lastCandle.close,
          volume: 0,
          isInterpolated: true
        });
        fillTime += intervalMs;
        fillCount++;
      }
    }

    // Push the new real tick bucket
    const openPrice = lastCandle.close;
    updated.push({
      time: bucketTime,
      open: openPrice,
      high: Math.max(openPrice, tickPrice),
      low: Math.min(openPrice, tickPrice),
      close: tickPrice,
      volume: 1
    });
    
    // Performance: Maintain a reasonable buffer to avoid unbounded growth
    if (updated.length > 2000) {
      return updated.slice(-2000);
    }
  }

  return updated;
};
