import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

// @route   GET /api/meals
// @access  Public
const getMeals = asyncHandler(async (req, res) => {
    const { search, cookId, category } = req.query;
    const meals = await prisma.meal.findMany({
        where: {
            cook: { isDisabled: false },
            ...(cookId ? { cookId } : {}),
            ...(category ? { category } : {}),
            ...(search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            } : {}),
        },
        include: {
            cook: { select: { id: true, name: true, isAvailable: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(meals);
});

// @access  Private/Cook
const getCookMeals = asyncHandler(async (req, res) => {
    const meals = await prisma.meal.findMany({
        where: { cookId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(meals);
});

// @route   GET /api/meals/:id
// @access  Public
const getMealById = asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findUnique({
        where: {
            id: req.params.id,
        },
        include: {
            cook: {
                select: {
                    id: true,
                    name: true,
                    bio: true,
                    avatar: true,
                },
            },
        },
    });

    if (meal) {
        res.json(meal);
    } else {
        res.status(404);
        throw new Error('Meal not found');
    }
});

// @route   POST /api/meals
// @access  Private/Cook
const createMeal = asyncHandler(async (req, res) => {
    const { name, price, description, image, category, estimatedTime } = req.body;

    const meal = await prisma.meal.create({
        data: {
            name,
            price,
            cookId: req.user.id,
            image,
            description,
            category: category || 'Other',
            estimatedTime: estimatedTime ? Number(estimatedTime) : null,
        },
    });

    res.status(201).json(meal);
});

// @route   PUT /api/meals/:id
// @access  Private/Cook
const updateMeal = asyncHandler(async (req, res) => {
    const { name, price, description, image, category, estimatedTime } = req.body;

    const meal = await prisma.meal.findUnique({
        where: {
            id: req.params.id,
        },
    });

    if (meal) {
        if (meal.cookId !== req.user.id) {
            res.status(401);
            throw new Error('Not authorized to update this meal');
        }

        const updatedMeal = await prisma.meal.update({
            where: {
                id: req.params.id,
            },
            data: {
                name,
                price,
                description,
                image,
                ...(category ? { category } : {}),
                ...(estimatedTime !== undefined ? { estimatedTime: estimatedTime ? Number(estimatedTime) : null } : {}),
            },
        });
        res.json(updatedMeal);
    } else {
        res.status(404);
        throw new Error('Meal not found');
    }
});

// @route   DELETE /api/meals/:id
// @access  Private/Cook
const deleteMeal = asyncHandler(async (req, res) => {
    const meal = await prisma.meal.findUnique({
        where: {
            id: req.params.id,
        },
    });

    if (meal) {
        if (meal.cookId !== req.user.id) {
            res.status(401);
            throw new Error('Not authorized to delete this meal');
        }
        await prisma.meal.delete({
            where: {
                id: req.params.id,
            },
        });
        res.json({ message: 'Meal removed' });
    } else {
        res.status(404);
        throw new Error('Meal not found');
    }
});
const getCooks = asyncHandler(async (req, res) => {
    const cooks = await prisma.user.findMany({
        where: { role: 'Cook', isDisabled: false },
        select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
            isAvailable: true,
            meals: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    description: true,
                    rating: true,
                },
            },
        },
    });
    res.json(cooks);
});

const createReview = asyncHandler(async (req, res) => {
    const { rating, comment, orderId } = req.body;
    const mealId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
        res.status(400); throw new Error('Rating must be between 1 and 5');
    }
    if (!orderId) {
        res.status(400); throw new Error('An order is required to review a meal');
    }

    const meal = await prisma.meal.findUnique({ where: { id: mealId } });
    if (!meal) { res.status(404); throw new Error('Meal not found'); }

    const order = await prisma.order.findFirst({
        where: {
            id: orderId,
            userId: req.user.id,
            isDelivered: true,
            orderItems: { some: { mealId } },
        },
    });
    if (!order) {
        res.status(403);
        throw new Error('You can only review a meal from one of your delivered orders');
    }

    const alreadyReviewed = await prisma.review.findFirst({
        where: { userId: req.user.id, mealId, orderId },
    });
    if (alreadyReviewed) {
        res.status(400); throw new Error('You already reviewed this meal for this order');
    }

    await prisma.review.create({
        data: {
            rating: Number(rating),
            comment: comment || '',
            userId: req.user.id,
            mealId,
            orderId,
            name: req.user.name,
        },
    });

    // Recalculate meal rating
    const allReviews = await prisma.review.findMany({ where: { mealId: req.params.id } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.meal.update({
        where: { id: req.params.id },
        data: { rating: avgRating, numReviews: allReviews.length },
    });

    res.status(201).json({ message: 'Review added' });
});

const canReviewMeal = asyncHandler(async (req, res) => {
    const mealId = req.params.id;

    const deliveredOrders = await prisma.order.findMany({
        where: {
            userId: req.user.id,
            isDelivered: true,
            orderItems: { some: { mealId } },
        },
        select: { id: true },
    });
    if (deliveredOrders.length === 0) {
        return res.json({ canReview: false, reason: 'not_delivered' });
    }

    const reviewedOrderIds = (await prisma.review.findMany({
        where: { userId: req.user.id, mealId, orderId: { not: null } },
        select: { orderId: true },
    })).map(r => r.orderId);

    const unreviewed = deliveredOrders.find(o => !reviewedOrderIds.includes(o.id));
    res.json({
        canReview: !!unreviewed,
        orderId: unreviewed?.id || null,
        reason: unreviewed ? null : 'already_reviewed',
    });
});

const getMealReviews = asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
        where: { mealId: req.params.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
});

export { getMeals, getMealById, createMeal, updateMeal, deleteMeal, getCookMeals, getCooks, createReview, getMealReviews, canReviewMeal };
