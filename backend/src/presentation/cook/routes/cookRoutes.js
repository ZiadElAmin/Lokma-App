/**
 * Cook Presentation Layer - Routes
 * 
 * Cook features:
 * - Menu management (CRUD meals)
 * - AI hygiene check
 * - Order management
 * - View earnings
 */

import express from 'express';
import { protect, authorize } from '../../../middleware/authMiddleware.js';
import prisma from '../../../config/db.js';
import asyncHandler from 'express-async-handler';
import axios from 'axios';

const router = express.Router();

const AI_SAFETY_URL = process.env.AI_SAFETY_URL || 'http://localhost:5001';

// All routes require cook role
router.use(protect);
router.use(authorize('Cook', 'Admin'));

router.get('/meals', asyncHandler(async (req, res) => {
    const meals = await prisma.meal.findMany({
        where: { cookId: req.user.id },
        include: {
            reviews: true,
            _count: { select: { orderItems: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(meals);
}));

router.post('/meals', asyncHandler(async (req, res) => {
    const { name, description, price, image } = req.body;

    const meal = await prisma.meal.create({
        data: {
            name,
            description,
            price,
            image,
            cookId: req.user.id
        }
    });

    res.status(201).json(meal);
}));

router.put('/meals/:id', asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findUnique({
        where: { id: req.params.id }
    });

    if (!meal || meal.cookId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const updated = await prisma.meal.update({
        where: { id: req.params.id },
        data: req.body
    });

    res.json(updated);
}));

router.delete('/meals/:id', asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findUnique({
        where: { id: req.params.id }
    });

    if (!meal || meal.cookId !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized');
    }

    await prisma.meal.delete({
        where: { id: req.params.id }
    });

    res.json({ message: 'Meal deleted' });
}));

router.put('/meals/:id/availability', asyncHandler(async (req, res) => {
    const { isAvailable } = req.body;
    
    const meal = await prisma.meal.update({
        where: { id: req.params.id },
        data: { isAvailable }
    });

    res.json(meal);
}));

router.post('/hygiene-check', asyncHandler(async (req, res) => {
    const { cleanlinessLevel, previousScore } = req.body;

    try {
        const response = await axios.post(`${AI_SAFETY_URL}/api/safety/hygiene`, {
            cookId: req.user.id,
            cleanlinessLevel,
            previousScore
        });

        // Log to database
        await prisma.aISafetyLog.create({
            data: {
                type: 'HYGIENE_CHECK',
                subjectId: req.user.id,
                subjectType: 'User',
                status: response.data.status,
                score: response.data.score,
                details: response.data
            }
        });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: 'AI Safety service unavailable',
            message: 'Please try again later'
        });
    }
}));

router.get('/earnings', asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            orderItems: {
                some: { meal: { cookId: req.user.id } }
            },
            status: 'DELIVERED'
        },
        include: {
            orderItems: {
                where: { meal: { cookId: req.user.id } }
            }
        }
    });

    const totalEarnings = orders.reduce((sum, order) => {
        return sum + order.orderItems.reduce((itemSum, item) => {
            return itemSum + (item.price * item.qty);
        }, 0);
    }, 0);

    res.json({
        totalOrders: orders.length,
        totalEarnings,
        recentOrders: orders.slice(-10)
    });
}));

export default router;
