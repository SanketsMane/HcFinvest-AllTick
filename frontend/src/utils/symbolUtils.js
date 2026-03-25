/**
 * v7.66 Symbol Canonicalization Utility
 * Standardizes symbol strings (removes .i, whitespace, converts to uppercase) 
 * for consistent comparison across different data sources.
 */
export const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  // Support for 6-7 char forex pairs and 3-4 char commodities/indices
  if (/^[A-Z]{6}[A-Z]$/.test(compact)) return compact.slice(0, 6);
  if (/^[A-Z]{6}/.test(compact)) return compact.slice(0, 6);
  return compact;
};
