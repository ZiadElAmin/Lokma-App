/**
 * Customer Presentation Layer - Routes
 * 
 * Customer features:
 * - Browse meals
 * - Create orders
 * - View order history
 * - Leave reviews
 * - Payment
 */

import express from 'express';
import { protect, authorize } from '../../../middleware/authMiddleware.js';
import prisma from '../../../config/db.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// All routes require customer role
router.use(protect);

router.get('/meals', asyncHandler(async (req, res) => {
    const meals = await prisma.meal.findMany({
        where: { isAvailable: true },
        include: {
            cook: { select: { id: true, name: true } },
            reviews: {
                include: { user: { select: { name: true } } }
            }
        },
        orderBy: { rating: 'desc' }
    });
    res.json(meals);
}));

router.get('/meals/:id', asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findUnique({
        where: { id: req.params.id },
        include: {
            cook: { select: { id: true, name: true, phone: true } },
            reviews: {
                include: { user: { select: { name: true } } }
            }
        }
    });
    if (!meal) {
        res.status(404);
        throw new Error('Meal not found');
    }
    res.json(meal);
}));

router.get('/orders', asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
            orderItems: true,
            deliveryPerson: { select: { name: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
}));

router.post('/orders/:id/review', asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { orderItems: true }
    });

    if (!order || order.userId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized');
    }

    if (order.status !== 'DELIVERED') {
        res.status(400);
        throw new Error('Can only review delivered orders');
    }

    // Create review for first meal in order
    const review = await prisma.review.create({
        data: {
            userId: req.user.id,
            mealId: order.orderItems[0].mealId,
            orderId: order.id,
            rating,
            comment
        }
    });

    // Update meal rating
    const allReviews = await prisma.review.findMany({
        where: { mealId: order.orderItems[0].mealId }
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.meal.update({
        where: { id: order.orderItems[0].mealId },
        data: {
            rating: avgRating,
            numReviews: allReviews.length
        }
    });

    res.json(review);
}));

export default router;
