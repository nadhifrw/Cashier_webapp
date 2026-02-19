import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { dbCashier } from '../config/firebase';

const COLLECTION_NAME = 'products';
// const productServices = collection(dbCashier, COLLECTION_NAME);

export const ProductServices = {
    async getAllProducts() {
        try {
        const productsSnapshot = await dbCashier.collection(COLLECTION_NAME).get();
        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) 
        return products;
        } catch (error) {
            console.error('Error fetching products:', (error as Error).message);
            throw error;
        }
    },

    async createProduct(name:string, price: number, stock:number) {
        try {
            const now = Timestamp.now();
            const newProduct = {
                name,
                price,
                stock,
                createdAt: now
            };
            // await dbCashier.collection(COLLECTION_NAME).add(newProduct);
            await dbCashier.collection(COLLECTION_NAME).add(newProduct);
            // return { success: true, message: 'Product created successfully', data: newProduct };
        } catch (error) {
            console.error('Error creating product:', (error as Error).message);
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