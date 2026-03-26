"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductServices = void 0;
const firebase_1 = require("../config/firebase");
const COLLECTION_NAME = 'products';
// const productServices = collection(dbCashier, COLLECTION_NAME);
const toFiniteNumber = (value, fallback) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};
const normalizeProductData = (id, rawData) => {
    const inventoryType = rawData.inventoryType === 'weight' ? 'weight' : 'unit';
    const baseUnit = rawData.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
    const salesUnit = rawData.salesUnit === 'g' || rawData.salesUnit === 'kg'
        ? rawData.salesUnit
        : (inventoryType === 'weight' ? 'kg' : 'pcs');
    const quantityOnHand = toFiniteNumber(rawData.quantityOnHand ?? rawData.stock, 0);
    const defaultThreshold = inventoryType === 'weight' ? 1000 : 10;
    const lowStockThreshold = toFiniteNumber(rawData.lowStockThreshold, defaultThreshold);
    const defaultSaleStep = inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1;
    const saleStep = toFiniteNumber(rawData.saleStep, defaultSaleStep);
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
        saleStep,
    };
};
exports.ProductServices = {
    async getAllProducts() {
        try {
            const productsSnapshot = await firebase_1.dbCashier.collection(COLLECTION_NAME).get();
            const products = productsSnapshot.docs.map(doc => normalizeProductData(doc.id, doc.data()));
            return products;
        }
        catch (error) {
            console.error('Error fetching products:', error.message);
            throw error;
        }
    },
    async getLowStockProducts(threshold) {
        try {
            const allProducts = await this.getAllProducts();
            const hasCustomThreshold = Number.isFinite(threshold) && Number(threshold) >= 0;
            const thresholdValue = hasCustomThreshold ? Number(threshold) : null;
            return allProducts
                .filter((product) => {
                const quantityOnHand = toFiniteNumber(product.quantityOnHand ?? product.stock, 0);
                const productThreshold = hasCustomThreshold
                    ? thresholdValue
                    : toFiniteNumber(product.lowStockThreshold, product.inventoryType === 'weight' ? 1000 : 10);
                return quantityOnHand <= productThreshold;
            })
                .sort((a, b) => toFiniteNumber(a.quantityOnHand ?? a.stock, 0) - toFiniteNumber(b.quantityOnHand ?? b.stock, 0));
        }
        catch (error) {
            console.error('Error fetching low stock products:', error.message);
            throw error;
        }
    },
    // adding items
    async createProduct(input) {
        try {
            const inventoryType = input.inventoryType === 'weight' ? 'weight' : 'unit';
            const baseUnit = input.baseUnit === 'g' ? 'g' : (inventoryType === 'weight' ? 'g' : 'pcs');
            const salesUnit = input.salesUnit === 'g' || input.salesUnit === 'kg'
                ? input.salesUnit
                : (inventoryType === 'weight' ? 'kg' : 'pcs');
            const quantityOnHand = toFiniteNumber(input.quantityOnHand ?? input.stock, 0);
            const lowStockThreshold = toFiniteNumber(input.lowStockThreshold, inventoryType === 'weight' ? 1000 : 10);
            const saleStep = toFiniteNumber(input.saleStep, inventoryType === 'weight' ? (salesUnit === 'kg' ? 0.1 : 100) : 1);
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
                saleStep,
                ...(input.category ? { category: input.category } : {}),
                createdAt: new Date()
            };
            // await dbCashier.collection(COLLECTION_NAME).add(newProduct);
            if ((await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(input.id).get()).exists) {
                throw new Error('Product with the same ID already exists');
            }
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(input.id).set(newProduct);
            // return { success: true, message: 'Product created successfully', data: newProduct };
            return newProduct;
        }
        catch (error) {
            console.error('Error creating product:', error.message);
            throw error;
        }
    },
    // updating items
    async update(id, input) {
        try {
            // Check if the product with the new ID already exists 
            if (input.id && input.id !== id) {
                if ((await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(input.id).get()).exists) {
                    throw new Error('Product with the new ID already exists');
                }
            }
            const updatePayload = {
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
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).update(updatePayload);
            const updatedDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!updatedDoc.exists) {
                return null;
            }
            return normalizeProductData(updatedDoc.id, updatedDoc.data());
        }
        catch (error) {
            console.error('Error updating product:', error.message);
            throw error;
        }
    },
    async delete(id) {
        try {
            const productDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!productDoc.exists) {
                throw new Error('Product not found');
            }
            await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).delete();
        }
        catch (error) {
            console.error('Error deleting product:', error.message);
            throw error;
        }
    },
    // search items
    async search(query) {
        try {
            const productsAll = await this.getAllProducts();
            const lowerQuery = query.toLowerCase();
            return productsAll.filter(product => product.name.toLowerCase().includes(lowerQuery) ||
                (product.category && product.category.toLowerCase().includes(lowerQuery)));
        }
        catch (error) {
            console.error('Error searching products:', error.message);
            throw error;
        }
    },
    async getById(id) {
        try {
            const productDoc = await firebase_1.dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!productDoc.exists) {
                return null;
            }
            return normalizeProductData(productDoc.id, productDoc.data());
        }
        catch (error) {
            console.error('Error fetching product by ID:', error.message);
            throw error;
        }
    },
};
// app.get('/products', async (req: Request, res: Response) => {
//     try {
//         const productsSnapshot = await getDocs(productServices);
//         const products = productsSnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }))
//         res.json({ success: true, data: products });
//     } catch (error) {
//         res.status(500).json({
//         success: false,
//         error: (error as Error).message,
//         });
//     }
// })
//# sourceMappingURL=productServices.js.map