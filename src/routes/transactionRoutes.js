"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transactionServices_1 = require("../services/transactionServices");
const middleware_1 = require("../middleware/middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.isAuthenticated);
// Create new transaction (CREATE)
router.post('/cart', async (req, res) => {
    try {
        const input = req.body;
        // Validate required fields
        if (!input.items || !input.paymentMethod || input.amountPaid === undefined || !input.cashierId || !input.cashierName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        const transaction = await transactionServices_1.TransactionServices.createTransaction(input);
        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    }
    catch (error) {
        console.error('Error:', error);
        const message = error.message || 'Failed to create transaction';
        const isValidationError = message.includes('Insufficient stock') || message.includes('Product not found');
        if (isValidationError) {
            return res.status(400).json({
                success: false,
                error: message,
            });
        }
        res.status(500).json({
            success: false,
            error: message
        });
    }
});
// Get transactions by payment method (specific routes first)
router.get('/cart/payment/:paymentMethod', async (req, res) => {
    try {
        const paymentMethod = req.params.paymentMethod;
        const validMethods = ['cash', 'qris'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}`
            });
        }
        const transactions = await transactionServices_1.TransactionServices.getTransactionsByPaymentMethod(paymentMethod);
        res.status(200).json({
            success: true,
            data: transactions
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get daily summary
router.get('/cart/summary/:date', async (req, res) => {
    try {
        const date = req.params.date;
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        const summary = await transactionServices_1.TransactionServices.getDailySummary(date);
        res.status(200).json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get transactions by cashier
router.get('/cashier/:cashierId/transactions', async (req, res) => {
    try {
        const cashierId = req.user && req.user.uid ? req.user.uid : req.params.cashierId;
        if (!cashierId) {
            return res.status(400).json({
                success: false,
                error: 'Cashier ID not found'
            });
        }
        const transactions = await transactionServices_1.TransactionServices.getTransactionsByCashier(cashierId);
        res.status(200).json({
            success: true,
            data: transactions
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get all transactions (READ ALL) - Admin only
router.get('/cart', middleware_1.isAdmin, async (req, res) => {
    try {
        const transactions = await transactionServices_1.TransactionServices.getAllTransactions();
        res.status(200).json({
            success: true,
            data: transactions
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get single transaction by ID (READ ONE) - generic route after specific ones
router.get('/cart/transactions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const transaction = await transactionServices_1.TransactionServices.getTransactionById(id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.status(200).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Update transaction (UPDATE)
router.put('/cart/transactions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const input = req.body;
        const transaction = await transactionServices_1.TransactionServices.updateTransaction(id, input);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Delete transaction (DELETE)
router.delete('/cart/transactions/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await transactionServices_1.TransactionServices.deleteTransaction(id);
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        });
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=transactionRoutes.js.map