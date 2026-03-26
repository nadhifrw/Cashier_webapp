/**
 * Storage Module
 * Wrapper around localStorage for consistent data management
 */

const Storage = {
  // Keys
  KEYS: {
    AUTH_TOKEN: 'cashier_token',
    AUTH_USER: 'cashier_user',
    CART: 'cashier_cart',
    PREFERENCES: 'cashier_prefs',
    THEME: 'cashier_theme',
    SESSION: 'cashier_session',
  },

  /**
   * Set item in localStorage
   */
  set(key, value) {
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value);
      }
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  /**
   * Get item from localStorage
   */
  get(key, isJSON = true) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;

      if (isJSON) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  /**
   * Clear all storage
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // ====== AUTH STORAGE ======

  /**
   * Save authentication token
   */
  setToken(token) {
    return this.set(this.KEYS.AUTH_TOKEN, token);
  },

  /**
   * Get authentication token
   */
  getToken() {
    return this.get(this.KEYS.AUTH_TOKEN, false);
  },

  /**
   * Remove authentication token
   */
  removeToken() {
    return this.remove(this.KEYS.AUTH_TOKEN);
  },

  /**
   * Save user data
   */
  setUser(user) {
    return this.set(this.KEYS.AUTH_USER, user);
  },

  /**
   * Get user data
   */
  getUser() {
    return this.get(this.KEYS.AUTH_USER, true);
  },

  /**
   * Remove user data
   */
  removeUser() {
    return this.remove(this.KEYS.AUTH_USER);
  },

  /**
   * Clear authentication data
   */
  clearAuth() {
    return this.removeToken() && this.removeUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  // ====== CART STORAGE ======

  /**
   * Save cart data
   */
  setCart(cart) {
    return this.set(this.KEYS.CART, cart);
  },

  /**
   * Get cart data
   */
  getCart() {
    return this.get(this.KEYS.CART, true) || [];
  },

  /**
   * Clear cart
   */
  clearCart() {
    return this.remove(this.KEYS.CART);
  },

  // ====== PREFERENCES ======

  /**
   * Save user preferences
   */
  setPreferences(prefs) {
    return this.set(this.KEYS.PREFERENCES, prefs);
  },

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.get(this.KEYS.PREFERENCES, true) || {};
  },

  /**
   * Update single preference
   */
  updatePreference(key, value) {
    const prefs = this.getPreferences();
    prefs[key] = value;
    return this.setPreferences(prefs);
  },

  /**
   * Get single preference
   */
  getPreference(key, defaultValue = null) {
    const prefs = this.getPreferences();
    return prefs[key] !== undefined ? prefs[key] : defaultValue;
  },

  // ====== THEME ======

  /**
   * Save theme preference
   */
  setTheme(theme) {
    return this.set(this.KEYS.THEME, theme);
  },

  /**
   * Get theme preference
   */
  getTheme() {
    return this.get(this.KEYS.THEME, false) || 'light';
  },

  // ====== SESSION ======

  /**
   * Save session data
   */
  setSession(data) {
    return this.set(this.KEYS.SESSION, {
      ...this.getSession(),
      ...data,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Get session data
   */
  getSession() {
    return this.get(this.KEYS.SESSION, true) || {};
  },

  /**
   * Get session item
   */
  getSessionItem(key) {
    const session = this.getSession();
    return session[key] || null;
  },

  /**
   * Clear session
   */
  clearSession() {
    return this.remove(this.KEYS.SESSION);
  },

  // ====== UTILITIES ======

  /**
   * Get storage size
   */
  getSize() {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length;
      }
    }
    return {
      bytes: size,
      kilobytes: (size / 1024).toFixed(2),
    };
  },

  /**
   * Export all storage data (for backup)
   */
  exportData() {
    const data = {};
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  },

  /**
   * Import storage data (for restore)
   */
  importData(data) {
    try {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
      return true;
    } catch (error) {
      console.error('Import data error:', error);
      return false;
    }
  },
};
