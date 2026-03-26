export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    soldUnit?: 'pcs' | 'g' | 'kg';
    baseQuantity?: number;
    subtotal: number;
}
export interface Transaction {
    id?: string;
    items: CartItem[];
    subtotal: number;
    total: number;
    paymentMethod: PaymentMethod;
    amountPaid: number;
    change: number;
    cashierId: string;
    cashierName: string;
    receiptNumber: string;
    createdAt: Date;
}
export type PaymentMethod = 'cash' | 'qris';
export interface CreateTransactionInput {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    amountPaid: number;
    discount?: number;
    cashierId: string;
    cashierName: string;
}
export interface DailySummary {
    date: string;
    totalTransactions: number;
    totalRevenue: number;
    totalItemsSold: number;
    paymentBreakdown: Record<PaymentMethod, number>;
}
//# sourceMappingURL=transaction.d.ts.map