import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { dbCashier } from '../config/firebase';
import { Transaction, PaymentMethod } from '../models/transaction';

const COLLECTION_NAME = 'transactions';

function normalizeToDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value?.toDate === 'function') {
        const converted = value.toDate();
        return converted instanceof Date && !isNaN(converted.getTime()) ? converted : null;
    }

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

export const ReportServices = {
    /**
     * Get daily sales report
     */
    async getDailySalesReport(date: string) {
        try {
            const startDate = new Date(`${date}T00:00:00`);
            const endDate = new Date(`${date}T23:59:59`);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', Timestamp.fromDate(startDate))
                .where('createdAt', '<=', Timestamp.fromDate(endDate))
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const report = {
                date,
                totalTransactions: transactions.length,
                totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
                totalItemsSold: transactions.reduce((sum, t) => {
                    const itemCount = t.items?.reduce((count: number, item: any) => count + item.quantity, 0) || 0;
                    return sum + itemCount;
                }, 0),
                averageTransactionValue: 0,
                paymentBreakdown: {} as Record<PaymentMethod, any>,
                topProducts: [] as any[],
                transactions,
            };

            // Calculate average
            if (transactions.length > 0) {
                report.averageTransactionValue = report.totalRevenue / transactions.length;
            }

            // Payment breakdown
            const paymentMethods: PaymentMethod[] = ['cash', 'qris'];
            for (const method of paymentMethods) {
                const filtered = transactions.filter(t => t.paymentMethod === method);
                report.paymentBreakdown[method] = {
                    count: filtered.length,
                    total: filtered.reduce((sum, t) => sum + (t.total || 0), 0),
                };
            }

            // Top products
            const productMap = new Map<string, any>();
            for (const transaction of transactions) {
                for (const item of transaction.items || []) {
                    const key = item.productId || item.name;
                    if (productMap.has(key)) {
                        const product = productMap.get(key)!;
                        product.quantity += item.quantity;
                        product.revenue += item.subtotal;
                    } else {
                        productMap.set(key, {
                            name: item.name || item.productId,
                            productId: item.productId,
                            price: item.price,
                            quantity: item.quantity,
                            revenue: item.subtotal,
                        });
                    }
                }
            }
            report.topProducts = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);

            return report;
        } catch (error) {
            console.error('Error generating daily report:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get monthly sales report
     */
    async getMonthlySalesReport(year: number, month: number) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', Timestamp.fromDate(startDate))
                .where('createdAt', '<=', Timestamp.fromDate(endDate))
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const report = {
                year,
                month,
                totalTransactions: transactions.length,
                totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
                totalItemsSold: transactions.reduce((sum, t) => {
                    const itemCount = t.items?.reduce((count: number, item: any) => count + item.quantity, 0) || 0;
                    return sum + itemCount;
                }, 0),
                averageTransactionValue: 0,
                paymentBreakdown: {} as Record<PaymentMethod, any>,
                dailyBreakdown: {} as Record<string, any>,
            };

            if (transactions.length > 0) {
                report.averageTransactionValue = report.totalRevenue / transactions.length;
            }

            // Payment breakdown
            const paymentMethods: PaymentMethod[] = ['cash', 'qris'];
            for (const method of paymentMethods) {
                const filtered = transactions.filter(t => t.paymentMethod === method);
                report.paymentBreakdown[method] = {
                    count: filtered.length,
                    total: filtered.reduce((sum, t) => sum + (t.total || 0), 0),
                };
            }

            // Daily breakdown
            for (const transaction of transactions) {
                const createdAt = normalizeToDate(transaction.createdAt);
                if (!createdAt) continue;
                const dayKey = createdAt.toISOString().split('T')[0] || '';

                if (!report.dailyBreakdown[dayKey]) {
                    report.dailyBreakdown[dayKey] = {
                        transactions: 0,
                        revenue: 0,
                    };
                }
                report.dailyBreakdown[dayKey].transactions++;
                report.dailyBreakdown[dayKey].revenue += transaction.total || 0;
            }

            return report;
        } catch (error) {
            console.error('Error generating monthly report:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get cashier performance report
     */
    async getCashierPerformanceReport(startDate: string, endDate: string) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', Timestamp.fromDate(start))
                .where('createdAt', '<=', Timestamp.fromDate(end))
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const cashierMap = new Map<string, any>();

            for (const transaction of transactions) {
                const cashierId = transaction.cashierId;
                const cashierName = transaction.cashierName;

                if (!cashierMap.has(cashierId)) {
                    cashierMap.set(cashierId, {
                        cashierId,
                        cashierName,
                        totalTransactions: 0,
                        totalRevenue: 0,
                        totalItemsSold: 0,
                        averageTransactionValue: 0,
                    });
                }

                const cashier = cashierMap.get(cashierId)!;
                cashier.totalTransactions++;
                cashier.totalRevenue += transaction.total || 0;
                cashier.totalItemsSold += transaction.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
            }

            const report = Array.from(cashierMap.values()).map(cashier => ({
                ...cashier,
                averageTransactionValue: cashier.totalRevenue / cashier.totalTransactions,
            }));

            return {
                period: { startDate, endDate },
                cashiers: report,
            };
        } catch (error) {
            console.error('Error generating cashier performance report:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get product sales report
     */
    async getProductSalesReport(startDate: string, endDate: string) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', Timestamp.fromDate(start))
                .where('createdAt', '<=', Timestamp.fromDate(end))
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const productMap = new Map<string, any>();

            for (const transaction of transactions) {
                for (const item of transaction.items || []) {
                    const key = item.productId;
                    if (productMap.has(key)) {
                        const product = productMap.get(key)!;
                        product.quantity += item.quantity;
                        product.revenue += item.subtotal || (item.price * item.quantity);
                        product.timeSold++;
                    } else {
                        productMap.set(key, {
                            productId: key,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            revenue: item.subtotal || (item.price * item.quantity),
                            timeSold: 1,
                        });
                    }
                }
            }

            const products = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .map((product, index) => ({
                    ...product,
                    rank: index + 1,
                    averagePrice: product.revenue / product.quantity,
                }));

            return {
                period: { startDate, endDate },
                products,
                topProducts: products.slice(0, 10),
            };
        } catch (error) {
            console.error('Error generating product sales report:', (error as Error).message);
            throw error;
        }
    },

    /**
     * Get revenue trend
     */
    async getRevenueTrend(days: number = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', Timestamp.fromDate(startDate))
                .where('createdAt', '<=', Timestamp.fromDate(endDate))
                .get();

            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const trendMap = new Map<string, number>();

            for (const transaction of transactions) {
                const createdAt = normalizeToDate(transaction.createdAt);
                if (!createdAt) continue;
                const dateKey = createdAt.toISOString().split('T')[0] || '';

                const current = trendMap.get(dateKey) || 0;
                trendMap.set(dateKey, current + (transaction.total || 0));
            }

            const trend = Array.from(trendMap.entries())
                .map(([date, revenue]) => ({ date, revenue }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return trend;
        } catch (error) {
            console.error('Error generating revenue trend:', (error as Error).message);
            throw error;
        }
    },
};
