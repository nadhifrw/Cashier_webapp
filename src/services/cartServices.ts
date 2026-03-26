import { CartItem } from '../models/transaction';
import { ProductServices } from './productServices';

// In-memory cart storage (per session)
// For production, consider Redis or session storage
const carts: Map<string, CartItem[]> = new Map();

const getAvailableQuantity = (product: { quantityOnHand?: number; stock?: number }): number => {
  return Number(product.quantityOnHand ?? product.stock ?? 0);
};

export const cartService = {
  // Get cart for a session
  getCart(sessionId: string): CartItem[] {
    return carts.get(sessionId) || [];
  },

  // Add item to cart
  async addItem(sessionId: string, productId: string, quantity: number = 1): Promise<CartItem[] | null> {
    const product = await ProductServices.getById(productId);
    const availableQuantity = product ? getAvailableQuantity(product) : 0;
    
    if (!product) return null;
    if (availableQuantity < quantity) return null;
    
    const cart = this.getCart(sessionId);
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (availableQuantity < newQuantity) return null;
      
      existingItem.quantity = newQuantity;
      existingItem.subtotal = existingItem.price * newQuantity;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price,
        quantity,
        subtotal: product.price * quantity
      });
    }
    
    carts.set(sessionId, cart);
    return cart;
  },

  async updateQuantity(sessionId: string, productId: string, quantity: number): Promise<CartItem[] | null> {
    if (quantity <= 0) {
      return this.removeItem(sessionId, productId);
    }
    
    const product = await ProductServices.getById(productId);
    const availableQuantity = product ? getAvailableQuantity(product) : 0;
    if (!product || availableQuantity < quantity) return null;
    
    const cart = this.getCart(sessionId);
    const item = cart.find(item => item.productId === productId);
    
    if (!item) return null;
    
    item.quantity = quantity;
    item.subtotal = item.price * quantity;
    
    carts.set(sessionId, cart);
    return cart;
  },

  // Remove item from cart
  removeItem(sessionId: string, productId: string): CartItem[] {
    let cart = this.getCart(sessionId);
    cart = cart.filter(item => item.productId !== productId);
    carts.set(sessionId, cart);
    return cart;
  },

  // Clear cart
  clearCart(sessionId: string): void {
    carts.delete(sessionId);
  },

  // Calculate cart totals
  calculateTotals(sessionId: string, taxRate: number = 0.11, discount: number = 0) {
    const cart = this.getCart(sessionId);
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;
    
    return {
      items: cart,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      tax,
      discount,
      total
    };
  },

  // Validate cart (check stock availability)
  async validateCart(sessionId: string): Promise<{ valid: boolean; errors: string[] }> {
    const cart = this.getCart(sessionId);
    const errors: string[] = [];
    
    for (const item of cart) {
      const product = await ProductServices.getById(item.productId);
      
      if (!product) {
        errors.push(`Product "${item.name}" no longer exists`);
      } else if (getAvailableQuantity(product) < item.quantity) {
        errors.push(`Not enough stock for "${item.name}". Available: ${getAvailableQuantity(product)}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
