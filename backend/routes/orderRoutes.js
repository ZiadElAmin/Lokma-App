import express from 'express';

const router = express.Router();
import {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    getMyOrders,
    getCookOrders,
    acceptOrder,
    rejectOrder,
    deleteOrder,
    markOrderReady,
    getAvailableOrders,
    claimOrder,
    pickupOrder,
    deliverOrder,
    getRiderOrders,
} from '../controllers/orderController.js';
import { protect, cook, rider } from '../middleware/authMiddleware.js';

router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/cookorders').get(protect, cook, getCookOrders);
router.route('/available').get(protect, rider, getAvailableOrders);
router.route('/riderorders').get(protect, rider, getRiderOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/accept').put(protect, acceptOrder);
router.route('/:id/reject').put(protect, rejectOrder);
router.route('/:id/ready').put(protect, cook, markOrderReady);
router.route('/:id/claim').put(protect, rider, claimOrder);
router.route('/:id/pickup').put(protect, rider, pickupOrder);
router.route('/:id/deliver').put(protect, rider, deliverOrder);
router.route('/orders/:id').delete(deleteOrder);

export default router;