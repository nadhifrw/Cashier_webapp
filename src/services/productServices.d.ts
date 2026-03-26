import { Product, CreateProduct, UpdateProduct } from '../models/product';
export declare const ProductServices: {
    getAllProducts(): Promise<Product[]>;
    getLowStockProducts(threshold?: number): Promise<Product[]>;
    createProduct(input: CreateProduct): Promise<Product>;
    update(id: string, input: UpdateProduct): Promise<Product | null>;
    delete(id: string): Promise<void>;
    search(query: string): Promise<Product[]>;
    getById(id: string): Promise<Product | null>;
};
//# sourceMappingURL=productServices.d.ts.map