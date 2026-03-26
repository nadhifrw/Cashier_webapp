/**
 * Shopping Cart Module
 * Manages cart state, calculations, and persistence
 */

const Cart = {
  items: [],
  STORAGE_KEY: 'cashier_cart',

  /**
   * Initialize cart from localStorage
   */
  init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load cart from storage');
        this.items = [];
      }
    }
  },

  /**
   * Save cart to localStorage
   */
  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    this.notifyListeners();
  },

  /**
   * Add item to cart
   */
  addItem(product, amount = null) {
    const existingItem = this.items.find(item => item.id === product.id);
    const step = Number(product.saleStep || (product.inventoryType === 'weight' ? 0.1 : 1));
    const increment = amount === null ? step : Number(amount);

    if (existingItem) {
      existingItem.quantity = Number(existingItem.quantity || 0) + increment;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: increment,
        soldUnit: product.soldUnit || 'pcs',
        inventoryType: product.inventoryType || 'unit',
        saleStep: step,
        image: product.image || null,
      });
    }

    this.save();
    return this.items;
  },

  /**
   * Remove item from cart
   */
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.save();
    return this.items;
  },

  /**
   * Update item quantity
   */
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.id === productId);
    const numericQuantity = Number(quantity);

    if (item) {
      if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
        return this.removeItem(productId);
      }
      item.quantity = numericQuantity;
      this.save();
    }

    return this.items;
  },

  /**
   * Get cart subtotal (before tax)
   */
  getSubtotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  /**
   * Get total with tax
   */
  getTotal(taxRate = 0) {
    // taxRate disabled (was 10% / 0.1)
    const subtotal = this.getSubtotal();
    return subtotal + (subtotal * taxRate);
  },

  /**
   * Get tax amount
   */
  getTax(taxRate = 0) {
    // taxRate disabled (was 10% / 0.1)
    return this.getSubtotal() * taxRate;
  },

  /**
   * Get item count
   */
  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  },

  /**
   * Clear entire cart
   */
  clear() {
    this.items = [];
    this.save();
    return this.items;
  },

  /**
   * Get all items
   */
  getItems() {
    return this.items;
  },

  /**
   * Check if cart is empty
   */
  isEmpty() {
    return this.items.length === 0;
  },

  /**
   * Cart change listeners
   */
  listeners: [],

  subscribe(callback) {
    this.listeners.push(callback);
  },

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.items));
  },
};

// Initialize cart on load
Cart.init();
