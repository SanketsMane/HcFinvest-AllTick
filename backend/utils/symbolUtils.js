/**
 * v7.77 Symbol Normalization Utility (Backend)
 */

/**
 * Ensures symbol has the .i suffix and is uppercase.
 * Example: xauusd -> XAUUSD.i
 */
export const normalizeSymbol = (raw) => {
  if (!raw) return 'GLOBAL';
  const s = String(raw).trim().toUpperCase();
  if (s === 'GLOBAL') return 'GLOBAL';
  if (s.endsWith('.I')) return s.slice(0, -2) + '.i';
  return `${s}.i`;
};

/**
 * Migration helper: Renames non-.i keys in a layout object if applicable.
 */
export const migrateLayout = (layoutJson) => {
  if (!layoutJson || typeof layoutJson !== 'object') return layoutJson;
  
  // TradingView layouts are complex blobs, but we can look for 'symbol' or 'ticker' fields
  // if we were to do deep inspection. However, simply using the correct 'symbol' key 
  // in the database (Phase 5) is usually sufficient for resolving the desync.
  return layoutJson;
};
