import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { dbCashier } from '../config/firebase';
import { Product, CreateProduct, UpdateProduct } from '../models/product';

const COLLECTION_NAME = 'products';
// const productServices = collection(dbCashier, COLLECTION_NAME);

export const ProductServices = {
    async getAllProducts():Promise<Product[]> {
        try {
        const productsSnapshot = await dbCashier.collection(COLLECTION_NAME).get();
        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            name: doc.data().name,
            price: doc.data().price,
            stock: doc.data().stock,
        })) 
        return products;
        } catch (error) {
            console.error('Error fetching products:', (error as Error).message);
            throw error;
        }
    },

    // adding items
    async createProduct(input: CreateProduct): Promise<Product> {
        try {
            // const now = Timestamp.now();
            const newProduct = {
                id: input.id, 
                name: input.name,
                price: input.price,
                stock: input.stock,
                createdAt: new Date()
            };
            // await dbCashier.collection(COLLECTION_NAME).add(newProduct);
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
            await dbCashier.collection(COLLECTION_NAME).doc(id).update(input as Record<string, any>);
            const updatedDoc = await dbCashier.collection(COLLECTION_NAME).doc(id).get();
            if (!updatedDoc.exists) {
                return null;
            }
            return {
                id: updatedDoc.id,
                ...updatedDoc.data(),
            } as Product;
        } catch (error) {
            console.error('Error updating product:', (error as Error).message);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        try {
            await dbCashier.collection(COLLECTION_NAME).doc(id).delete();
        } catch (error) {
            console.error('Error deleting product:', (error as Error).message);
            throw error;
        }
    },

    // search items
    async search(query: string): Promise<Product[]> {
        try {
            const productsAll = await this.getAllProducts();
            const lowerQuery = query.toLowerCase();
            return productsAll.filter(product =>
                product.name.toLowerCase().includes(lowerQuery) ||
                (product.category && product.category.toLowerCase().includes(lowerQuery))
            )
        }
        catch(error) {
            console.error('Error searching products:', (error as Error).message);
            throw error;
        }
    }

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