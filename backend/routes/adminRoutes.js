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
                createdAt: true,
            },
        });
        res.json(users);
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

router.route('/stats')
    .get(protect, admin, async (req, res) => {
        const [userCount, cookCount, mealCount, orderCount, totalRevenue] = await Promise.all([
            prisma.user.count({ where: { role: 'Customer' } }),
            prisma.user.count({ where: { role: 'Cook' } }),
            prisma.meal.count(),
            prisma.order.count(),
            prisma.order.aggregate({ _sum: { totalPrice: true } }),
        ]);
        res.json({
            userCount,
            cookCount,
            mealCount,
            orderCount,
            totalRevenue: totalRevenue._sum.totalPrice || 0,
        });
    });

export default router;
