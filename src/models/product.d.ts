export type InventoryType = 'unit' | 'weight';
export type BaseUnit = 'pcs' | 'g';
export type SalesUnit = 'pcs' | 'g' | 'kg';
export interface Product {
    id: string;
    name: string;
    price: number;
    stock?: number;
    quantityOnHand?: number;
    inventoryType?: InventoryType;
    baseUnit?: BaseUnit;
    salesUnit?: SalesUnit;
    lowStockThreshold?: number;
    saleStep?: number;
    category?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface CreateProduct {
    id: string;
    name: string;
    price: number;
    stock?: number;
    quantityOnHand?: number;
    inventoryType?: InventoryType;
    baseUnit?: BaseUnit;
    salesUnit?: SalesUnit;
    lowStockThreshold?: number;
    saleStep?: number;
    category?: string;
}
export interface UpdateProduct {
    id?: string;
    name?: string;
    price?: number;
    stock?: number;
    quantityOnHand?: number;
    inventoryType?: InventoryType;
    baseUnit?: BaseUnit;
    salesUnit?: SalesUnit;
    lowStockThreshold?: number;
    saleStep?: number;
    category?: string;
    updatedAt?: Date;
}
//# sourceMappingURL=product.d.ts.map