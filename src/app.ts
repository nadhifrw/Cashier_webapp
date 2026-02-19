// import express, { Request, Response, NextFunction } from 'express';
// import cors from 'cors';

// // Import routes
// import productRoutes from './routes/productRoutes';
// import transactionRoutes from './routes/transactionRoutes';
// import authRoutes from './routes/authRoutes';

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Request logging middleware
// app.use((req: Request, res: Response, next: NextFunction) => {
//   console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//   next();
// });

// // Health check
// app.get('/', (req: Request, res: Response) => {
//   res.json({ 
//     status: 'ok', 
//     message: 'Cashier Web App API',
//     version: '1.0.0',
//     timestamp: new Date().toISOString()
//   });
// });

// // API Routes
// app.use('/api/products', productRoutes);
// app.use('/api', transactionRoutes);  // Includes /cart, /checkout, /transactions, /reports
// app.use('/api/auth', authRoutes);

// // 404 handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({ success: false, error: 'Route not found' });
// });

// // Error handler
// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error('Error:', err.message);
//   res.status(500).json({ success: false, error: 'Internal server error' });
// });

// app.listen(port, () => {
//   console.log(`🚀 Cashier Web App running on http://localhost:${port}`);
//   console.log(`📦 API endpoints:`);
//   console.log(`   - Products: GET/POST /api/products`);
//   console.log(`   - Cart: GET/POST /api/cart`);
//   console.log(`   - Checkout: POST /api/checkout`);
//   console.log(`   - Transactions: GET /api/transactions`);
//   console.log(`   - Reports: GET /api/reports/daily`);
//   console.log(`   - Auth: POST /api/auth/login, /api/auth/register`);
// });

import express, { Request, Response } from "express"
import dotenv from "dotenv"

// Routes
import producutRoutes from "./routes/productRoutes"

const app = express()
const port = process.env.PORT
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Testing!')
})

app.use("/products", producutRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
