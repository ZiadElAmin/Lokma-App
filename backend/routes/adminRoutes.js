import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import prisma from '../config/db.js';

router.route('/users')
    .get(protect, admin, async (req, res) => {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                violationCount: true,
                isDisabled: true,
                createdAt: true,
            },
        });
        res.json(users);
    });

router.route('/users/:id/disable')
    .put(protect, admin, async (req, res) => {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isDisabled: true, isAvailable: false },
            select: { id: true, name: true, isDisabled: true },
        });
        res.json(user);
    });

router.route('/users/:id/enable')
    .put(protect, admin, async (req, res) => {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { isDisabled: false, violationCount: 0, isAvailable: true },
            select: { id: true, name: true, isDisabled: true, violationCount: true, isAvailable: true },
        });
        res.json(user);
    });

router.route('/violations')
    .get(protect, admin, async (req, res) => {
        const violations = await prisma.violation.findMany({
            include: { cook: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(violations);
    });

router.route('/users/:id')
    .delete(protect, admin, async (req, res) => {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    });

router.route('/cooks')
    .get(protect, admin, async (req, res) => {
        const cooks = await prisma.user.findMany({
            where: { role: 'Cook' },
            select: {
                id: true,
                name: true,
                email: true,
                violationCount: true,
                isDisabled: true,
                createdAt: true,
            },
        });
        res.json(cooks);
    });

router.route('/orders')
    .get(protect, admin, async (req, res) => {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: { name: true, email: true },
                },
                orderItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    })
    .put(protect, admin, async (req, res) => {
        const { id, isPaid, isDelivered } = req.body;
        const order = await prisma.order.update({
            where: { id },
            data: { isPaid, isDelivered },
        });
        res.json(order);
    });

router.route('/orders/:id')
    .delete(protect, admin, async (req, res) => {
        const { id } = req.params;
        await prisma.order.delete({ where: { id } });
        res.json({ message: 'Order deleted' });
    });

router.route('/riders')
    .get(protect, admin, async (req, res) => {
        const riders = await prisma.user.findMany({
            where: { role: 'Rider' },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        res.json(riders);
    });

router.route('/stats')
    .get(protect, admin, async (req, res) => {
        const [userCount, cookCount, riderCount, mealCount, orderCount, totalRevenue] = await Promise.all([
            prisma.user.count({ where: { role: 'Customer' } }),
            prisma.user.count({ where: { role: 'Cook' } }),
            prisma.user.count({ where: { role: 'Rider' } }),
            prisma.meal.count(),
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { totalPrice: true } }),
        ]);
        res.json({
            userCount,
            cookCount,
            riderCount,
            mealCount,
            orderCount,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
        });
    });

export default router;
