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
  if (!compact) return '';
  // Standardize 6-char pairs (e.g. EURUSD)
  if (compact.length >= 6) return compact.slice(0, 6);
  return compact;
};

/**
 * Ensures symbol has the .i suffix.
 * Example: XAUUSD -> XAUUSD.i
 */
export const ensureISuffix = (raw) => {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (s.toLowerCase().endsWith('.i')) return s;
  return `${s}.i`;
};

/**
 * Complete normalization: Uppercase and .i suffix.
 * Example: xauusd -> XAUUSD.i
 */
export const normalizeSymbol = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  if (s.endsWith('.I')) return s.slice(0, -2) + '.i';
  return `${s}.i`;
};
