"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportServices_1 = require("../services/reportServices");
const middleware_1 = require("../middleware/middleware");
const router = (0, express_1.Router)();
router.use(middleware_1.isAuthenticated);
/**
 * GET /reports/daily/:date
 * Get daily sales report for a specific date (YYYY-MM-DD)
 */
router.get('/daily/:date', async (req, res) => {
    try {
        const date = req.params.date;
        // Validate date format
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        const report = await reportServices_1.ReportServices.getDailySalesReport(date);
        res.status(200).json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating daily report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /reports/monthly/:year/:month
 * Get monthly sales report
 */
router.get('/monthly/:year/:month', async (req, res) => {
    try {
        const year = req.params.year;
        const month = req.params.month;
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({
                success: false,
                error: 'Invalid year or month'
            });
        }
        const report = await reportServices_1.ReportServices.getMonthlySalesReport(yearNum, monthNum);
        res.status(200).json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating monthly report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /reports/cashier-performance
 * Get cashier performance report
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/cashier-performance', async (req, res) => {
    try {
        let startDate = req.query.startDate || '';
        let endDate = req.query.endDate || '';
        // Set defaults (last 30 days)
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0] || '';
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0] || '';
        }
        const report = await reportServices_1.ReportServices.getCashierPerformanceReport(startDate, endDate);
        res.status(200).json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating cashier performance report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /reports/products
 * Get product sales report
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
router.get('/products', async (req, res) => {
    try {
        let startDate = req.query.startDate || '';
        let endDate = req.query.endDate || '';
        // Set defaults (last 30 days)
        if (!startDate || !endDate) {
            const now = new Date();
            endDate = now.toISOString().split('T')[0] || '';
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = thirtyDaysAgo.toISOString().split('T')[0] || '';
        }
        const report = await reportServices_1.ReportServices.getProductSalesReport(startDate, endDate);
        res.status(200).json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Error generating product sales report:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * GET /reports/revenue-trend
 * Get revenue trend
 * Query params: days (default: 30)
 */
router.get('/revenue-trend', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        if (days < 1 || days > 365) {
            return res.status(400).json({
                success: false,
                error: 'Days must be between 1 and 365'
            });
        }
        const trend = await reportServices_1.ReportServices.getRevenueTrend(days);
        res.status(200).json({
            success: true,
            data: trend
        });
    }
    catch (error) {
        console.error('Error generating revenue trend:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=reportRoutes.js.map