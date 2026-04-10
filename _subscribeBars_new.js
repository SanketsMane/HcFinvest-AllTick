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
            onRealtimeCallback(currentBar);
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
      onRealtimeCallback(currentBar);

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
