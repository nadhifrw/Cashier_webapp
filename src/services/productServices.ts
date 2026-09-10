import { getFirestore, QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { dbCashier } from '../config/firebase';
import { Product, CreateProduct, UpdateProduct, InventoryType, BaseUnit, SalesUnit } from '../models/product';

const COLLECTION_NAME = 'products';

// validate to make sure the value is a finite number
const toFiniteNumber = (value: unknown, fallback: number): number => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

// normalize product data to ensure all required fields are correct and present
const normalizeProductData = (id: string, rawData: Record<string, unknown>): Product => {
    const inventoryType: InventoryType = rawData.inventoryType === 'weight' ? 'weight' : 'unit';
    const baseUnit: BaseUnit = rawData.baseUnit === 'g' || rawData.baseUnit === 'kg' ? rawData.baseUnit : (inventoryType === 'weight' ? 'g' : 'pcs');
    const salesUnit: SalesUnit = rawData.salesUnit === 'g' || rawData.salesUnit === 'kg'
        ? rawData.salesUnit
        : (inventoryType === 'weight' ? 'kg' : 'pcs');
    const quantityOnHand = toFiniteNumber(rawData.quantityOnHand ?? rawData.stock, 0);
    const defaultThreshold = inventoryType === 'weight' ? 1000 : 10;
    const lowStockThreshold = toFiniteNumber(rawData.lowStockThreshold, defaultThreshold);
    // const defaultSaleStep = inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1;
    // const saleStep = toFiniteNumber(rawData.saleStep, defaultSaleStep);

    return {
        id,
        ...rawData,
        name: String(rawData.name ?? ''),
        price: toFiniteNumber(rawData.price, 0),
        stock: quantityOnHand,
        quantityOnHand,
        inventoryType,
        baseUnit,
        salesUnit,
        lowStockThreshold,
        // saleStep,
    } as Product;
};

export const ProductServices = {
    // getting all of the products with pagination
    async getAllProducts(limit: number = 10, startAfter?: string): Promise<{ products: Product[]; nextCursor?: string; hasMore: boolean; totalProducts: number }> {
        try {
            let query: any = dbCashier.collection(COLLECTION_NAME).orderBy('name');
            
            if (startAfter) {
                query = query.startAfter(startAfter);
            }
            query = query.limit(limit + 1);
            
            const productsSnapshot = await query.get();
            const docs = productsSnapshot.docs;
            
            const totalProductsSnapshot = await dbCashier.collection(COLLECTION_NAME).count().get();
            const totalProducts = totalProductsSnapshot.data().count;
            
            const hasMore = docs.length > limit;
            const actualDocs = hasMore ? docs.slice(0, limit) : docs;
            
            const products = actualDocs.map((doc: QueryDocumentSnapshot) => normalizeProductData(doc.id, doc.data() as Record<string, unknown>));
            const nextCursor = hasMore ? String((actualDocs[actualDocs.length - 1].data() as any).name ?? actualDocs[actualDocs.length - 1].id) : undefined;
            
            const result: { products: Product[]; nextCursor?: string; hasMore: boolean; totalProducts: number } = { products, hasMore, totalProducts };
            if (nextCursor !== undefined) result.nextCursor = nextCursor;
            
            return result;
        } catch (error) {
            console.error('Error fetching products:', (error as Error).message);
            throw error;
        }
    },


    async getLowStockProducts(threshold?: number): Promise<Product[]> {
        try {
            // Query directly for low stock products to minimize reads
            const hasCustomThreshold = Number.isFinite(threshold) && Number(threshold) >= 0;
            const thresholdValue = hasCustomThreshold ? Number(threshold) : null;
            
            // Fallback to fetching with limit and filtering
            const productsSnapshot = await dbCashier.collection(COLLECTION_NAME)
                .orderBy('quantityOnHand', 'asc')
                // .limit(limit * 3) // Fetch more to account for filtering
                .get();
                
            let products = productsSnapshot.docs.map(doc => normalizeProductData(doc.id, doc.data() as Record<string, unknown>));
            
            // Filter by threshold
            products = products
                .filter((product) => {
                    const quantityOnHand = toFiniteNumber(product.quantityOnHand ?? product.stock, 0);
                    const productThreshold = hasCustomThreshold
                        ? (thresholdValue as number)
                        : toFiniteNumber(product.lowStockThreshold, product.inventoryType === 'weight' ? 1000 : 10);
                    return quantityOnHand <= productThreshold;
                })
                // .slice(0, limit); // Limit final results
            
            return products;
        } catch (error) {
            console.error('Error fetching low stock products:', (error as Error).message);
            throw error;
        }
    },

    // adding items
    async createProduct(input: CreateProduct): Promise<Product> {
        try {
            const inventoryType: InventoryType = input.inventoryType === 'weight' ? 'weight' : 'unit';
            const baseUnit: BaseUnit = input.baseUnit === 'g' || input.baseUnit === 'kg' ? input.baseUnit : (inventoryType === 'weight' ? 'g' : 'pcs');
            const salesUnit: SalesUnit = input.salesUnit === 'g' || input.salesUnit === 'kg'
                ? input.salesUnit
                : (inventoryType === 'weight' ? 'kg' : 'pcs');
            const quantityOnHand = toFiniteNumber(input.quantityOnHand ?? input.stock, 0);
            const lowStockThreshold = toFiniteNumber(
                input.lowStockThreshold,
                inventoryType === 'weight' ? 1000 : 10
            );
            // const saleStep = toFiniteNumber(
            //     input.saleStep,
            //     inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1
            // );

            const newProduct = {
                id: input.id, 
                name: input.name,
                price: input.price,
                stock: quantityOnHand,
                quantityOnHand,
                inventoryType,
                baseUnit,
                salesUnit,
                lowStockThreshold,
                // saleStep,
                ...(input.category ? { category: input.category } : {}),
                createdAt: new Date()
            };
            // await dbCashier.collection(COLLECTION_NAME).add(newProduct);

            if ((await dbCashier.collection(COLLECTION_NAME).doc(input.id).get()).exists) {
                throw new Error('Product with the same ID already exists');    
            }
            await dbCashier.collection(COLLECTION_NAME).doc(input.id).set(newProduct);
            // return { success: true, message: 'Product created successfully', data: newProduct };
            return newProduct;
        } catch (error) {
            console.error('Error creating product:', (error as Error).message);
            throw error;
        }
    },

    // updating items
    async update(id: string, input: UpdateProduct): Promise<Product | null> {
        try {
            // Check if the product with the new ID already exists 
            if (input.id && input.id !== id) {
                if ((await dbCashier.collection(COLLECTION_NAME).doc(input.id).get()).exists) {
                    throw new Error('Product with the new ID already exists');
                }
            }

            const updatePayload: Record<string, unknown> = {
                ...input,
            };

            if (input.stock !== undefined && input.quantityOnHand === undefined) {
                updatePayload.quantityOnHand = input.stock;
            }

            if (input.quantityOnHand !== undefined) {
                updatePayload.stock = input.quantityOnHand;
            }

            if (input.inventoryType !== undefined && input.baseUnit === undefined) {
                updatePayload.baseUnit = input.inventoryType === 'weight' ? 'g' : 'pcs';
            }

            if (input.inventoryType !== undefined && input.salesUnit === undefined) {
                updatePayload.salesUnit = input.inventoryType === 'weight' ? 'kg' : 'pcs';
            }

            await dbCashier.collection(COLLECTION_NAME).doc(id).update(updatePayload);
            const updatedDoc = await dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!updatedDoc.exists) {
                return null;
            }
            return normalizeProductData(updatedDoc.id, updatedDoc.data() as Record<string, unknown>);
        } catch (error) {
            console.error('Error updating product:', (error as Error).message);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        try {
            const productDoc = await dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!productDoc.exists) {
                throw new Error('Product not found');
            }
            await dbCashier.collection(COLLECTION_NAME).doc(id).delete();
        } catch (error) {
            console.error('Error deleting product:', (error as Error).message);
            throw error;
        }
    },

    // search items
    // async search(query: string): Promise<Product[]> {
    //     try {
    //         const { products: productsAll } = await this.getAllProducts();
    //         const lowerQuery = query.toLowerCase();
    //         return productsAll.filter((product) =>
    //             product.name.toLowerCase().includes(lowerQuery) ||
    //             (product.category && product.category.toLowerCase().includes(lowerQuery))
    //         )
    //     }
    //     catch(error) {
    //         console.error('Error searching products:', (error as Error).message);
    //         throw error;
    //     }
    // },
    async search(query: string): Promise<Product[]> {
        const snapshot = await dbCashier
            .collection(COLLECTION_NAME)
            .orderBy('name')
            .get();

        const lowerQuery = query.toLowerCase();

        return snapshot.docs
            .map(doc => normalizeProductData(doc.id, doc.data()))
            .filter(product =>
            product.name.toLowerCase().includes(lowerQuery) ||
            String(product.category || '').toLowerCase().includes(lowerQuery)
        );
    },

    async getById(id: string): Promise<Product | null> {
        try {
            const productDoc = await dbCashier.collection(COLLECTION_NAME).doc(id).get();
            
            if (!productDoc.exists) {
                return null;
            }
            
            return normalizeProductData(productDoc.id, productDoc.data() as Record<string, unknown>);
        } catch (error) {
            console.error('Error fetching product by ID:', (error as Error).message);
            throw error;
        }
    },

};