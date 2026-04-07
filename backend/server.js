import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

console.log('Starting server setup...');

try {
    dotenv.config();
    console.log('JWT_SECRET at startup:', process.env.JWT_SECRET)
    console.log('JWT_SECRET:', process.env.JWT_SECRET)
    console.log('dotenv configured.');

    const app = express();
    console.log('Express app created.');

    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    console.log('CORS middleware enabled.');

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    console.log('Request body parsing middleware enabled.');

    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    console.log('Health check endpoint created.');

    app.use('/api/users', userRoutes);
    app.use('/api/meals', mealRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/admin', adminRoutes);
    console.log('Routes configured.');

    app.use(notFound);
    app.use(errorHandler);
    console.log('Error handling middleware configured.');

    const PORT = process.env.PORT || 5000;
    console.log(`Port set to ${PORT}.`);

    console.log('Starting server...');
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please stop the existing process.`);
            console.error(`Run: netstat -ano | findstr :${PORT} to find the process`);
            process.exit(1);
        }
        console.error('Server error:', error);
        process.exit(1);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    function gracefulShutdown(signal) {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }

    // export default app;

} catch (error) {
    console.error('Error during server setup:', error);
    process.exit(1);
}
