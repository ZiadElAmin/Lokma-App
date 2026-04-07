import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

const addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        const order = await prisma.order.create({
            data: {
                user: { connect: { id: req.user.id } },
                shippingAddress,
                paymentMethod,
                taxPrice,
                shippingPrice,
                totalPrice,
                orderItems: {
                    create: orderItems.map((item) => ({
                        name: item.name,
                        qty: item.qty,
                        image: item.image,
                        price: item.price,
                        meal: { connect: { id: item.meal } },
                    })),
                },
            },
            include: { orderItems: true },
        });
        res.status(201).json(order);
    }
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
            user: { select: { name: true, email: true } },
            orderItems: true,
        },
    });
    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (order) {
        const updatedOrder = await prisma.order.update({
            where: { id: req.params.id },
            data: {
                isPaid: true,
                paidAt: new Date(),
                paymentResult: JSON.stringify({
                    id: req.body.id,
                    status: req.body.status,
                    update_time: req.body.update_time,
                    email_address: req.body.email_address,
                }),
            },
        });
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            userId: req.user.id,
            isRejected: false,
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
});

const getCookOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            orderItems: {
                some: {
                    meal: { cookId: req.user.id },
                },
            },
        },
        include: {
            orderItems: {
                include: { meal: true },
            },
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
});

const acceptOrder = asyncHandler(async (req, res) => {
    const { aiVerified } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: { isAccepted: true, aiVerified: aiVerified || false },
    });
    res.json(updatedOrder);
});

const rejectOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: { isRejected: true, isAccepted: false },
    });
    res.json(updatedOrder);
});

export { addOrderItems, getOrderById, updateOrderToPaid, getMyOrders, getCookOrders, acceptOrder, rejectOrder };