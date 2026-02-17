import { Router, Request, Response } from "express";
import { getAllProducts } from '../services/productServices';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        // const productsSnapshot = await getDocs(productServices);
        const products = await getAllProducts();
        res.json({ success: true, data: products });
        // const products = productsSnapshot.docs.map(doc => ({
        //     id: doc.id,
        //     ...doc.data()
        // }))
        // if (!productServices) {
        //     return res.status(404).json({ success: false, error: 'Products collection not found' });
        // } else {
        //     return res.json({ success: true, data: productServices });
        // };
    } catch (error) {
        res.status(500).json({
        success: false,
        error: (error as Error).message,
        });
    }
})
export default router;

