import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';
import { sendPushNotification } from '../utils/notifications.js';

const addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }
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
        include: {
            orderItems: { include: { meal: { include: { cook: true } } } },
        },
    });

    // Notify the cook(s) of the new order
    const cookIds = [...new Set(order.orderItems.map(i => i.meal.cookId))];
    const cooks = await prisma.user.findMany({
        where: { id: { in: cookIds }, pushToken: { not: null } },
        select: { pushToken: true },
    });
    await sendPushNotification(
        cooks.map(c => c.pushToken),
        '🍽️ New Order!',
        `You have a new order for EGP ${totalPrice?.toFixed(2)}`,
        { orderId: order.id }
    );

    res.status(201).json(order);
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
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    // Only the customer who placed the order can pay for it
    if (order.userId !== req.user.id && req.user.role !== 'Admin') {
        res.status(403);
        throw new Error('Not authorized to pay for this order');
    }
    if (order.isPaid) {
        res.status(400);
        throw new Error('Order is already paid');
    }
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
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: { isAccepted: true, aiVerified: aiVerified || false },
    });
    // Notify customer
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '✅ Order Accepted!',
            'Your order has been accepted and is being prepared.',
            { orderId: order.id }
        );
    }
    res.json(updatedOrder);
});

const rejectOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: { isRejected: true, isAccepted: false },
    });
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '❌ Order Rejected',
            'Unfortunately your order was rejected by the cook.',
            { orderId: order.id }
        );
    }
    res.json(updatedOrder);
});
const markOrderReady = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (!order.isAccepted) { res.status(400); throw new Error('Order must be accepted before marking ready'); }
    const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { isReadyForPickup: true, readyAt: new Date() },
    });
    // Notify customer their food is ready
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '🍱 Food is Ready!',
            'Your order is ready and waiting for a rider to pick it up.',
            { orderId: order.id }
        );
    }
    res.json(updated);
});

const getAvailableOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            isAccepted: true,
            isRejected: false,
            isReadyForPickup: true,
            riderId: null,
            isDelivered: false,
        },
        include: {
            orderItems: { include: { meal: true } },
            user: { select: { name: true } },
        },
        orderBy: { readyAt: 'asc' },
    });
    res.json(orders);
});

const claimOrder = asyncHandler(async (req, res) => {
    // Atomic check-and-set: the WHERE clause includes riderId: null so only
    // one rider can ever win even if multiple tap at the exact same time.
    // Prisma throws P2025 if the record doesn't match (already claimed).
    try {
        const updated = await prisma.order.update({
            where: {
                id: req.params.id,
                riderId: null,          // only succeeds if not yet claimed
                isReadyForPickup: true, // only succeeds if cook marked ready
            },
            data: { riderId: req.user.id },
        });
        res.json(updated);
    } catch (err) {
        if (err.code === 'P2025') {
            res.status(400);
            throw new Error('Order already claimed by another rider');
        }
        throw err;
    }
});

const pickupOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true, rider: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.riderId !== req.user.id) { res.status(403); throw new Error('Not authorized — you did not claim this order'); }
    const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { isPickedUp: true, pickedUpAt: new Date() },
    });
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '🛵 Rider is on the way!',
            `${order.rider?.name || 'Your rider'} has picked up your order and is heading to you.`,
            { orderId: order.id }
        );
    }
    res.json(updated);
});

const deliverOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.riderId !== req.user.id) { res.status(403); throw new Error('Not authorized — you did not claim this order'); }
    if (!order.isPickedUp) { res.status(400); throw new Error('Order must be picked up before marking delivered'); }
    const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { isDelivered: true, deliveredAt: new Date() },
    });
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '🎉 Order Delivered!',
            'Your order has been delivered. Enjoy your meal!',
            { orderId: order.id }
        );
    }
    res.json(updated);
});

const getRiderOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { riderId: req.user.id },
        include: {
            orderItems: { include: { meal: true } },
            user: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });
    res.json(orders);
});

const deleteOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ 
        where: { id: req.params.id } 
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Delete related order items first to prevent Prisma foreign key constraint errors
    await prisma.orderItem.deleteMany({
        where: { orderId: req.params.id },
    });

    // Now safely delete the order
    await prisma.order.delete({
        where: { id: req.params.id },
    });

    res.json({ message: 'Order deleted successfully' });
});
export {
    addOrderItems, getOrderById, updateOrderToPaid, getMyOrders, getCookOrders,
    acceptOrder, rejectOrder, deleteOrder,
    markOrderReady, getAvailableOrders, claimOrder, pickupOrder, deliverOrder, getRiderOrders,
};