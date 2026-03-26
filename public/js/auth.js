/**
 * Authentication Module
 * Handles login, registration, and auth state management
 */

const Auth = {
  /**
   * Login user
   */
  async login(username, password) {
    try {
      const response = await API.login(username, password);
      
      if (response.success && response.data) {
        const { idToken, refreshToken, user } = response.data;
        API.setAuth(idToken, user, refreshToken);
        return { success: true, user };
      }
      
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout user
   */
  logout() {
    API.clearAuth();
    this.redirectToLogin();
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return API.getUser();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return API.isAuthenticated();
  },

  /**
   * Check if current user is admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  /**
   * Check if current user is cashier
   */
  isCashier() {
    const user = this.getCurrentUser();
    return user && user.role === 'cashier';
  },

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    window.location.href = '/';
  },

  /**
   * Redirect to dashboard based on role
   */
  redirectToDashboard() {
    const user = this.getCurrentUser();
    
    if (!user) {
      this.redirectToLogin();
      return;
    }

    if (user.role === 'admin') {
      window.location.href = '/admin.html';
    } else if (user.role === 'cashier') {
      window.location.href = '/cashier.html';
    } else {
      this.redirectToLogin();
    }
  },

  /**
   * Require authentication
   * Redirects to login if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      this.redirectToLogin();
      return false;
    }
    return true;
  },

  /**
   * Require admin role
   * Redirects to login if not admin
   */
  requireAdmin() {
    if (!this.isAdmin()) {
      alert('You need admin privileges to access this page');
      this.redirectToLogin();
      return false;
    }
    return true;
  },

  /**
   * Require cashier role
   * Redirects to login if not cashier
   */
  requireCashier() {
    if (!this.isCashier()) {
      alert('You need cashier privileges to access this page');
      this.redirectToLogin();
      return false;
    }
    return true;
  },
};

/**
 * Check auth on page load
 * Redirect to dashboard if already logged in
 */
document.addEventListener('DOMContentLoaded', function() {
  // Only redirect on login page itself
  if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
    if (Auth.isAuthenticated()) {
      Auth.redirectToDashboard();
    }
  }
});
