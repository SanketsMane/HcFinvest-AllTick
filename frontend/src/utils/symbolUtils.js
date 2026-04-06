/**
 * v7.77 Symbol Canonicalization Utility
 * Standardizes symbol strings for system-wide consistency.
 */

/**
 * Strips .i suffix and converts to uppercase for comparison.
 */
export const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/\.I$/i, '').replace(/[^A-Z0-9]/g, '');
  //Sanket v2.0 - Removed 6-char truncation: it corrupted 7+ char symbols (DOGEUSD→DOGESU, MATICUSD→MATICU)
  // breaking spread config lookups in getAdminMarkupValue silently returning 0 markup for those instruments
  return compact;
};

/**
 * Ensures symbol is normalized (uppercase, no .i suffix).
 * Backward compat: strips .i from old saved symbols.
 * Example: XAUUSD.i -> XAUUSD
 */
//Sanket v2.0 - Changed to strip .i suffix instead of adding it
export const ensureISuffix = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  return s.replace(/\.I$/i, '');
};

/**
 * Complete normalization: Uppercase, no .i suffix.
 * Example: xauusd.i -> XAUUSD
 */
//Sanket v2.0 - Changed to strip .i suffix instead of adding it
export const normalizeSymbol = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  return s.replace(/\.I$/i, '');
};
