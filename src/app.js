"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const app = (0, express_1.default)();
dotenv_1.default.config();
const port = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Add this after the CORS and express middleware (around line 19)
app.use(express_1.default.static('public'));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Cashier Web App API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use("/products", productRoutes_1.default);
app.use("/cart", transactionRoutes_1.default);
app.use("/reports", reportRoutes_1.default);
app.use("/auth", authRoutes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
//# sourceMappingURL=app.js.map