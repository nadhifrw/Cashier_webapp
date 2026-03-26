"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionServices = void 0;
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'transactions';
const toFiniteNumber = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};
const toBaseQuantity = (quantity, soldUnit, baseUnit) => {
    if (baseUnit === 'pcs') {
        return quantity;
    }
    if (soldUnit === 'kg') {
        return quantity * 1000;
    }
    return quantity;
};
exports.TransactionServices = {
    // Read all transactions
    async getAllTransactions() {
        try {
            const transactionsSnapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .orderBy('createdAt', 'desc')
                .get();
            const transactions = transactionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
            return transactions;
        }
        catch (error) {
            console.error('Error fetching transactions:', error.message);
            throw error;
        }
    },
    // Read single transaction by ID
    async getTransactionById(id) {
        try {
            const transactionDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!transactionDoc.exists) {
                return null;
            }
            return {
                id: transactionDoc.id,
                ...transactionDoc.data(),
                createdAt: transactionDoc.data()?.createdAt?.toDate() || new Date(),
            };
        }
        catch (error) {
            console.error('Error fetching transaction by ID:', error.message);
            throw error;
        }
    },
    // Create new transaction
    async createTransaction(input) {
        try {
            // Calculate totals
            const subtotal = input.items.reduce((sum, item) => sum + item.subtotal, 0);
            const discount = input.discount || 0;
            const tax = (subtotal - discount) * 0.1; // Assuming 10% tax
            const total = subtotal - discount + tax;
            const change = input.amountPaid - total;
            const receiptDate = (new Date().toISOString().split('T')[0] || '').replace(/-/g, '');
            const receiptNumber = `TXN-${receiptDate}-${Date.now()}`;
            // Generate receipt number (example: TXN-20260315-001)
            // const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            // const receiptNumber = `TXN-${date}-${Date.now()}`;
            const newTransaction = {
                items: input.items,
                subtotal,
                tax,
                discount,
                total,
                paymentMethod: input.paymentMethod,
                amountPaid: input.amountPaid,
                change,
                cashierId: input.cashierId,
                cashierName: input.cashierName,
                receiptNumber,
                createdAt: new Date(),
            };
            let createdTransactionId = '';
            await firebase_1.dbCashier.runTransaction(async (firestoreTransaction) => {
                const productQuantities = input.items.reduce((acc, item) => {
                    const requestedQuantity = toFiniteNumber(item.quantity, 0);
                    const legacyExisting = acc.get(item.productId);
                    if (legacyExisting) {
                        legacyExisting.quantity += requestedQuantity;
                    }
                    else {
                        const entry = {
                            name: item.name,
                            quantity: requestedQuantity,
                        };
                        if (item.soldUnit !== undefined) {
                            entry.soldUnit = item.soldUnit;
                        }
                        if (item.baseQuantity !== undefined) {
                            entry.baseQuantity = item.baseQuantity;
                        }
                        acc.set(item.productId, {
                            ...entry,
                        });
                    }
                    return acc;
                }, new Map());
                const productRefs = Array.from(productQuantities.keys()).map((productId) => firebase_1.dbCashier.collection('products').doc(productId));
                const productDocs = await firestoreTransaction.getAll(...productRefs);
                const stockByProductId = new Map();
                productDocs.forEach((productDoc) => {
                    const productData = productQuantities.get(productDoc.id);
                    if (!productData) {
                        return;
                    }
                    if (!productDoc.exists) {
                        throw new Error(`Product not found: ${productData.name}`);
                    }
                    const inventoryType = productDoc.data()?.inventoryType === 'weight' ? 'weight' : 'unit';
                    const baseUnit = productDoc.data()?.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
                    const currentStock = toFiniteNumber(productDoc.data()?.quantityOnHand ?? productDoc.data()?.stock, 0);
                    const requestedBaseQuantity = toFiniteNumber(productData.baseQuantity, toBaseQuantity(productData.quantity, productData.soldUnit, baseUnit));
                    if (requestedBaseQuantity > currentStock) {
                        throw new Error(`Insufficient stock for ${productData.name}. Available: ${currentStock}, requested: ${requestedBaseQuantity}`);
                    }
                    stockByProductId.set(productDoc.id, currentStock - requestedBaseQuantity);
                });
                productRefs.forEach((productRef) => {
                    const updatedStock = stockByProductId.get(productRef.id);
                    if (updatedStock === undefined) {
                        return;
                    }
                    firestoreTransaction.update(productRef, {
                        quantityOnHand: updatedStock,
                        stock: updatedStock,
                    });
                });
                const transactionRef = firebase_1.dbCashier.collection(COLLECTION_NAME).doc();
                firestoreTransaction.set(transactionRef, newTransaction);
                createdTransactionId = transactionRef.id;
            });
            return {
                id: createdTransactionId,
                ...newTransaction,
            };
        }
        catch (error) {
            console.error('Error creating transaction:', error.message);
            throw error;
        }
    },
    // Update transaction
    async updateTransaction(id, input) {
        try {
            const transactionDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!transactionDoc.exists) {
                throw new Error('Transaction not found');
            }
            const updateData = {};
            if (input.items)
                updateData.items = input.items;
            if (input.paymentMethod)
                updateData.paymentMethod = input.paymentMethod;
            if (input.amountPaid !== undefined)
                updateData.amountPaid = input.amountPaid;
            if (input.discount !== undefined)
                updateData.discount = input.discount;
            // Recalculate totals if items or amounts changed
            if (input.items || input.discount !== undefined) {
                const items = input.items || transactionDoc.data()?.items;
                const discount = input.discount !== undefined ? input.discount : transactionDoc.data()?.discount;
                const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
                const tax = (subtotal - discount) * 0.1;
                const total = subtotal - discount + tax;
                const amountPaid = input.amountPaid || transactionDoc.data()?.amountPaid;
                updateData.subtotal = subtotal;
                updateData.tax = tax;
                updateData.total = total;
                updateData.change = amountPaid - total;
            }
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).update(updateData);
            const updatedDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            return {
                id: updatedDoc.id,
                ...updatedDoc.data(),
                createdAt: updatedDoc.data()?.createdAt?.toDate() || new Date(),
            };
        }
        catch (error) {
            console.error('Error updating transaction:', error.message);
            throw error;
        }
    },
    // Delete transaction
    async deleteTransaction(id) {
        try {
            const transactionDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!transactionDoc.exists) {
                throw new Error('Transaction not found');
            }
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).delete();
        }
        catch (error) {
            console.error('Error deleting transaction:', error.message);
            throw error;
        }
    },
    // Get daily summary
    async getDailySummary(date) {
        try {
            const startDate = new Date(`${date}T00:00:00`);
            const endDate = new Date(`${date}T23:59:59`);
            const transactionsSnapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('createdAt', '>=', startDate)
                .where('createdAt', '<=', endDate)
                .get();
            const transactions = transactionsSnapshot.docs.map(doc => doc.data());
            const totalRevenue = transactions.reduce((sum, txn) => sum + txn.total, 0);
            const totalItemsSold = transactions.reduce((sum, txn) => sum + txn.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
            const paymentBreakdown = {
                cash: 0,
                qris: 0,
            };
            transactions.forEach(txn => {
                paymentBreakdown[txn.paymentMethod] += txn.total;
            });
            return {
                date,
                totalTransactions: transactions.length,
                totalRevenue,
                totalItemsSold,
                paymentBreakdown,
            };
        }
        catch (error) {
            console.error('Error getting daily summary:', error.message);
            throw error;
        }
    },
    // Get transactions by payment method
    async getTransactionsByPaymentMethod(paymentMethod) {
        try {
            const transactionsSnapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('paymentMethod', '==', paymentMethod)
                .orderBy('createdAt', 'desc')
                .get();
            return transactionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error fetching transactions by payment method:', error.message);
            throw error;
        }
    },
    // Get transactions by cashier
    async getTransactionsByCashier(cashierId) {
        try {
            const transactionsSnapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('cashierId', '==', cashierId)
                .orderBy('createdAt', 'desc')
                .get();
            return transactionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error fetching transactions by cashier:', error.message);
            throw error;
        }
    },
};
//# sourceMappingURL=transactionServices.js.map