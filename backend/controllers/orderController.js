import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';
import { sendPushNotification } from '../utils/notifications.js';
import { checkKitchenSafety } from '../utils/gemini.js';
import { nextComplianceDue } from '../utils/complianceScheduler.js';
import Stripe from 'stripe';

const addOrderItems = asyncHandler(async (req, res) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice, deliveryLat, deliveryLng } = req.body;
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
            deliveryLat: deliveryLat || null,
            deliveryLng: deliveryLng || null,
            orderItems: {
                create: orderItems.map((item) => ({
                    name: item.name,
                    qty: item.qty,
                    image: item.image,
                    price: item.price,
                    note: item.note || null,
                    meal: { connect: { id: item.meal } },
                })),
            },
        },
        include: {
            orderItems: { include: { meal: { include: { cook: true } } } },
        },
    });

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
            user: { select: { name: true, email: true, phone: true } },
            orderItems: true,
        },
    });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const myReviews = await prisma.review.findMany({
        where: { userId: req.user.id, orderId: order.id },
        select: { mealId: true },
    });
    res.json({ ...order, reviewedMealIds: myReviews.map(r => r.mealId) });
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
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
        where: { userId: req.user.id },
        include: { orderItems: { select: { name: true, qty: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
});

const getCookOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            isCancelled: false,
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
            user: { select: { name: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
});

const acceptOrder = asyncHandler(async (req, res) => {
    const { aiVerified } = req.body;
    if (req.user.isDisabled) {
        res.status(403);
        throw new Error('Your account is disabled due to repeated hygiene violations. Contact support.');
    }
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true, orderItems: { include: { meal: { select: { estimatedTime: true } } } } },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    const estimatedMinutes = order.orderItems.reduce(
        (max, i) => Math.max(max, i.meal?.estimatedTime || 0), 0
    ) || null;
    const updatedOrder = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            isAccepted: true,
            acceptedAt: new Date(),
            estimatedMinutes,
            aiVerified: aiVerified || false,
            complianceDueAt: nextComplianceDue(),
            complianceReminderSent: false,
            complianceLastCheck: new Date(),
        },
    });
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '✅ Order Accepted!',
            'Your order has been accepted and is being prepared.',
            { orderId: order.id }
        );
    }

    const availableRiders = await prisma.user.findMany({
        where: { role: 'Rider', isAvailable: true, pushToken: { not: null } },
        select: { pushToken: true },
    });
    if (availableRiders.length > 0) {
        await sendPushNotification(
            availableRiders.map(r => r.pushToken),
            '🛵 New Delivery Available!',
            'A cook just accepted an order. Tap to claim the delivery.',
            { orderId: order.id, type: 'delivery' }
        );
    }

    const io = req.app.get('io');
    io?.to(`user_${order.userId}`).emit('order_update', { orderId: order.id, status: 'accepted' });
    io?.to('riders').emit('order_update', { orderId: order.id, status: 'new_available' });
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
            'Tap to see other meals you might like instead.',
            { orderId: order.id, type: 'rejected' }
        );
    }
    req.app.get('io')?.to(`user_${order.userId}`).emit('order_update', { orderId: order.id, status: 'rejected' });
    res.json(updatedOrder);
});

