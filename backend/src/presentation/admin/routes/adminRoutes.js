
import express from 'express';
import { protect, authorize } from '../../../middleware/authMiddleware.js';
import prisma from '../../../config/db.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

// @route   GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isVerified: true,
            createdAt: true,
            _count: {
                select: {
                    meals: true,
                    orders: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(users);
}));

// @route   GET /api/admin/users/:id
router.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
            meals: true,
            orders: true,
            reviews: true
        }
    });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.json(user);
}));

// @desc    Update user
// @route   PUT /api/admin/users/:id
router.put('/users/:id', asyncHandler(async (req, res) => {
    const { name, phone, role, isVerified } = req.body;
    const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { name, phone, role, isVerified }
    });
    res.json(user);
}));

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', asyncHandler(async (req, res) => {
    await prisma.user.delete({
        where: { id: req.params.id }
    });
    res.json({ message: 'User deleted' });
}));

// @route   GET /api/admin/stats
router.get('/stats', asyncHandler(async (req, res) => {
    const [
        userCount,
        cookCount,
        deliveryCount,
        mealCount,
        orderCount,
        revenue
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'Cook' } }),
        prisma.user.count({ where: { role: 'Delivery' } }),
        prisma.meal.count(),
        prisma.order.count(),
        prisma.order.aggregate({
            _sum: { totalPrice: true },
            where: { isPaid: true }
        })
    ]);

    res.json({
        userCount,
        cookCount,
        deliveryCount,
        mealCount,
        orderCount,
        totalRevenue: revenue._sum.totalPrice || 0
    });
}));

// @route   GET /api/admin/orders
router.get('/orders', asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        include: {
            user: { select: { name: true, email: true } },
            orderItems: true,
            deliveryPerson: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
}));

// @route   PUT /api/admin/orders/:id/resolve
router.put('/orders/:id/resolve', asyncHandler(async (req, res) => {
    const { resolution, refund } = req.body;
    const order = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            adminNotes: resolution,
            isRefunded: refund || false
        }
    });
    res.json(order);
}));

router.get('/safety-logs', asyncHandler(async (req, res) => {
    const logs = await prisma.aISafetyLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    res.json(logs);
}));

export default router;
