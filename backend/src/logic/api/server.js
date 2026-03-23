import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from '../middleware/errorHandler.js';
import { notFound } from '../middleware/errorMiddleware.js';

// Import routes
import adminRoutes from '../presentation/admin/routes/adminRoutes.js';
import customerRoutes from '../presentation/customer/routes/customerRoutes.js';
import cookRoutes from '../presentation/cook/routes/cookRoutes.js';
import deliveryRoutes from '../presentation/delivery/routes/deliveryRoutes.js';
import orderRoutes from '../logic/services/order/orderRoutes.js';
import authRoutes from '../logic/services/auth/authRoutes.js';
import paymentRoutes from '../logic/services/payment/paymentRoutes.js';
import deliveryServiceRoutes from '../logic/services/delivery/deliveryRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        version: '1.0.0',
        services: ['api', 'ai-safety']
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryServiceRoutes);

// Presentation Layer Routes
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/cook', cookRoutes);
app.use('/api/delivery', deliveryRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍽️  Main API Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down...');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down...');
    server.close(() => process.exit(0));
});

export default app;