const markOrderReady = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { user: true, rider: true },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (!order.isAccepted) { res.status(400); throw new Error('Order must be accepted before marking ready'); }
    const updated = await prisma.order.update({
        where: { id: req.params.id },

        data: { isReadyForPickup: true, readyAt: new Date(), complianceDueAt: null, complianceReminderSent: false },
    });
    if (order.user?.pushToken) {
        await sendPushNotification(
            [order.user.pushToken],
            '🍱 Food is Ready!',
            order.riderId ? 'Your order is ready — your rider is on the way to pick it up.'
                          : 'Your order is ready and waiting for a rider to pick it up.',
            { orderId: order.id }
        );
    }

    const io = req.app.get('io');
    if (order.riderId) {

        if (order.rider?.pushToken) {
            await sendPushNotification(
                [order.rider.pushToken],
                '🍱 Order Ready for Pickup!',
                'The food you claimed is ready. Head to the kitchen to pick it up.',
                { orderId: order.id, type: 'delivery' }
            );
        }
        io?.to(`user_${order.riderId}`).emit('order_update', { orderId: order.id, status: 'ready_for_pickup' });
    } else {

        const availableRiders = await prisma.user.findMany({
            where: { role: 'Rider', isAvailable: true, pushToken: { not: null } },
            select: { pushToken: true },
        });
        if (availableRiders.length > 0) {
            await sendPushNotification(
                availableRiders.map(r => r.pushToken),
                '🛵 New Delivery Available!',
                'A new order is ready for pickup. Tap to claim it.',
                { orderId: order.id, type: 'delivery' }
            );
        }
        io?.to('riders').emit('order_update', { orderId: order.id, status: 'new_available' });
    }
    io?.to(`user_${order.userId}`).emit('order_update', { orderId: order.id, status: 'ready' });
    res.json(updated);
});

const getAvailableOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: {
            isAccepted: true,
            isRejected: false,
            isCancelled: false,
            riderId: null,        // not yet claimed
            isDelivered: false,

        },
        include: {
            orderItems: {
                include: {
                    meal: {
                        include: {
                            cook: { select: { name: true, cookLat: true, cookLng: true, cookAddress: true } },
                        },
                    },
                },
            },
            user: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
    });
    res.json(orders);
});

const claimOrder = asyncHandler(async (req, res) => {
    try {
        const updated = await prisma.order.update({
            where: {
                id: req.params.id,
                riderId: null,
                isAccepted: true,
                isCancelled: false,
            },
            data: { riderId: req.user.id },
        });
        const io = req.app.get('io');

        io?.to('riders').emit('order_update', { orderId: req.params.id, status: 'claimed' });
        io?.to(`user_${updated.userId}`).emit('order_update', { orderId: req.params.id, status: 'rider_assigned' });
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
    req.app.get('io')?.to(`user_${order.userId}`).emit('order_update', { orderId: order.id, status: 'picked_up' });
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
    req.app.get('io')?.to(`user_${order.userId}`).emit('order_update', { orderId: order.id, status: 'delivered' });
    res.json(updated);
});

const getRiderOrders = asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
        where: { riderId: req.user.id },
        include: {
            orderItems: {
                include: {
                    meal: {
                        include: {
                            cook: { select: { name: true, cookLat: true, cookLng: true, cookAddress: true } },
                        },
                    },
                },
            },
            user: { select: { name: true, phone: true } },
        },
        orderBy: { updatedAt: 'desc' },
    });
    res.json(orders);
});

const createPaymentIntent = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.userId !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
    if (order.isPaid) { res.status(400); throw new Error('Order already paid'); }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.totalPrice * 100),
        currency: 'egp',
        metadata: { orderId: order.id },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
});

const deleteOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id }
    });

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    await prisma.orderItem.deleteMany({
        where: { orderId: req.params.id },
    });

    await prisma.order.delete({
        where: { id: req.params.id },
    });

    res.json({ message: 'Order deleted successfully' });
});
const getCookEarnings = asyncHandler(async (req, res) => {
    const items = await prisma.orderItem.findMany({
        where: {
            meal: { cookId: req.user.id },
            order: { isDelivered: true },
        },
        select: { price: true, qty: true },
    });
    const totalEarnings = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const completedOrders = await prisma.order.count({
        where: {
            isDelivered: true,
            orderItems: { some: { meal: { cookId: req.user.id } } },
        },
    });
    res.json({ totalEarnings, completedOrders });
});

const getRiderEarnings = asyncHandler(async (req, res) => {
    const result = await prisma.order.aggregate({
        where: { riderId: req.user.id, isDelivered: true },
        _sum: { shippingPrice: true },
        _count: { id: true },
    });
    res.json({
        totalEarnings: result._sum.shippingPrice || 0,
        completedDeliveries: result._count.id || 0,
    });
});

