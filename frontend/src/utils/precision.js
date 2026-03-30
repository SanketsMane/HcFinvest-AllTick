/**
 * v7.80 Symbol Precision Utility
 * 
 * Centralized logic to determine price scale and decimal places for any instrument.
 * Ensures that Sl/TP rounding on the frontend matches backend expectations.
 */

import { canonicalSymbol } from './symbolUtils';

export const getInstrumentInfo = (symbol) => {
  const s = canonicalSymbol(symbol).toUpperCase();
  
  // Default values (Forex: 5 decimals, pricescale 100000)
  let pricescale = 100000;
  let decimals = 5;

  if (s.includes("JPY") || s.includes("XAG") || s.includes("NGAS") || s.includes("OIL") || s.includes("WTI") || s.includes("BRENT")) {
    pricescale = 1000;
    decimals = 3;
  } else if (s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("BNB") || s.includes("SOL") || s.includes("LTC") || s.includes("US500") || s.includes("SPX")) {
    pricescale = 100;
    decimals = 2;
  } else if (s.includes("US30") || s.includes("US100") || s.includes("NAS100") || s.includes("UK100") || s.includes("GER40") || s.includes("FRA40") || s.includes("SPA35") || s.includes("ES35")) {
    pricescale = 10;
    decimals = 1;
  } else if (s.includes("XRP") || s.includes("ADA") || s.includes("DOGE") || s.includes("SHIB")) {
    pricescale = 100000;
    decimals = 5;
  }

  return { pricescale, decimals };
};

/**
 * Rounds a price to the correct number of decimals for the given instrument.
 */
export const roundPrice = (price, symbol) => {
  const { decimals } = getInstrumentInfo(symbol);
  return parseFloat(price.toFixed(decimals));
};
