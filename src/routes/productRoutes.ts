import { Router, Request, Response } from "express";
import { ProductServices } from '../services/productServices';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        // const productsSnapshot = await getDocs(productServices);
        const products = await ProductServices.getAllProducts();
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

router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, price, stock } = req.body;
        if(!name || price == undefined || stock == undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields: name, price, stock' });
        }
        await ProductServices.createProduct(name, price, stock);
        res.json({ success: true, message: 'Product created successfully', data: { name, price, stock } });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

export default router;

