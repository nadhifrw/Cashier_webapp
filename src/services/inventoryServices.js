"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryServices = void 0;
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'products';
exports.InventoryServices = {
    /**
     * Get product stock level
     */
    async getStockLevel(productId) {
        try {
            const doc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(productId).get();
            if (!doc.exists) {
                throw new Error('Product not found');
            }
            return doc.data()?.stock || 0;
        }
        catch (error) {
            console.error('Error getting stock level:', error.message);
            throw error;
        }
    },
    /**
     * Update product stock
     */
    async updateStock(productId, quantity, reason = 'manual') {
        try {
            const doc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(productId).get();
            if (!doc.exists) {
                throw new Error('Product not found');
            }
            const currentStock = doc.data()?.stock || 0;
            const newStock = currentStock + quantity;
            if (newStock < 0) {
                throw new Error('Insufficient stock');
            }
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(productId).update({
                stock: newStock,
                updatedAt: new Date(),
            });
            // Log the stock change
            await this.logStockChange(productId, currentStock, newStock, reason);
            return {
                productId,
                previousStock: currentStock,
                newStock,
                change: quantity,
            };
        }
        catch (error) {
            console.error('Error updating stock:', error.message);
            throw error;
        }
    },
    /**
     * Decrease stock (for sales)
     */
    async decreaseStock(productId, quantity) {
        return this.updateStock(productId, -quantity, 'sale');
    },
    /**
     * Increase stock (for restocking)
     */
    async increaseStock(productId, quantity, reason = 'restock') {
        return this.updateStock(productId, quantity, reason);
    },
    /**
     * Get low stock products
     */
    async getLowStockProducts(threshold = 10) {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('stock', '<=', threshold)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        }
        catch (error) {
            console.error('Error getting low stock products:', error.message);
            throw error;
        }
    },
    /**
     * Get out of stock products
     */
    async getOutOfStockProducts() {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .where('stock', '==', 0)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        }
        catch (error) {
            console.error('Error getting out of stock products:', error.message);
            throw error;
        }
    },
    /**
     * Get all products with stock info
     */
    async getAllProductsWithStock() {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME)
                .orderBy('stock', 'desc')
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
        }
        catch (error) {
            console.error('Error getting products with stock:', error.message);
            throw error;
        }
    },
    /**
     * Get inventory summary
     */
    async getInventorySummary() {
        try {
            const snapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).get();
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            let totalItems = 0;
            let totalValue = 0;
            let lowStockCount = 0;
            let outOfStockCount = 0;
            for (const product of products) {
                totalItems += product.stock || 0;
                totalValue += (product.stock || 0) * (product.price || 0);
                if (product.stock === 0) {
                    outOfStockCount++;
                }
                else if (product.stock <= 10) {
                    lowStockCount++;
                }
            }
            return {
                totalProducts: products.length,
                totalItems,
                totalValue,
                lowStockCount,
                outOfStockCount,
                averageStockPerProduct: totalItems / products.length,
            };
        }
        catch (error) {
            console.error('Error getting inventory summary:', error.message);
            throw error;
        }
    },
    /**
     * Log stock changes
     */
    async logStockChange(productId, previousStock, newStock, reason) {
        try {
            const logsCollection = firebase_1.dbCashier.collection('stock_logs');
            await logsCollection.add({
                productId,
                previousStock,
                newStock,
                change: newStock - previousStock,
                reason,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error('Error logging stock change:', error.message);
        }
    },
    /**
     * Get stock change history for a product
     */
    async getStockHistory(productId, limit = 50) {
        try {
            const snapshot = await firebase_1.dbCashier.collection('stock_logs')
                .where('productId', '==', productId)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            }));
        }
        catch (error) {
            console.error('Error getting stock history:', error.message);
            throw error;
        }
    },
    /**
     * Bulk update stock
     */
    async bulkUpdateStock(updates) {
        try {
            const results = [];
            for (const update of updates) {
                const result = await this.updateStock(update.productId, update.quantity, update.reason || 'bulk_update');
                results.push(result);
            }
            return results;
        }
        catch (error) {
            console.error('Error bulk updating stock:', error.message);
            throw error;
        }
    },
    /**
     * Process sale (decrease stock and log)
     */
    async processSale(items, transactionId) {
        try {
            const results = [];
            for (const item of items) {
                const result = await this.decreaseStock(item.productId, item.quantity);
                results.push({
                    ...result,
                    transactionId,
                });
            }
            return results;
        }
        catch (error) {
            console.error('Error processing sale:', error.message);
            throw error;
        }
    },
};
//# sourceMappingURL=inventoryServices.js.map