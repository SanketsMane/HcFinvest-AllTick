/**
 * symbols.js - The Single Source of Truth for all Financial Instruments
 * Standardizes symbol canonicalization, provider mapping, and market sessions.
 */

export const SYMBOL_REGISTRY = {
  // --- MAJOR FOREX ---
  'EURUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURUSD' },
  'GBPUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPUSD' },
  'USDJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'USDJPY' },
  'USDCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'USDCHF' },
  'AUDUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'AUDUSD' },
  'NZDUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'NZDUSD' },
  'USDCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'USDCAD' },

  // --- MINOR / CROSS FOREX ---
  'EURGBP': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURGBP' },
  'EURJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'EURJPY' },
  'GBPJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'GBPJPY' },
  'EURAUD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURAUD' },
  'EURCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURCAD' },
  'EURCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURCHF' },
  'AUDJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'AUDJPY' },
  'CADJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'CADJPY' },
  'CHFJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'CHFJPY' },
  'AUDNZD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'AUDNZD' },
  'AUDCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'AUDCAD' },
  'CADCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'CADCHF' },
  'NZDJPY': { type: 'forex', pricescale: 100,    session: '2200-2200:12345', providerCode: 'NZDJPY' },
  'GBPAUD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPAUD' },
  'GBPCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPCAD' },
  'GBPCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPCHF' },
  'GBPNZD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPNZD' },
  'AUDCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'AUDCHF' },
  'NZDCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'NZDCAD' },
  'NZDCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'NZDCHF' },
  'EURNZD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURNZD' },

  // --- COMMODITIES & METALS ---
  'XAUUSD': { type: 'commodity', pricescale: 100,  session: '2200-2200:12345', providerCode: 'XAUUSD' },
  'XAGUSD': { type: 'commodity', pricescale: 1000, session: '2200-2200:12345', providerCode: 'XAGUSD' },
  'USOIL':  { type: 'commodity', pricescale: 100,  session: '2200-2200:12345', providerCode: 'USOIL' },
  'UKOIL':  { type: 'commodity', pricescale: 100,  session: '2200-2200:12345', providerCode: 'UKOIL' },
  'NGAS':   { type: 'commodity', pricescale: 1000, session: '2200-2200:12345', providerCode: 'NGAS' },
  'COPPER': { type: 'commodity', pricescale: 1000, session: '2200-2200:12345', providerCode: 'COPPER' },

  // --- CRYPTO ---
  'BTCUSD':  { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'BTCUSDT' },
  'ETHUSD':  { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'ETHUSDT' },
  'BNBUSD':  { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'BNBUSDT' },
  'SOLUSD':  { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'SOLUSDT' },
  'DOGEUSD': { type: 'crypto', pricescale: 100000, session: '24x7', providerCode: 'DOGEUSDT' },
  'LTCUSD':  { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'LTCUSDT' },
  'XRPUSD':  { type: 'crypto', pricescale: 10000, session: '24x7', providerCode: 'XRPUSDT' },
  'ADAUSD':  { type: 'crypto', pricescale: 10000, session: '24x7', providerCode: 'ADAUSDT' },

  // --- INDICES ---
  'US30':   { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'US30' },
  'US500':  { type: 'index', pricescale: 100, session: '2200-2200:12345', providerCode: 'US500' },
  'US100':  { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'US100' },
  'UK100':  { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'UK100' },
  'DE30':   { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'GER30' },
  'FR40':   { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'FRA40' },
  'ES35':   { type: 'index', pricescale: 10,  session: '2200-2200:12345', providerCode: 'SPA35' }
};

/**
 * Universal Symbol Normalizer
 * Strips all suffixes (.i, .f, etc.) and special chars to return canonical ID.
 */
export const normalizeSymbol = (symbol = '') => {
  if (!symbol) return '';
  return String(symbol)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.[A-Z]$/i, '') // Strips any single-letter suffix like .f, .c
    .replace(/[^A-Z0-9]/g, '');
};

/**
 * Retrieves full metadata for a symbol using strict normalization.
 */
export const getSymbolMetadata = (symbol) => {
  const clean = normalizeSymbol(symbol);
  return SYMBOL_REGISTRY[clean] || null;
};
