/**
 * API Client for backend communication
 * Handles all HTTP requests with token management
 */

const API = {
  BASE_URL: 'http://localhost:8080',
  TOKEN_KEY: 'cashier_token',
  REFRESH_TOKEN_KEY: 'cashier_refresh_token',
  USER_KEY: 'cashier_user',
  refreshPromise: null,

  /**
   * Get stored authentication token
   */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /**
   * Get stored refresh token
   */
  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  },

  /**
   * Get stored user data
   */
  getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Set authentication token and user data
   */
  setAuth(token, user, refreshToken = null) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  /**
   * Clear authentication
   */
  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  /**
   * Refresh ID token using stored refresh token
   */
  async refreshAuthToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = (async () => {
      const response = await this.post('/auth/refresh', { refreshToken }, false);

      if (!response.success || !response.data?.idToken) {
        throw new Error(response.error || 'Failed to refresh session');
      }

      const user = this.getUser();
      this.setAuth(response.data.idToken, user, response.data.refreshToken);
      return response.data.idToken;
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  },

  handleSessionExpired() {
    this.clearAuth();
    window.location.href = '/';
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Build headers with authentication
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    return headers;
  },

  /**
   * Generic fetch wrapper
   */
  async request(method, endpoint, data = null, includeAuth = true, retryOn401 = true) {
    try {
      const options = { method, headers: this.getHeaders(includeAuth) };
      if (data) options.body = JSON.stringify(data);

      const response = await fetch(`${this.BASE_URL}${endpoint}`, options);

      if (response.status === 401 && includeAuth && retryOn401) {
        try {
          await this.refreshAuthToken();
          return this.request(method, endpoint, data, includeAuth, false);
        } catch (refreshError) {
          this.handleSessionExpired();
          throw new Error('Session expired. Please login again.');
        }
      }

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || `HTTP ${response.status}`);
      return json;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  },
  // async request(method, endpoint, data = null, includeAuth = true) {
  //   try {
  //     const options = {
  //       method,
  //       headers: this.getHeaders(includeAuth),
  //     };

  //     if (data) {
  //       options.body = JSON.stringify(data);
  //     }

  //     const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
  //     const json = await response.json();

  //     if (!response.ok) {
  //       throw new Error(json.error || `HTTP ${response.status}`);
  //     }

  //     return json;
  //   } catch (error) {
  //     console.error(`API Error [${method} ${endpoint}]:`, error);
  //     throw error;
  //   }
  // },

  /**
   * GET request
   */
  get(endpoint, includeAuth = true) {
    return this.request('GET', endpoint, null, includeAuth);
  },

  /**
   * POST request
   */
  post(endpoint, data, includeAuth = true) {
    return this.request('POST', endpoint, data, includeAuth);
  },

  /**
   * PUT request
   */
  put(endpoint, data, includeAuth = true) {
    return this.request('PUT', endpoint, data, includeAuth);
  },

  /**
   * DELETE request
   */
  delete(endpoint, includeAuth = true) {
    return this.request('DELETE', endpoint, null, includeAuth);
  },

  // ====== AUTH ENDPOINTS ======
  async login(username, password) {
    return this.post('/auth/login', { username, password }, false);
  },

  // ====== PRODUCT ENDPOINTS ======
  async getProducts(search = null) {
    const endpoint = search ? `/products?search=${encodeURIComponent(search)}` : '/products';
    return this.get(endpoint);
  },

  async getLowStockProducts(threshold = null) {
    if (threshold === null || threshold === undefined || threshold === '') {
      return this.get('/products/low-stock');
    }
    return this.get(`/products/low-stock?threshold=${encodeURIComponent(threshold)}`);
  },

  async createProduct(productData) {
    return this.post('/products', productData);
  },

  async updateProduct(productId, productData) {
    return this.put(`/products/${productId}`, productData);
  },

  async deleteProduct(productId) {
    return this.delete(`/products/${productId}`);
  },

  // ====== TRANSACTION ENDPOINTS ======
  async createTransaction(transactionData) {
    return this.post('/cart/cart', transactionData);
  },

  async getTransactions() {
    return this.get('/cart/cart');
  },

  async getTransaction(transactionId) {
    return this.get(`/cart/transactions/${transactionId}`);
  },

  // ====== REPORT ENDPOINTS ======
  async getDailyReport(date) {
    return this.get(`/reports/daily/${date}`);
  },

  async getMonthlyReport(year, month) {
    return this.get(`/reports/monthly/${year}/${month}`);
  },

  async getCashierPerformanceReport(startDate, endDate) {
    return this.get(`/reports/cashier-performance?startDate=${startDate}&endDate=${endDate}`);
  },

  async getProductSalesReport(startDate, endDate) {
    return this.get(`/reports/products?startDate=${startDate}&endDate=${endDate}`);
  },

  async getRevenueTrend(days = 30) {
    return this.get(`/reports/revenue-trend?days=${days}`);
  },
};
