export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    description?: string;
    image?: string;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const InventoryServices: {
    /**
     * Get product stock level
     */
    getStockLevel(productId: string): Promise<number>;
    /**
     * Update product stock
     */
    updateStock(productId: string, quantity: number, reason?: string): Promise<{
        productId: string;
        previousStock: any;
        newStock: any;
        change: number;
    }>;
    /**
     * Decrease stock (for sales)
     */
    decreaseStock(productId: string, quantity: number): Promise<{
        productId: string;
        previousStock: any;
        newStock: any;
        change: number;
    }>;
    /**
     * Increase stock (for restocking)
     */
    increaseStock(productId: string, quantity: number, reason?: string): Promise<{
        productId: string;
        previousStock: any;
        newStock: any;
        change: number;
    }>;
    /**
     * Get low stock products
     */
    getLowStockProducts(threshold?: number): Promise<Product[]>;
    /**
     * Get out of stock products
     */
    getOutOfStockProducts(): Promise<Product[]>;
    /**
     * Get all products with stock info
     */
    getAllProductsWithStock(): Promise<Product[]>;
    /**
     * Get inventory summary
     */
    getInventorySummary(): Promise<{
        totalProducts: number;
        totalItems: number;
        totalValue: number;
        lowStockCount: number;
        outOfStockCount: number;
        averageStockPerProduct: number;
    }>;
    /**
     * Log stock changes
     */
    logStockChange(productId: string, previousStock: number, newStock: number, reason: string): Promise<void>;
    /**
     * Get stock change history for a product
     */
    getStockHistory(productId: string, limit?: number): Promise<{
        timestamp: any;
        id: string;
    }[]>;
    /**
     * Bulk update stock
     */
    bulkUpdateStock(updates: Array<{
        productId: string;
        quantity: number;
        reason?: string;
    }>): Promise<{
        productId: string;
        previousStock: any;
        newStock: any;
        change: number;
    }[]>;
    /**
     * Process sale (decrease stock and log)
     */
    processSale(items: Array<{
        productId: string;
        quantity: number;
    }>, transactionId: string): Promise<{
        transactionId: string;
        productId: string;
        previousStock: any;
        newStock: any;
        change: number;
    }[]>;
};
//# sourceMappingURL=inventoryServices.d.ts.map