const cancelOrder = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (order.userId !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
    if (order.isAccepted) { res.status(400); throw new Error('Cannot cancel  cook has already accepted this order'); }
    if (order.isCancelled) { res.status(400); throw new Error('Order is already cancelled'); }

    const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: { isCancelled: true },
    });

    const cookIds = [...new Set(
        (await prisma.orderItem.findMany({
            where: { orderId: order.id },
            include: { meal: { select: { cookId: true } } },
        })).map(i => i.meal.cookId)
    )];
    const cooks = await prisma.user.findMany({
        where: { id: { in: cookIds }, pushToken: { not: null } },
        select: { pushToken: true },
    });
    if (cooks.length > 0) {
        await sendPushNotification(
            cooks.map(c => c.pushToken),
            '❌ Order Cancelled',
            'A customer cancelled their order.',
            { orderId: order.id }
        );
    }
    const io = req.app.get('io');
    cookIds.forEach(cookId => io?.to(`user_${cookId}`).emit('order_update', { orderId: order.id, status: 'cancelled' }));
    res.json(updated);
});

const submitCompliance = asyncHandler(async (req, res) => {
    const { aiVerified } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (!order.isAccepted || order.isReadyForPickup || order.isDelivered) {
        res.status(400);
        throw new Error('This order is no longer in the cooking stage');
    }
    if (!aiVerified) {
        res.status(400);
        throw new Error('Photo must pass the PPE check before it can be submitted');
    }
    const updated = await prisma.order.update({
        where: { id: req.params.id },
        data: {
            complianceDueAt: nextComplianceDue(),
            complianceReminderSent: false,
            complianceLastCheck: new Date(),
        },
    });
    res.json({ message: 'Compliance check recorded', complianceLastCheck: updated.complianceLastCheck });
});

const envCheck = asyncHandler(async (req, res) => {
    const { image, mimeType } = req.body;
    if (!image) { res.status(400); throw new Error('No environment photo provided'); }

    const result = await checkKitchenSafety(image, mimeType || 'image/jpeg');

    await prisma.order.update({
        where: { id: req.params.id },
        data: { envSafe: result.safe, envRecommendations: result.recommendations },
    }).catch(() => {});

    res.json(result);
});

const getOrderRecommendations = asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { orderItems: { include: { meal: { select: { category: true, cookId: true } } } } },
    });
    if (!order) { res.status(404); throw new Error('Order not found'); }

    const categories = [...new Set(order.orderItems.map(i => i.meal?.category).filter(Boolean))];
    const rejectedCookIds = [...new Set(order.orderItems.map(i => i.meal?.cookId).filter(Boolean))];

    let meals = await prisma.meal.findMany({
        where: {
            cook: { isAvailable: true, isDisabled: false },
            cookId: { notIn: rejectedCookIds },
            ...(categories.length ? { category: { in: categories } } : {}),
        },
        include: { cook: { select: { id: true, name: true } } },
        orderBy: { rating: 'desc' },
        take: 10,
    });

    if (meals.length === 0) {
        meals = await prisma.meal.findMany({
            where: { cook: { isAvailable: true, isDisabled: false }, cookId: { notIn: rejectedCookIds } },
            include: { cook: { select: { id: true, name: true } } },
            orderBy: { rating: 'desc' },
            take: 10,
        });
    }

    res.json(meals);
});

export {
    addOrderItems, getOrderById, updateOrderToPaid, getMyOrders, getCookOrders,
    acceptOrder, rejectOrder, deleteOrder, createPaymentIntent,
    markOrderReady, getAvailableOrders, claimOrder, pickupOrder, deliverOrder, getRiderOrders,
    cancelOrder, getCookEarnings, getRiderEarnings,
    submitCompliance, envCheck, getOrderRecommendations,
};