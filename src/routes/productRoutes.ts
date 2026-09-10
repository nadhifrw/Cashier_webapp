import { Router, Request, Response } from "express";
import { ProductServices } from '../services/productServices';
import { isAuthenticated, hasRole, isAdmin } from '../middleware/middleware';

const router = Router();
// router.use(isAuthenticated);
// router.use(hasRole('admin'));
const allowRead = hasRole('admin', 'cashier');

router.get('/low-stock', isAuthenticated, allowRead, async (req: Request, res: Response) => {
    try {
        const thresholdRaw = req.query.threshold;
        const parsedThreshold = thresholdRaw === undefined ? undefined : Number(thresholdRaw);
        const threshold = Number.isFinite(parsedThreshold) && Number(parsedThreshold) >= 0
            ? Number(parsedThreshold)
            : undefined;
        // const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 10;
        // const startAfter = req.query.startAfter ? String(req.query.startAfter) : undefined;
        const products = await ProductServices.getLowStockProducts(threshold);

        res.json({
            success: true,
            data: products,
            threshold,
            count: products.length,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
});

// getting all products with pagination (default 10 per page)
router.get('/', isAuthenticated, allowRead, async (req: Request, res: Response) => {
    try {
        // const productsSnapshot = await getDocs(productServices);
        const {search, limit, startAfter} = req.query;
        if (search) {
            const products = await ProductServices.search(search as string);
            return res.json({ success: true, data: products, message: "seach works" });
        } else {
            const pageLimit = limit ? Math.min(parseInt(limit as string), 50) : 10; // Max 50 items per page
            const startAfterValue = startAfter ? String(startAfter) : undefined;
            const result = await ProductServices.getAllProducts(pageLimit, startAfterValue);
            res.json({ 
                success: true, 
                data: result.products,
                totalProducts: result.totalProducts,
                pagination: {
                    hasMore: result.hasMore,
                    nextCursor: result.nextCursor ?? null
                },
                message: "get all products works" 
            });
        }
    } catch (error) {
    // get item by id
    router.get('/:id', isAuthenticated, allowRead, async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const product = await ProductServices.getById(id as string);
            if (!product) {
                return res.status(404).json({ success: false, error: 'Product not found' });
            }
            res.json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: (error as Error).message,
            });
        }
    })
        res.status(500).json({
        success: false,
        error: (error as Error).message,
        });
    }
})

// create new items
router.post('/', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const {
            id,
            name,
            price,
            stock,
            quantityOnHand,
            inventoryType,
            baseUnit,
            salesUnit,
            lowStockThreshold,
            // saleStep,
            category,
        } = req.body;

        const resolvedQuantityOnHand = quantityOnHand ?? stock;
        if(!id || !name || price == undefined || resolvedQuantityOnHand == undefined || price < 0 || resolvedQuantityOnHand < 0) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, name, price, quantityOnHand' });
        }
        const newProduct = await ProductServices.createProduct({
            id,
            name,
            price,
            stock,
            quantityOnHand: resolvedQuantityOnHand,
            inventoryType,
            baseUnit,
            salesUnit,
            lowStockThreshold,
            // saleStep,
            category,
        });
        res.json({ success: true, message: 'Product created successfully', data: newProduct });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

// // get item by id
router.get('/:id', isAuthenticated, allowRead, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const product = await ProductServices.getById(id as string);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})


// update items
router.put('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const productUpdate = await ProductServices.update(id as string, req.body);
        if (!productUpdate) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        //TODO: make sure there is no duplicate id when updating id
        

        res.json({ success: true, message: 'Product updated successfully', data: productUpdate });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: (error as Error).message,
        });
    }
})

// delete items
router.delete('/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
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

