/**
 * Safely parses JSON from localStorage, handling "undefined" strings and parse errors.
 * @param {string} key - The localStorage key
 * @param {any} fallback - The fallback value if parsing fails or key is missing
 * @returns {any} - The parsed object/value or fallback
 */
export const getSafeJSON = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(key);
    
    // Handle literal "undefined" string which causes JSON.parse to fail
    if (item === null || item === "undefined") {
      return fallback;
    }

    return JSON.parse(item);
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    return fallback;
  }
};

/**
 * Safely sets JSON to localStorage.
 * @param {string} key - The localStorage key
 * @param {any} value - The value to stringify and store
 */
export const setSafeJSON = (key, value) => {
  try {
    if (value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

const safeLocalStorage = {
  get: getSafeJSON,
  set: setSafeJSON,
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
};

export default safeLocalStorage;
