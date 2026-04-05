import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

// @desc    Fetch all meals
// @route   GET /api/meals
// @access  Public
const getMeals = asyncHandler(async (req, res) => {
    const meals = await prisma.meal.findMany({
        include: {
            cook: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(meals);
});

// @desc    Fetch cook's meals
// @route   GET /api/meals/my-meals
// @access  Private/Cook
const getCookMeals = asyncHandler(async (req, res) => {
    const meals = await prisma.meal.findMany({
        where: { cookId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(meals);
});

// @desc    Fetch single meal
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

// @desc    Create a meal
// @route   POST /api/meals
// @access  Private/Cook
const createMeal = asyncHandler(async (req, res) => {
    const { name, price, description, image } = req.body;

    const meal = await prisma.meal.create({
        data: {
            name,
            price,
            cookId: req.user.id,
            image,
            description,
        },
    });

    res.status(201).json(meal);
});

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private/Cook
const updateMeal = asyncHandler(async (req, res) => {
    const { name, price, description, image } = req.body;

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
            },
        });
        res.json(updatedMeal);
    } else {
        res.status(404);
        throw new Error('Meal not found');
    }
});

// @desc    Delete a meal
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

export { getMeals, getMealById, createMeal, updateMeal, deleteMeal, getCookMeals };
