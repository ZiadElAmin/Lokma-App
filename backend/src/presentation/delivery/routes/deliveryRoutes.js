/**
 * Delivery Presentation Layer - Routes
 * 
 * Delivery features:
 * - View available orders
 * - Accept deliveries
 * - Track deliveries
 * - Earnings
 */

import express from 'express';
import { protect, authorize } from '../../../middleware/authMiddleware.js';
import prisma from '../../../config/db.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// All routes require delivery role
router.use(protect);
router.use(authorize('Delivery', 'Admin'));

// @desc    Get available orders
// @route   GET /api/delivery/available
router.get('/available', asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            status: 'READY',
            deliveryPersonId: null
        },
        include: {
            user: { select: { name: true, phone: true } },
            orderItems: {
                include: {
                    meal: { select: { name: true, image: true } }
                }
            }
        },
        orderBy: { readyAt: 'asc' }
    });
    res.json(orders);
}));

// @desc    Get my deliveries
// @route   GET /api/delivery/my-deliveries
router.get('/my-deliveries', asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            deliveryPersonId: req.user.id
        },
        include: {
            user: { select: { name: true, phone: true } },
            orderItems: true
        },
        orderBy: { pickedUpAt: 'desc' }
    });
    res.json(orders);
}));

// @desc    Get delivery stats
// @route   GET /api/delivery/stats
router.get('/stats', asyncHandler(async (req, res) => {
    const deliveries = await prisma.order.findMany({
        where: {
            deliveryPersonId: req.user.id,
            status: 'DELIVERED'
        }
    });

    const earnings = deliveries.length * 2.99; // Fixed delivery fee

    res.json({
        totalDeliveries: deliveries.length,
        totalEarnings: earnings,
        thisMonth: deliveries.filter(d => {
            const date = new Date(d.deliveredAt);
            const now = new Date();
            return date.getMonth() === now.getMonth();
        }).length
    });
}));

export default router;
