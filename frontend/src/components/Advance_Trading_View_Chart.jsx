import { useEffect, useRef, useState, useCallback } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/priceStream';
import { TradeLineManager } from "../utils/TradeLineManager.js";
import { useInterpolation } from "../hooks/useInterpolation";
import { API_URL } from "../config/api";
import { canonicalSymbol, normalizeSymbol } from "../utils/symbolUtils.js";

// ─── v7.60 Configuration ───────────────────────────────────────────────────
const DEBOUNCE_SAVE_MS = 2000; // Auto-save after 2 seconds of inactivity

const getPriceDecimals = (symbol = '') => {
  const base = normalizeSymbol(symbol).replace(/\.I$/i, '');
  if (base.includes('JPY')) return 3;
  if (['XAUUSD', 'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'XLMUSD', 'TRXUSD', 'ETCUSD', 'NEARUSD', 'ALGOUSD'].includes(base)) return 2;
  if (base === 'XAGUSD') return 4;
  return 5;
};

const resolutionToMs = (resolution = '1') => {
  if (resolution === '1M' || resolution === 'M') return 30 * 24 * 60 * 60 * 1000;
  if (resolution === '1W' || resolution === 'W') return 7 * 24 * 60 * 60 * 1000;
  if (resolution === '1D' || resolution === 'D') return 24 * 60 * 60 * 1000;
  if (resolution === '240' || resolution === '4h') return 4 * 60 * 60 * 1000;
  if (resolution === '120' || resolution === '2h') return 2 * 60 * 60 * 1000;
  if (resolution === '60' || resolution === '1h') return 60 * 60 * 1000;
  return (parseInt(resolution, 10) || 1) * 60 * 1000;
};

const formatCountdown = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '--:--';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

//Sanket v2.0 - Production-grade live quote overlay for the chart.
// Do NOT depend on TradingView's built-in last-price bubble for smooth decimals:
// that bubble is derived from bar callbacks and will never feel exactly like a
// plain interpolated React number. This overlay uses the same scalar interpolation
// model as the BUY/SELL buttons, so the visible chart quote matches them exactly.
const ChartLiveQuoteOverlay = ({ chartRef, isChartReady, symbol, selectedSide, targetQuotePrice }) => {
  const displayQuote = useInterpolation(targetQuotePrice ?? 0, 0.15);
  const [overlay, setOverlay] = useState({ top: 0, countdown: '--:--', visible: false });
  const serverOffsetRef = useRef(0);

  useEffect(() => {
    const syncServerOffset = () => {
      if (typeof Datafeed.getServerTime !== 'function') return;
      Datafeed.getServerTime((serverTime) => {
        const serverMs = Number(serverTime) * 1000;
        if (Number.isFinite(serverMs) && serverMs > 0) {
          serverOffsetRef.current = serverMs - Date.now();
        }
      });
    };

    syncServerOffset();
    const intervalId = setInterval(syncServerOffset, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isChartReady || !chartRef.current || !Number.isFinite(displayQuote) || displayQuote <= 0) {
      setOverlay((prev) => prev.visible ? { ...prev, visible: false } : prev);
      return;
    }

    let rafId;
    const updateOverlay = () => {
      const chart = chartRef.current;
      const pane = chart?.getPanes?.()?.[0];
      const priceScale = pane?.getMainSourcePriceScale?.();
      const priceRange = priceScale?.getVisiblePriceRange?.();
      const paneHeight = pane?.getHeight?.();

      if (!priceRange || !Number.isFinite(priceRange.from) || !Number.isFinite(priceRange.to) ||
          !Number.isFinite(paneHeight) || paneHeight <= 0 || priceRange.to === priceRange.from) {
        rafId = requestAnimationFrame(updateOverlay);
        return;
      }

      const normalized = (priceRange.to - displayQuote) / (priceRange.to - priceRange.from);
      const top = Math.max(12, Math.min(paneHeight - 12, normalized * paneHeight));

      const now = Date.now() + serverOffsetRef.current;
      const resolutionMs = resolutionToMs(chart?.resolution?.() || '1');
      const barStart = Math.floor(now / resolutionMs) * resolutionMs;
      const countdown = formatCountdown((barStart + resolutionMs) - now);

      setOverlay((prev) => {
        if (prev.visible && Math.abs(prev.top - top) < 0.5 && prev.countdown === countdown) {
          return prev;
        }
        return { top, countdown, visible: true };
      });

      rafId = requestAnimationFrame(updateOverlay);
    };

    rafId = requestAnimationFrame(updateOverlay);
    return () => cancelAnimationFrame(rafId);
  }, [chartRef, displayQuote, isChartReady, symbol]);

  if (!overlay.visible || !Number.isFinite(displayQuote) || displayQuote <= 0) return null;

  const decimals = getPriceDecimals(symbol);
  const isBuy = selectedSide === 'BUY';
  const bubbleColor = isBuy ? '#2563eb' : '#ef4444';
  const lineColor = isBuy ? 'rgba(37,99,235,0.45)' : 'rgba(239,68,68,0.45)';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        className="absolute left-0 right-0"
        style={{ top: `${overlay.top}px`, transform: 'translateY(-50%)' }}
      >
        <div
          className="absolute left-0 right-[78px] border-t border-dotted"
          style={{ borderColor: lineColor }}
        />
        <div
          className="absolute right-0 flex w-[74px] flex-col items-center rounded-sm px-1 py-1 text-white shadow-sm"
          style={{ backgroundColor: bubbleColor }}
        >
          <div className="font-mono text-[11px] font-semibold leading-none">
            {displayQuote.toFixed(decimals)}
          </div>
          <div className="font-mono text-[10px] leading-none opacity-90">
            {overlay.countdown}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Institutional-Grade Trading Chart Component — v7.60
 * - Persists all chart settings, indicators, and drawings to the backend.
 * - Resolves symbol desync bugs by using absolute source-of-truth prop syncing.
 * - Supports multi-device state synchronization via MongoDB ChartLayout.
 */
const Advance_Trading_View_Chart = ({ 
  symbol = "XAUUSD", 
  trades = [], 
  onTradeModify, 
  isDarkMode = false, 
  onSymbolChange, 
  adminSpreads = {},
  selectedSide = 'MID'
}) => {
  const normalizedSymbol = normalizeSymbol(symbol);
  
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const managerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const lastSetSymbolRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  //Sanket v2.0 - Refs that always hold the latest trades/symbol props without stale closure.
  // The onChartReady useEffect has empty deps [] so its inner setTimeout captures stale values
  // from mount time (trades=[], symbol='XAUUSD'). If trades arrive after mount but before the
  // chart finishes initializing, the 600ms timeout fires with empty trades and no lines draw.
  // Refs update on every render synchronously — no stale-closure risk.
  const tradesRef = useRef(trades);
  tradesRef.current = trades;
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;
  // Gate: prevents useEffect([trades, symbol, isChartReady]) from syncing before the initial
  // 600ms TV-settle delay completes. Without this gate, the effect fires immediately on
  // isChartReady transition (TV still mid-load after widget.load()) and createShape returns null.
  const initialSyncDoneRef = useRef(false);
  
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  const [targetPrice, setTargetPrice] = useState(0);
  const [targetQuotePrice, setTargetQuotePrice] = useState(0);

  // ─── SMOOTH INTERPOLATION ──────────────────────────────────────────────────
  const displayPrice = useInterpolation(targetPrice, 0.2);

  // Sync interpolated price to manager for smooth SL/TP/PnL label updates
  useEffect(() => {
    if (isChartReady && managerRef.current) {
      //Sanket v2.0 - Only use interpolated price for trade line labels, NOT for TV candle updates.
      // Pushing candles at 60fps via requestAnimationFrame overwhelms TV's bar queue and freezes the chart.
      // TV candles are driven exclusively by real tick data via handlePriceUpdate in datafeed.js.
      managerRef.current.updateLivePrice(symbol, displayPrice);
    }
  }, [displayPrice, symbol, isChartReady]);

  // ─── GET USER ID ──────────────────────────────────────────────────────────
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?._id || user?.id;
    } catch (e) {
      return null;
    }
  };

  // ─── BACKEND PERSISTENCE LOGIC ────────────────────────────────────────────
  
  const saveChartToBackend = useCallback(async () => {
    const userId = getUserId();
    if (!userId || !widgetRef.current || !chartReadyRef.current) return;

    try {
      widgetRef.current.save((layoutJson) => {
        //Sanket v2.0 - Strip 'sources' (price line shapes) from saved layout.
        // Managed SL/TP/entry shapes have dynamic TV IDs that become stale on next session.
        // Loading stale shape IDs causes TV schema errors and "Can't find source" floods.
        // Trade lines are always re-created fresh by TradeLineManager on chart ready.
        try {
          if (layoutJson?.charts) {
            layoutJson.charts.forEach(chart => {
              if (chart.panes) {
                chart.panes.forEach(pane => {
                  if (pane.sources) {
                    pane.sources = pane.sources.filter(s =>
                      s.type !== 'HorzLine' && s.type !== 'PriceLine'
                    );
                  }
                });
              }
            });
          }
        } catch (e) {}

        fetch(`${API_URL}/chart/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            symbol: 'GLOBAL',
            layoutJson
          })
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
            }
          });
      });
    } catch (err) {
    }
  }, [symbol]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveChartToBackend, DEBOUNCE_SAVE_MS);
  }, [saveChartToBackend]);

  const loadChartFromBackend = async (widget) => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await fetch(`${API_URL}/chart/load/${userId}?symbol=GLOBAL`);
      const data = await res.json();
      
      if (data.success && data.layoutJson) {
        //Sanket v2.0 - Strip stale price line sources from saved layout before loading.
        // Old sessions may have baked-in HorzLine/PriceLine shapes with dead IDs → schema errors on load.
        try {
          const layout = data.layoutJson;
          if (layout?.charts) {
            layout.charts.forEach(chart => {
              if (chart.panes) {
                chart.panes.forEach(pane => {
                  if (pane.sources) {
                    pane.sources = pane.sources.filter(s =>
                      s.type !== 'HorzLine' && s.type !== 'PriceLine'
                    );
                  }
                });
              }
            });
          }
          widget.load(layout);
        } catch (e) {
          widget.load(data.layoutJson);
        }
      } else {
      }
    } catch (err) {
    }
  };

  // ─── Initialize TradingView widget ONCE ───────────────────────────────────
  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    if (widgetRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;
    const userId = getUserId();

    try {
      const widget = new window.TradingView.widget({
        symbol: normalizedSymbol,
        interval: "1",
        container: containerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        theme: isDarkMode ? "dark" : "light",
        autosize: true,
        datafeed: Datafeed,
        
        // Use client credentials to enable internal storage hooks if needed
        client_id: 'hcf_trading_v1',
        user_id: userId || 'anonymous',
        
        disabled_features: [
          "header_saveload",
          "use_localstorage_for_settings" // Disabled in favor of our backend system
        ],
        enabled_features: [
          "header_resolutions",
          "header_chart_type",
          "trading_objects",
          "side_toolbar_in_fullscreen_mode"
        ],
        overrides: {
          "paneProperties.background": isDarkMode ? "#0d0d0d" : "#ffffff",
          "scalesProperties.showSeriesLastValue": false,
          "mainSeriesProperties.showPriceLine": false,
          "mainSeriesProperties.showCountdown": false
        }
      });

      widget.onChartReady(async () => {
        
        // 1. Initial Load from Backend
        await loadChartFromBackend(widget);

        // 2. State Setup
        chartReadyRef.current = true;
        setIsChartReady(true);
        widgetRef.current = widget;
        chartRef.current = widget.activeChart();
        lastSetSymbolRef.current = normalizedSymbol;

        // 3. Subscription Hooks for Auto-Save
        chartRef.current.onIntervalChanged().subscribe(null, (interval) => {
          localStorage.setItem('hcf_chart_interval', interval);
          debouncedSave();
        });

        chartRef.current.onSymbolChanged().subscribe(null, () => {
          const sym = chartRef.current?.symbol?.();
          if (sym && onSymbolChange) onSymbolChange(sym);
          debouncedSave();
        });

        // 4. Persistence Listeners for Drawings/indicators/candle colors
        widget.subscribe('onAutoSaveNeeded', () => {
          debouncedSave();
        });

        // v7.83 Specific Style Listeners (Ensures candle colors save)
            widget.headerReady().then(() => {
                const headerContainer = widget.headerReady();
            });
        
        widget.activeChart().onChartTypeChanged().subscribe(null, () => {
           debouncedSave();
        });

        // 5. Initialize Trade Lines
        managerRef.current = new TradeLineManager(
          chartRef,
          (...args) => onTradeModify?.(...args)
        );
        managerRef.current.initialize(widget);
        //Sanket v2.0 - Delay initial syncTrades by 600ms. widget.load() causes TV to internally
        // re-process the chart layout. createShape called during this window returns null because
        // TV is still applying the layout state. The 600ms delay lets TV finish before we create
        // any managed shapes.
        // IMPORTANT: Read from tradesRef/symbolRef (not stale closure). The onChartReady callback
        // is inside useEffect([]) so trades/symbol captured here are the MOUNT-TIME values (empty
        // array). tradesRef.current is updated every render — always holds the latest trades.
        initialSyncDoneRef.current = false;
        setTimeout(() => {
          if (managerRef.current) {
            managerRef.current.syncTrades(tradesRef.current, symbolRef.current);
            initialSyncDoneRef.current = true; // Unlock subsequent useEffect syncs
          }
        }, 600);

        isInitializingRef.current = false;
      });

      return () => {
        isInitializingRef.current = false;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (managerRef.current) {
          managerRef.current.destroy();
          managerRef.current = null;
        }
        if (widgetRef.current) {
          widgetRef.current.remove();
          widgetRef.current = null;
          chartRef.current = null;
          chartReadyRef.current = false;
          setIsChartReady(false);
        }
      };
    } catch (err) {
      isInitializingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastThemeRef = useRef(isDarkMode ? "dark" : "light");

  // ─── Theme Sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !isChartReady) return;
    try {
      const newTheme = isDarkMode ? "dark" : "light";
      if (newTheme !== lastThemeRef.current) {
        widgetRef.current.changeTheme(newTheme);
        lastThemeRef.current = newTheme;
      }
    } catch (e) {
    }
  }, [isDarkMode, isChartReady]);

  // ─── CRITICAL: SYMBOL SYNC (Fixes XAU/GBP desync) ──────────────────────────
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current || !normalizedSymbol) return;
    
    // 🛡️ Prevent redundant setSymbol calls if already on the correct symbol
    const current = chartRef.current?.symbol?.();
    if (typeof current === 'string' && canonicalSymbol(current) === canonicalSymbol(normalizedSymbol)) {
      return;
    }

    if (widgetRef.current && chartReadyRef.current && normalizedSymbol !== lastSetSymbolRef.current) {
      widgetRef.current.setSymbol(normalizedSymbol, widgetRef.current.activeChart().resolution(), () => {
        lastSetSymbolRef.current = normalizedSymbol;
        if (managerRef.current) {
          managerRef.current.syncTrades(trades, symbol, true); // force sync to clear fossils
        }
      });
    }
  }, [normalizedSymbol, isChartReady, trades, symbol]);

  // ─── Sync trades ──────────────────────────────────────────────────────────
  // Sanket v2.0 - Added isChartReady as dep so this fires when chart becomes ready with
  // already-loaded trades (handles the race where trades arrive before onChartReady fires).
  // initialSyncDoneRef gate prevents premature sync before the 600ms TV-settle delay completes.
  useEffect(() => {
    if (!managerRef.current || !isChartReady) return;
    managerRef.current.setAdminSpreads(adminSpreads);
    Datafeed.setChartPriceSide(selectedSide);
    if (!initialSyncDoneRef.current) return; // Wait for 600ms initial sync to complete first
    managerRef.current.syncTrades(trades, symbol);
  }, [adminSpreads, trades, symbol, isChartReady, selectedSide]);

  // ─── Live price stream listener ───────────────────────────────────────────
  useEffect(() => {
    const handlePriceUpdate = (e) => {
      //Sanket v2.0 - Normalize both sides so XAUUSD.i matches XAUUSD tick events
      const tickSymbol = String(e.detail?.symbol || '').toUpperCase().replace(/\.I$/i, '');
      const chartSymbol = String(symbol || '').toUpperCase().replace(/\.I$/i, '');
      if (tickSymbol === chartSymbol) {
        const { bid, ask } = e.detail;
        setTargetPrice({ bid, ask });
        //Sanket v2.0 - Use the same scalar side quote as the BUY/SELL buttons.
        // This is the production-grade fix: the chart-side bubble should be its own
        // quote widget, not TradingView's internal last-price label.
        const nextQuote = selectedSide === 'SELL' ? Number(bid) : selectedSide === 'BUY' ? Number(ask) : (Number(bid) + Number(ask)) / 2;
        if (Number.isFinite(nextQuote) && nextQuote > 0) {
          setTargetQuotePrice(nextQuote);
        }
      }
    };
    const priceEvents = getPriceEvents();
    priceEvents.addEventListener('priceUpdate', handlePriceUpdate);
    return () => {
      priceEvents.removeEventListener("priceUpdate", handlePriceUpdate);
    };
  }, [symbol, selectedSide]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0d0d0d"
        }}
      />
      <ChartLiveQuoteOverlay
        chartRef={chartRef}
        isChartReady={isChartReady}
        symbol={symbol}
        selectedSide={selectedSide}
        targetQuotePrice={targetQuotePrice}
      />
    </div>
  );
};

export default Advance_Trading_View_Chart;
