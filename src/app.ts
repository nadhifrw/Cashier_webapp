import express, { Request, Response, NextFunction } from "express"
import { isAuthenticated, isAdmin } from './middleware/middleware';
import cors from "cors"
import dotenv from "dotenv"

// Routes
import productRoutes from "./routes/productRoutes"
import transactionRoutes from "./routes/transactionRoutes"
import reportRoutes from "./routes/reportRoutes"
import authRoutes from "./routes/authRoutes"

const app = express()
dotenv.config();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
// Add this after the CORS and express middleware (around line 19)
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Cashier Web App API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/products", productRoutes);
app.use("/cart", transactionRoutes);
app.use("/reports", reportRoutes);
app.use("/auth", authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
