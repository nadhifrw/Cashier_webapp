import { Router, Request, Response } from "express";
import { TransactionServices } from '../services/transactionServices';
import { CreateTransactionInput, PaymentMethod } from '../models/transaction';
import { isAuthenticated, isAdmin } from "../middleware/middleware";

const router = Router();
router.use(isAuthenticated);

// Create new transaction (CREATE)
router.post('/cart', async (req: Request, res: Response) => {
    try {
        const input: CreateTransactionInput = req.body;
        
        // Validate required fields
        if (!input.items || !input.paymentMethod || input.amountPaid === undefined || !input.cashierId || !input.cashierName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields' 
            });
        }

        const transaction = await TransactionServices.createTransaction(input);
        res.status(201).json({ 
            success: true, 
            message: 'Transaction created successfully', 
            data: transaction 
        });
    } catch (error) {
        console.error('Error:', error);
        const message = (error as Error).message || 'Failed to create transaction';
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
router.get('/cart/payment/:paymentMethod', async (req: Request, res: Response) => {
    try {
        const paymentMethod = req.params.paymentMethod as string;
        const validMethods = ['cash', 'qris'];
        
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid payment method. Must be one of: ${validMethods.join(', ')}` 
            });
        }

        const transactions = await TransactionServices.getTransactionsByPaymentMethod(paymentMethod as PaymentMethod);
        res.status(200).json({ 
            success: true, 
            data: transactions 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Get daily summary
router.get('/cart/summary/:date', async (req: Request, res: Response) => {
    try {
        const date = req.params.date as string;
        
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        const summary = await TransactionServices.getDailySummary(date);
        res.status(200).json({ 
            success: true, 
            data: summary 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Get transactions by cashier
router.get('/cashier/:cashierId/transactions', async (req: Request, res: Response) => {
    try {
        const cashierId = req.user && req.user.uid ? req.user.uid : req.params.cashierId as string;
        if (!cashierId) {
            return res.status(400).json({
                success: false,
                error: 'Cashier ID not found'
            });
        }
        const transactions = await TransactionServices.getTransactionsByCashier(cashierId);
        
        res.status(200).json({ 
            success: true, 
            data: transactions 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Get all transactions (READ ALL) - Admin only
router.get('/cart', isAdmin, async (req: Request, res: Response) => {
    try {
        const transactions = await TransactionServices.getAllTransactions();
        res.status(200).json({ 
            success: true, 
            data: transactions 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Get single transaction by ID (READ ONE) - generic route after specific ones
router.get('/cart/transactions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const transaction = await TransactionServices.getTransactionById(id);
        
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
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Update transaction (UPDATE)
router.put('/cart/transactions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const input: Partial<CreateTransactionInput> = req.body;

        const transaction = await TransactionServices.updateTransaction(id, input);
        
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
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

// Delete transaction (DELETE)
router.delete('/cart/transactions/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await TransactionServices.deleteTransaction(id);

        res.status(200).json({ 
            success: true, 
            message: 'Transaction deleted successfully' 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

export default router;