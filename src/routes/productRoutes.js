"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productServices_1 = require("../services/productServices");
const middleware_1 = require("../middleware/middleware");
const router = (0, express_1.Router)();
// router.use(isAuthenticated);
// router.use(hasRole('admin'));
const allowRead = (0, middleware_1.hasRole)('admin', 'cashier');
router.get('/low-stock', middleware_1.isAuthenticated, allowRead, async (req, res) => {
    try {
        const thresholdRaw = req.query.threshold;
        const parsedThreshold = thresholdRaw === undefined ? undefined : Number(thresholdRaw);
        const threshold = Number.isFinite(parsedThreshold) && Number(parsedThreshold) >= 0
            ? Number(parsedThreshold)
            : undefined;
        const products = await productServices_1.ProductServices.getLowStockProducts(threshold);
        res.json({
            success: true,
            data: products,
            threshold,
            count: products.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// getting all products
router.get('/', middleware_1.isAuthenticated, allowRead, async (req, res) => {
    try {
        // const productsSnapshot = await getDocs(productServices);
        const { search } = req.query;
        if (search) {
            const products = await productServices_1.ProductServices.search(search);
            return res.json({ success: true, data: products, message: "seach works" });
        }
        else {
            const products = await productServices_1.ProductServices.getAllProducts();
            res.json({ success: true, data: products, message: "get all products works" });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// create new items
router.post('/', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const { id, name, price, stock, quantityOnHand, inventoryType, baseUnit, salesUnit, lowStockThreshold, saleStep, category, } = req.body;
        const resolvedQuantityOnHand = quantityOnHand ?? stock;
        if (!id || !name || price == undefined || resolvedQuantityOnHand == undefined || price < 0 || resolvedQuantityOnHand < 0) {
            return res.status(400).json({ success: false, error: 'Missing required fields: id, name, price, quantityOnHand' });
        }
        const newProduct = await productServices_1.ProductServices.createProduct({
            id,
            name,
            price,
            stock,
            quantityOnHand: resolvedQuantityOnHand,
            inventoryType,
            baseUnit,
            salesUnit,
            lowStockThreshold,
            saleStep,
            category,
        });
        res.json({ success: true, message: 'Product created successfully', data: newProduct });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// update items
router.put('/:id', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const productUpdate = await productServices_1.ProductServices.update(id, req.body);
        if (!productUpdate) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        //TODO: make sure there is no duplicate id when updating id
        res.json({ success: true, message: 'Product updated successfully', data: productUpdate });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// delete items
router.delete('/:id', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await productServices_1.ProductServices.delete(id);
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=productRoutes.js.map