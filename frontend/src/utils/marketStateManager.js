/**
 * Market State Manager
 * Evaluates whether a financial instrument is open or closed based on strict session rules.
 */

// Production registry of precise market hours (UTC based)
// Note: We use this strictly to drop flat ticks during closing hours.
const SESSION_REGISTRY = {
  // Forex & Metals: Opens Sunday 22:00 UTC, Closes Friday 22:00 UTC.
  // Using custom definition instead of standard TV to be perfectly unambiguous.
  'FOREX_METALS': {
    openDay: 0, // 0 = Sunday
    openHour: 22,
    openMin: 0,
    closeDay: 5, // 5 = Friday
    closeHour: 22,
    closeMin: 0
  },
  'CRYPTO': {
    is24x7: true
  } // Crypto never closes
};

class MarketStateManager {
  constructor() {
    this.statusMap = new Map();
  }

  getMarketProfile(symbol) {
    const s = String(symbol).toUpperCase();
    if (s.includes('BTC') || s.includes('ETH') || s.includes('BNB') || s.includes('SOL') || s.includes('XRP') || s.includes('ADA') || s.includes('DOGE') || s.includes('LTC')) {
      return SESSION_REGISTRY['CRYPTO'];
    }

    // Default to Forex/Metals/Standard Indices closure times.
    // If further granularity is needed (like US30 1-hour intraday breaks), you would define it here.
    return SESSION_REGISTRY['FOREX_METALS'];
  }

  /**
   * Deterministically returns if the market is open based on the synchronized server time.
   * @param {string} symbol - e.g., 'XAUUSD', 'EURUSD'
   * @param {number} serverTimeMs - Authoritative Date.now() + _serverTimeOffsetMs
   * @returns {boolean} true if open
   */
  isOpen(symbol, serverTimeMs) {
    const profile = this.getMarketProfile(symbol);
    
    if (profile.is24x7) return true;

    // We must validate using UTC consistently, regardless of client browser timezone.
    const dateObj = new Date(serverTimeMs);
    const day = dateObj.getUTCDay(); // 0(Sun) to 6(Sat)
    const hour = dateObj.getUTCHours();
    const min = dateObj.getUTCMinutes();
    const currentMins = hour * 60 + min;

    const openMins = profile.openHour * 60 + profile.openMin;
    const closeMins = profile.closeHour * 60 + profile.closeMin;

    // Saturday is inherently closed globally for these profiles.
    if (day === 6) return false;

    // Sunday logic: closed before openMins (22:00 UTC)
    if (day === profile.openDay) {
      if (currentMins < openMins) return false;
    }

    // Friday logic: closed after closeMins (22:00 UTC)
    if (day === profile.closeDay) {
      if (currentMins >= closeMins) return false;
    }

    return true; // Unambiguously open
  }
}

const marketStateManager = new MarketStateManager();
export default marketStateManager;
