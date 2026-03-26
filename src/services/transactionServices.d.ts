import { Transaction, CreateTransactionInput, DailySummary, PaymentMethod } from '../models/transaction';
export declare const TransactionServices: {
    getAllTransactions(): Promise<Transaction[]>;
    getTransactionById(id: string): Promise<Transaction | null>;
    createTransaction(input: CreateTransactionInput): Promise<Transaction>;
    updateTransaction(id: string, input: Partial<CreateTransactionInput>): Promise<Transaction | null>;
    deleteTransaction(id: string): Promise<void>;
    getDailySummary(date: string): Promise<DailySummary>;
    getTransactionsByPaymentMethod(paymentMethod: PaymentMethod): Promise<Transaction[]>;
    getTransactionsByCashier(cashierId: string): Promise<Transaction[]>;
};
//# sourceMappingURL=transactionServices.d.ts.map