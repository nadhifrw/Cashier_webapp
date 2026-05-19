import { Product, CreateProduct, UpdateProduct } from '../models/product';
export declare const ProductServices: {
    getAllProducts(limit?: number, startAfter?: string): Promise<{
        products: Product[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    getLowStockProducts(threshold?: number, limit?: number): Promise<Product[]>;
    createProduct(input: CreateProduct): Promise<Product>;
    update(id: string, input: UpdateProduct): Promise<Product | null>;
    delete(id: string): Promise<void>;
    search(query: string): Promise<Product[]>;
    getById(id: string): Promise<Product | null>;
};
//# sourceMappingURL=productServices.d.ts.map