import { CartItem } from '../models/transaction';
export declare const cartService: {
    getCart(sessionId: string): CartItem[];
    addItem(sessionId: string, productId: string, quantity?: number): Promise<CartItem[] | null>;
    updateQuantity(sessionId: string, productId: string, quantity: number): Promise<CartItem[] | null>;
    removeItem(sessionId: string, productId: string): CartItem[];
    clearCart(sessionId: string): void;
    calculateTotals(sessionId: string, taxRate?: number, discount?: number): {
        items: CartItem[];
        itemCount: number;
        subtotal: number;
        tax: number;
        discount: number;
        total: number;
    };
    validateCart(sessionId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
};
//# sourceMappingURL=cartServices.d.ts.map