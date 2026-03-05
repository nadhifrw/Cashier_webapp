import { Router, Request, Response } from "express";
import { ProductServices } from '../services/productServices';

const router = Router();

// getting all products
router.get('/', async (req: Request, res: Response) => {
    try {
        // const productsSnapshot = await getDocs(productServices);
        const {search} = req.query;
        if (search) {
            const products = await ProductServices.search(search as string);
            return res.json({ success: true, data: products, message: "seach works" });
        } else {
            const products = await ProductServices.getAllProducts();
            res.json({ success: true, data: products, message: "get all products works" });
        }
    } catch (error) {
        res.status(500).json({
        success: false,
        error: (error as Error).message,
        });
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        const { id, name, price, stock } = req.body;
        if(!id || !name || price == undefined || stock == undefined) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, name, price, stock' });
        }
        const newProduct = await ProductServices.createProduct({ id ,name, price, stock });
        res.json({ success: true, message: 'Product created successfully', data: newProduct });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

// update items
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productUpdate = await ProductServices.update(id as string, req.body);
        if (!productUpdate) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product updated successfully', data: productUpdate });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

// delete items
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ProductServices.delete(id as string);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

export default router;

