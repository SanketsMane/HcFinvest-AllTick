import { useEffect, useRef, useState } from "react";
import Datafeed from "../services/datafeed.js";
import { getPriceEvents } from '../services/priceStream';
import { TradeLineManager } from "../utils/TradeLineManager.js";

// ─── v7.55 localStorage Keys ────────────────────────────────────────────────
const LS_SYMBOL   = 'hcf_chart_symbol';
const LS_INTERVAL = 'hcf_chart_interval';

const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  if (/^[A-Z]{6}[A-Z]$/.test(compact)) return compact.slice(0, 6);
  if (/^[A-Z]{6}/.test(compact)) return compact.slice(0, 6);
  return compact;
};

/**
 * Production-Grade Trading Chart Component — v7.55 (RESTORED PERSISTENCE)
 */
const Advance_Trading_View_Chart = ({ symbol = "XAUUSD", trades = [], onTradeModify }) => {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const chartRef = useRef(null);
  const managerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const latestSymbolRef = useRef(symbol);
  const latestTradesRef = useRef(trades);
  const latestOnTradeModifyRef = useRef(onTradeModify);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartReadyRef = useRef(false);
  const currentPriceRef = useRef(null);

  useEffect(() => {
    latestSymbolRef.current = symbol;
    latestTradesRef.current = trades;
    latestOnTradeModifyRef.current = onTradeModify;

    // v7.55: Persistent symbol tracking
    if (symbol) {
      try { localStorage.setItem(LS_SYMBOL, symbol); } catch (e) {}
    }
  }, [symbol, trades, onTradeModify]);

  useEffect(() => {
    if (!window.TradingView || !containerRef.current) return;
    if (widgetRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;

    try {
      // Read saved state
      const savedInterval = localStorage.getItem(LS_INTERVAL) || "1";
      const initSymbol = latestSymbolRef.current || localStorage.getItem(LS_SYMBOL) || "XAUUSD";

      const widget = new window.TradingView.widget({
        symbol: initSymbol,
        interval: savedInterval,
        container: containerRef.current,
        library_path: "/charting_library/",
        load_last_chart: true, // ≡ƒ¢í∩╕Å CRITICAL: Must be true to restore drawings and indicator states
        locale: "en",
        theme: "dark",
        autosize: true,
        datafeed: Datafeed,
        symbol_search_request_delay: 1000,
        
        // ≡ƒ¢í∩╕Å Senior Dev Persistence Config
        client_id: 'hcf_trading_v1',
        user_id: 'hcf_production_user',
        
        disabled_features: [
          "header_saveload",
          "create_volume_indicator_by_default"
        ],
        enabled_features: [
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "header_resolutions",
          "header_chart_type",
          "trading_objects"
        ],
        overrides: {
          "paneProperties.background": "#0d0d0d",
          // Do not override mainSeriesProperties.style here to allow color persistence
        }
      });

      widget.onChartReady(() => {
        chartReadyRef.current = true;
        setIsChartReady(true);
        console.log(`[Trading v7.55] Chart Ready: ${initSymbol} @ ${savedInterval}`);
        
        widgetRef.current = widget;
        chartRef.current = widget.activeChart();

        // Save interval preference
        chartRef.current.onIntervalChanged().subscribe(null, (interval) => {
            try { localStorage.setItem(LS_INTERVAL, interval); } catch (e) {}
        });

        // Instantiate manager
        managerRef.current = new TradeLineManager(chartRef, (...args) => latestOnTradeModifyRef.current?.(...args));
        managerRef.current.initialize(widget);
        
        // Initial sync
        managerRef.current.syncTrades(latestTradesRef.current, latestSymbolRef.current);

        // ≡ƒ¢í∩╕Å Persistence Guard: Ensure trade lines are synced after layout restoration
        setTimeout(() => {
          if (managerRef.current && chartReadyRef.current) {
            managerRef.current.syncTrades(latestTradesRef.current, latestSymbolRef.current);
          }
        }, 1500);

        isInitializingRef.current = false;
      });

      return () => {
        isInitializingRef.current = false;
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
      console.error('[Trading] Chart Init error:', err);
    }
  }, []);

  // Sync symbol changes
  useEffect(() => {
    if (!widgetRef.current || !chartReadyRef.current || !symbol) return;
    try {
      const current = chartRef.current?.symbol?.();
      if (typeof current === 'string' && canonicalSymbol(current) === canonicalSymbol(symbol)) return;
    } catch (e) {}

    const savedInterval = localStorage.getItem(LS_INTERVAL) || "1";
    try {
      widgetRef.current.setSymbol(symbol, savedInterval, () => {
        if (managerRef.current) {
          managerRef.current.syncTrades(latestTradesRef.current, symbol);
        }
      });
    } catch (e) {
      console.error('[Trading] setSymbol error:', e);
    }
  }, [symbol, isChartReady]);

  // Sync trades
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.syncTrades(trades, symbol);
    }
  }, [trades, symbol]);

  // Live price stream
  useEffect(() => {
    const handlePriceUpdate = (e) => {
      if (e.detail?.symbol === symbol) {
        currentPriceRef.current = e.detail.bid;
      }
    };
    const priceEvents = getPriceEvents();
    priceEvents.addEventListener('priceUpdate', handlePriceUpdate);
    return () => {
      priceEvents.removeEventListener("priceUpdate", handlePriceUpdate);
    };
  }, [symbol]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "600px",
        backgroundColor: "#0d0d0d"
      }} 
    />
  );
};

export default Advance_Trading_View_Chart;
