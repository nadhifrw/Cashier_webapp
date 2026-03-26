import { PaymentMethod } from '../models/transaction';
export declare const ReportServices: {
    /**
     * Get daily sales report
     */
    getDailySalesReport(date: string): Promise<{
        date: string;
        totalTransactions: number;
        totalRevenue: any;
        totalItemsSold: any;
        averageTransactionValue: number;
        paymentBreakdown: Record<PaymentMethod, any>;
        topProducts: any[];
        transactions: any[];
    }>;
    /**
     * Get monthly sales report
     */
    getMonthlySalesReport(year: number, month: number): Promise<{
        year: number;
        month: number;
        totalTransactions: number;
        totalRevenue: any;
        totalItemsSold: any;
        averageTransactionValue: number;
        paymentBreakdown: Record<PaymentMethod, any>;
        dailyBreakdown: Record<string, any>;
    }>;
    /**
     * Get cashier performance report
     */
    getCashierPerformanceReport(startDate: string, endDate: string): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        cashiers: any[];
    }>;
    /**
     * Get product sales report
     */
    getProductSalesReport(startDate: string, endDate: string): Promise<{
        period: {
            startDate: string;
            endDate: string;
        };
        products: any[];
        topProducts: any[];
    }>;
    /**
     * Get revenue trend
     */
    getRevenueTrend(days?: number): Promise<{
        date: string;
        revenue: number;
    }[]>;
};
//# sourceMappingURL=reportServices.d.ts.map