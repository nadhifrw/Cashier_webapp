"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartService = void 0;
const productServices_1 = require("./productServices");
// In-memory cart storage (per session)
// For production, consider Redis or session storage
const carts = new Map();
const getAvailableQuantity = (product) => {
    return Number(product.quantityOnHand ?? product.stock ?? 0);
};
exports.cartService = {
    // Get cart for a session
    getCart(sessionId) {
        return carts.get(sessionId) || [];
    },
    // Add item to cart
    async addItem(sessionId, productId, quantity = 1) {
        const product = await productServices_1.ProductServices.getById(productId);
        const availableQuantity = product ? getAvailableQuantity(product) : 0;
        if (!product)
            return null;
        if (availableQuantity < quantity)
            return null;
        const cart = this.getCart(sessionId);
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (availableQuantity < newQuantity)
                return null;
            existingItem.quantity = newQuantity;
            existingItem.subtotal = existingItem.price * newQuantity;
        }
        else {
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
    async updateQuantity(sessionId, productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(sessionId, productId);
        }
        const product = await productServices_1.ProductServices.getById(productId);
        const availableQuantity = product ? getAvailableQuantity(product) : 0;
        if (!product || availableQuantity < quantity)
            return null;
        const cart = this.getCart(sessionId);
        const item = cart.find(item => item.productId === productId);
        if (!item)
            return null;
        item.quantity = quantity;
        item.subtotal = item.price * quantity;
        carts.set(sessionId, cart);
        return cart;
    },
    // Remove item from cart
    removeItem(sessionId, productId) {
        let cart = this.getCart(sessionId);
        cart = cart.filter(item => item.productId !== productId);
        carts.set(sessionId, cart);
        return cart;
    },
    // Clear cart
    clearCart(sessionId) {
        carts.delete(sessionId);
    },
    // Calculate cart totals
    calculateTotals(sessionId, taxRate = 0.11, discount = 0) {
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
    async validateCart(sessionId) {
        const cart = this.getCart(sessionId);
        const errors = [];
        for (const item of cart) {
            const product = await productServices_1.ProductServices.getById(item.productId);
            if (!product) {
                errors.push(`Product "${item.name}" no longer exists`);
            }
            else if (getAvailableQuantity(product) < item.quantity) {
                errors.push(`Not enough stock for "${item.name}". Available: ${getAvailableQuantity(product)}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
};
//# sourceMappingURL=cartServices.js.map