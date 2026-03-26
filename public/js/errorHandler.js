/**
 * Error Handler Module
 * Centralized error handling and custom error types
 */

// Custom Error Types
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = 'AUTH_ERROR';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'PERMISSION_ERROR';
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
    this.statusCode = statusCode;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.code = 'NOT_FOUND';
  }
}

class ServerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServerError';
    this.code = 'SERVER_ERROR';
  }
}

const ErrorHandler = {
  /**
   * Handle API errors
   */
  handleAPIError(error, context = '') {
    console.error(`API Error [${context}]:`, error);

    // Handle different error types
    if (error.statusCode === 401) {
      return {
        message: 'Session expired. Please login again.',
        code: 'AUTH_EXPIRED',
        action: 'redirect_login',
      };
    }

    if (error.statusCode === 403) {
      return {
        message: 'You do not have permission to access this resource.',
        code: 'PERMISSION_DENIED',
        action: 'show_error',
      };
    }

    if (error.statusCode === 404) {
      return {
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        action: 'show_error',
      };
    }

    if (error.statusCode === 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        action: 'show_error',
      };
    }

    if (error.statusCode === 422) {
      return {
        message: error.message || 'Invalid data provided.',
        code: 'VALIDATION_ERROR',
        action: 'show_error',
      };
    }

    // Network error
    if (!error.statusCode) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        action: 'show_error',
      };
    }

    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      action: 'show_error',
    };
  },

  /**
   * Handle validation errors
   */
  handleValidationError(errors) {
    console.warn('Validation errors:', errors);

    if (Array.isArray(errors)) {
      return {
        message: errors[0] || 'Validation failed',
        errors,
        code: 'VALIDATION_ERROR',
        action: 'show_error',
      };
    }

    return {
      message: errors || 'Validation failed',
      code: 'VALIDATION_ERROR',
      action: 'show_error',
    };
  },

  /**
   * Handle authentication errors
   */
  handleAuthError(error) {
    console.error('Authentication error:', error);

    return {
      message: 'Authentication failed. Please check your credentials.',
      code: 'AUTH_FAILED',
      action: 'redirect_login',
    };
  },

  /**
   * Log error to console with formatting
   */
  log(error, level = 'error') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (error instanceof Error) {
      console.log(`${prefix} ${error.name}: ${error.message}`);
      if (error.code) {
        console.log(`${prefix} Code: ${error.code}`);
      }
      if (error.stack && level === 'error') {
        console.log(`${prefix} Stack:`, error.stack);
      }
    } else {
      console.log(`${prefix}`, error);
    }
  },

  /**
   * Retry function with exponential backoff
   */
  async retry(fn, maxAttempts = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
        }
      }
    }

    throw lastError;
  },

  /**
   * Safely execute async function with error handling
   */
  async safeExecute(fn, context = 'Operation') {
    try {
      return {
        success: true,
        data: await fn(),
      };
    } catch (error) {
      this.log(error, 'error');
      return {
        success: false,
        error: this.handleAPIError(error, context),
      };
    }
  },

  /**
   * Parse and format error message
   */
  parseErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error.message) {
      return error.message;
    }

    if (error.error) {
      return error.error;
    }

    return 'An unexpected error occurred';
  },

  /**
   * Create user-friendly error message
   */
  getUserMessage(error) {
    const message = this.parseErrorMessage(error);

    // Map technical errors to user-friendly messages
    const errorMap = {
      'Insufficient permissions': 'Anda tidak memiliki akses ke fitur ini',
      'Not authenticated': 'Silakan login terlebih dahulu',
      'Invalid credentials': 'Email atau password salah',
      'User not found': 'Pengguna tidak ditemukan',
      'Product not found': 'Produk tidak ditemukan',
      'Network error': 'Koneksi internet bermasalah. Silakan coba lagi.',
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (message.includes(key)) {
        return value;
      }
    }

    return message;
  },
};

// Export error types
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NetworkError,
    NotFoundError,
    ServerError,
    ErrorHandler,
  };
}
