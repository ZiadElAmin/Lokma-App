import express from 'express';
import { protect, authorize } from '../../../../middleware/authMiddleware.js';
import {
    createOrder,
    getOrders,
    getOrderById,
    acceptOrder,
    startCooking,
    markReady,
    pickupOrder,
    deliverOrder,
    cancelOrder,
    getCookOrders,
    getAvailableOrders
} from '../orderController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Order CRUD
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

// Order lifecycle actions
router.put('/:id/accept', authorize('Cook', 'Admin'), acceptOrder);
router.put('/:id/cooking', authorize('Cook', 'Admin'), startCooking);
router.put('/:id/ready', authorize('Cook', 'Admin'), markReady);
router.put('/:id/pickup', authorize('Delivery', 'Admin'), pickupOrder);
router.put('/:id/deliver', authorize('Delivery', 'Admin'), deliverOrder);
router.put('/:id/cancel', cancelOrder);

// Role-specific endpoints
router.get('/cook/orders', authorize('Cook', 'Admin'), getCookOrders);
router.get('/delivery/available', authorize('Delivery', 'Admin'), getAvailableOrders);

export default router;
