"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportServices = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'transactions';
function normalizeToDate(value) {
    if (!value)
        return null;
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
exports.ReportServices = {
    /**
     * Get daily sales report
     */
    async getDailySalesReport(date) {
        try {
            const startDate = new Date(`${date}T00:00:00`);
            const endDate = new Date(`${date}T23:59:59`);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', firestore_1.Timestamp.fromDate(startDate))
                .where('createdAt', '<=', firestore_1.Timestamp.fromDate(endDate))
                .get();
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            const report = {
                date,
                totalTransactions: transactions.length,
                totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
                totalItemsSold: transactions.reduce((sum, t) => {
                    const itemCount = t.items?.reduce((count, item) => count + item.quantity, 0) || 0;
                    return sum + itemCount;
                }, 0),
                averageTransactionValue: 0,
                paymentBreakdown: {},
                topProducts: [],
                transactions,
            };
            // Calculate average
            if (transactions.length > 0) {
                report.averageTransactionValue = report.totalRevenue / transactions.length;
            }
            // Payment breakdown
            const paymentMethods = ['cash', 'qris'];
            for (const method of paymentMethods) {
                const filtered = transactions.filter(t => t.paymentMethod === method);
                report.paymentBreakdown[method] = {
                    count: filtered.length,
                    total: filtered.reduce((sum, t) => sum + (t.total || 0), 0),
                };
            }
            // Top products
            const productMap = new Map();
            for (const transaction of transactions) {
                for (const item of transaction.items || []) {
                    const key = item.productId || item.name;
                    if (productMap.has(key)) {
                        const product = productMap.get(key);
                        product.quantity += item.quantity;
                        product.revenue += item.subtotal;
                    }
                    else {
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
        }
        catch (error) {
            console.error('Error generating daily report:', error.message);
            throw error;
        }
    },
    /**
     * Get monthly sales report
     */
    async getMonthlySalesReport(year, month) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', firestore_1.Timestamp.fromDate(startDate))
                .where('createdAt', '<=', firestore_1.Timestamp.fromDate(endDate))
                .get();
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            const report = {
                year,
                month,
                totalTransactions: transactions.length,
                totalRevenue: transactions.reduce((sum, t) => sum + (t.total || 0), 0),
                totalItemsSold: transactions.reduce((sum, t) => {
                    const itemCount = t.items?.reduce((count, item) => count + item.quantity, 0) || 0;
                    return sum + itemCount;
                }, 0),
                averageTransactionValue: 0,
                paymentBreakdown: {},
                dailyBreakdown: {},
            };
            if (transactions.length > 0) {
                report.averageTransactionValue = report.totalRevenue / transactions.length;
            }
            // Payment breakdown
            const paymentMethods = ['cash', 'qris'];
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
                if (!createdAt)
                    continue;
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
        }
        catch (error) {
            console.error('Error generating monthly report:', error.message);
            throw error;
        }
    },
    /**
     * Get cashier performance report
     */
    async getCashierPerformanceReport(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', firestore_1.Timestamp.fromDate(start))
                .where('createdAt', '<=', firestore_1.Timestamp.fromDate(end))
                .get();
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            const cashierMap = new Map();
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
                const cashier = cashierMap.get(cashierId);
                cashier.totalTransactions++;
                cashier.totalRevenue += transaction.total || 0;
                cashier.totalItemsSold += transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            }
            const report = Array.from(cashierMap.values()).map(cashier => ({
                ...cashier,
                averageTransactionValue: cashier.totalRevenue / cashier.totalTransactions,
            }));
            return {
                period: { startDate, endDate },
                cashiers: report,
            };
        }
        catch (error) {
            console.error('Error generating cashier performance report:', error.message);
            throw error;
        }
    },
    /**
     * Get product sales report
     */
    async getProductSalesReport(startDate, endDate) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', firestore_1.Timestamp.fromDate(start))
                .where('createdAt', '<=', firestore_1.Timestamp.fromDate(end))
                .get();
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            const productMap = new Map();
            for (const transaction of transactions) {
                for (const item of transaction.items || []) {
                    const key = item.productId;
                    if (productMap.has(key)) {
                        const product = productMap.get(key);
                        product.quantity += item.quantity;
                        product.revenue += item.subtotal || (item.price * item.quantity);
                        product.timeSold++;
                    }
                    else {
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
        }
        catch (error) {
            console.error('Error generating product sales report:', error.message);
            throw error;
        }
    },
    /**
     * Get revenue trend
     */
    async getRevenueTrend(days = 30) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', firestore_1.Timestamp.fromDate(startDate))
                .where('createdAt', '<=', firestore_1.Timestamp.fromDate(endDate))
                .get();
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            const trendMap = new Map();
            for (const transaction of transactions) {
                const createdAt = normalizeToDate(transaction.createdAt);
                if (!createdAt)
                    continue;
                const dateKey = createdAt.toISOString().split('T')[0] || '';
                const current = trendMap.get(dateKey) || 0;
                trendMap.set(dateKey, current + (transaction.total || 0));
            }
            const trend = Array.from(trendMap.entries())
                .map(([date, revenue]) => ({ date, revenue }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return trend;
        }
        catch (error) {
            console.error('Error generating revenue trend:', error.message);
            throw error;
        }
    },
};
//# sourceMappingURL=reportServices.js.map