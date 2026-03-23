/**
 * Order Lifecycle Management Service
 * 
 * Order States:
 * 1. PENDING - Order created, waiting for cook
 * 2. ACCEPTED - Cook accepted the order
 * 3. COOKING - Cook is preparing the food
 * 4. READY - Food is ready for pickup
 * 5. PICKED_UP - Delivery person picked up
 * 6. DELIVERED - Order completed
 * 7. CANCELLED - Order cancelled
 */

import prisma from '../../config/db.js';
import asyncHandler from 'express-async-handler';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Customer
const createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('Order must have at least one item');
    }

    // Calculate prices
    const itemsPrice = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const taxPrice = itemsPrice * 0.05;
    const shippingPrice = 2.99;
    const totalPrice = itemsPrice + taxPrice + shippingPrice;

    const order = await prisma.order.create({
        data: {
            userId,
            shippingAddress,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            status: 'PENDING',
            orderItems: {
                create: items.map(item => ({
                    mealId: item.mealId,
                    name: item.name,
                    qty: item.qty,
                    image: item.image,
                    price: item.price
                }))
            }
        },
        include: {
            orderItems: true,
            user: {
                select: { id: true, name: true, email: true }
            }
        }
    });

    // Notify nearby cooks (future: push notification)
    
    res.status(201).json(order);
});

// @desc    Get orders based on user role
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.query;

    let whereClause = {};

    switch (userRole) {
        case 'Customer':
            whereClause.userId = userId;
            break;
        case 'Cook':
            whereClause.orderItems = {
                some: {
                    meal: {
                        cookId: userId
                    }
                }
            };
            break;
        case 'Delivery':
            whereClause.deliveryPersonId = userId;
            break;
        case 'Admin':
            // Admin sees all orders
            break;
        default:
            throw new Error('Invalid role');
    }

    if (status) {
        whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
            user: { select: { id: true, name: true, email: true } },
            orderItems: {
                include: {
                    meal: {
                        select: { cookId: true }
                    }
                }
            },
            deliveryPerson: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            orderItems: {
                include: {
                    meal: {
                        include: {
                            cook: { select: { id: true, name: true } }
                        }
                    }
                }
            },
            deliveryPerson: { select: { id: true, name: true, phone: true } },
            reviews: true
        }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Check authorization
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const isCustomer = order.userId === userId;
    const isCook = order.orderItems.some(item => item.meal.cookId === userId);
    const isDelivery = order.deliveryPersonId === userId;
    const isAdmin = userRole === 'Admin';

    if (!isCustomer && !isCook && !isDelivery && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this order');
    }

    res.json(order);
});

// @desc    Cook accepts order
// @route   PUT /api/orders/:id/accept
// @access  Private/Cook
const acceptOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
            orderItems: {
                include: { meal: true }
            }
        }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.status !== 'PENDING') {
        res.status(400);
        throw new Error('Order cannot be accepted in current state');
    }

    // Verify cook owns at least one item
    const cookOwnsItem = order.orderItems.some(item => item.meal.cookId === req.user.id);
    if (!cookOwnsItem) {
        res.status(403);
        throw new Error('You can only accept orders for your meals');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'ACCEPTED',
            acceptedAt: new Date()
        }
    });

    res.json(updatedOrder);
});

// @desc    Start cooking order
// @route   PUT /api/orders/:id/cooking
// @access  Private/Cook
const startCooking = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.status !== 'ACCEPTED') {
        res.status(400);
        throw new Error('Order must be accepted before cooking');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'COOKING',
            cookingStartedAt: new Date()
        }
    });

    res.json(updatedOrder);
});

// @desc    Mark order as ready
// @route   PUT /api/orders/:id/ready
// @access  Private/Cook
const markReady = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.status !== 'COOKING') {
        res.status(400);
        throw new Error('Order must be cooking before marking ready');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'READY',
            readyAt: new Date()
        }
    });

    res.json(updatedOrder);
});

// @desc    Delivery person picks up order
// @route   PUT /api/orders/:id/pickup
// @access  Private/Delivery
const pickupOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.status !== 'READY') {
        res.status(400);
        throw new Error('Order must be ready for pickup');
    }

    if (order.deliveryPersonId && order.deliveryPersonId !== req.user.id) {
        res.status(400);
        throw new Error('Order already assigned to another delivery person');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'PICKED_UP',
            deliveryPersonId: req.user.id,
            pickedUpAt: new Date()
        }
    });

    res.json(updatedOrder);
});

// @desc    Mark order as delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Delivery
const deliverOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.status !== 'PICKED_UP') {
        res.status(400);
        throw new Error('Order must be picked up before delivery');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            isDelivered: true
        }
    });

    res.json(updatedOrder);
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Define cancellable states
    const cancellableStates = ['PENDING', 'ACCEPTED'];
    if (!cancellableStates.includes(order.status)) {
        res.status(400);
        throw new Error('Order cannot be cancelled at this stage');
    }

    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelReason: reason
        }
    });

    res.json(updatedOrder);
});

// @desc    Get orders for cook
// @route   GET /api/orders/cook
// @access  Private/Cook
const getCookOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            orderItems: {
                some: {
                    meal: {
                        cookId: req.user.id
                    }
                }
            },
            status: { in: ['PENDING', 'ACCEPTED', 'COOKING', 'READY'] }
        },
        include: {
            user: { select: { id: true, name: true, phone: true } },
            orderItems: {
                where: {
                    meal: { cookId: req.user.id }
                },
                include: {
                    meal: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    res.json(orders);
});

// @desc    Get available orders for delivery
// @route   GET /api/orders/available
// @access  Private/Delivery
const getAvailableOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            status: 'READY',
            deliveryPersonId: null
        },
        include: {
            user: { select: { id: true, name: true, phone: true } },
            orderItems: {
                include: {
                    meal: {
                        select: {
                            name: true,
                            image: true
                        }
                    }
                }
            }
        },
        orderBy: { readyAt: 'asc' }
    });

    res.json(orders);
});

export {
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
};
