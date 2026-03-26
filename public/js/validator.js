/**
 * Input Validation Module
 * Handles validation for various input types
 */

const Validator = {
  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate payment amount
   */
  isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  },

  /**
   * Validate product data
   */
  isValidProduct(product) {
    if (!product) return false;
    return (
      product.id &&
      product.name &&
      typeof product.price === 'number' &&
      product.price > 0
    );
  },

  /**
   * Validate cart items
   */
  isValidCartItem(item) {
    return (
      item.id &&
      item.name &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    );
  },

  /**
   * Validate cart before checkout
   */
  isValidCart(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { valid: false, error: 'Cart is empty' };
    }

    for (const item of items) {
      if (!this.isValidCartItem(item)) {
        return { valid: false, error: `Invalid item: ${item.name || 'Unknown'}` };
      }
    }

    return { valid: true };
  },

  /**
   * Validate payment method
   */
  isValidPaymentMethod(method) {
    const validMethods = ['cash', 'qris'];
    return validMethods.includes(method);
  },

  /**
   * Validate checkout form
   */
  validateCheckout(paymentMethod, amountPaid, cartItems) {
    const errors = [];

    if (!this.isValidPaymentMethod(paymentMethod)) {
      errors.push('Invalid payment method');
    }

    if (!this.isValidAmount(amountPaid)) {
      errors.push('Amount paid must be a positive number');
    }

    const cartValidation = this.isValidCart(cartItems);
    if (!cartValidation.valid) {
      errors.push(cartValidation.error);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate user credentials
   */
  isValidCredentials(email, password) {
    const errors = [];

    if (!this.isValidEmail(email)) {
      errors.push('Invalid email format');
    }

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate phone number (Indonesian format)
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate quantity input
   */
  isValidQuantity(quantity) {
    const num = parseInt(quantity);
    return !isNaN(num) && num > 0;
  },

  /**
   * Validate date string (YYYY-MM-DD)
   */
  isValidDate(dateString) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
};
