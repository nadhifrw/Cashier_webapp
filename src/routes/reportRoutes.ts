import { Router, Request, Response } from "express";
import { ReportServices } from '../services/reportServices';
import { isAuthenticated, isAdmin } from "../middleware/middleware";

const router = Router();
router.use(isAuthenticated);

/**
 * GET /reports/daily/:date
 * Get daily sales report for a specific date (YYYY-MM-DD)
 */
router.get('/daily/:date', async (req: Request, res: Response) => {
    try {
        const date = req.params.date as string;
        
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        const report = await ReportServices.getDailySalesReport(date);
        res.status(200).json({ 
            success: true, 
            data: report 
        });
    } catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

/**
 * GET /reports/monthly/:year/:month
 * Get monthly sales report
 */
router.get('/monthly/:year/:month', async (req: Request, res: Response) => {
    try {
        const year = req.params.year as string;
        const month = req.params.month as string;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid year or month' 
            });
        }

        const report = await ReportServices.getMonthlySalesReport(yearNum, monthNum);
        res.status(200).json({ 
            success: true, 
            data: report 
        });
    } catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

/**
 * GET /reports/cashier-performance
 * Get cashier performance report
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/cashier-performance', async (req: Request, res: Response) => {
    try {
        let startDate = (req.query.startDate as string) || '';
        let endDate = (req.query.endDate as string) || '';

        // Set defaults (last 30 days)
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0] || '';
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0] || '';
        }

        const report = await ReportServices.getCashierPerformanceReport(startDate, endDate);
        res.status(200).json({ 
            success: true, 
            data: report 
        });
    } catch (error) {
        console.error('Error generating cashier performance report:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

/**
 * GET /reports/products
 * Get product sales report
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/products', async (req: Request, res: Response) => {
    try {
        let startDate = (req.query.startDate as string) || '';
        let endDate = (req.query.endDate as string) || '';

        // Set defaults (last 30 days)
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0] || '';
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0] || '';
        }

        const report = await ReportServices.getProductSalesReport(startDate, endDate);
        res.status(200).json({ 
            success: true, 
            data: report 
        });
    } catch (error) {
        console.error('Error generating product sales report:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

/**
 * GET /reports/revenue-trend
 * Get revenue trend
 * Query params: days (default: 30)
 */
router.get('/revenue-trend', async (req: Request, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;

        if (days < 1 || days > 365) {
            return res.status(400).json({ 
                success: false, 
                error: 'Days must be between 1 and 365' 
            });
        }

        const trend = await ReportServices.getRevenueTrend(days);
        res.status(200).json({ 
            success: true, 
            data: trend 
        });
    } catch (error) {
        console.error('Error generating revenue trend:', error);
        res.status(500).json({ 
            success: false, 
            error: (error as Error).message 
        });
    }
});

export default router;
