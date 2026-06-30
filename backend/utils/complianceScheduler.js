import prisma from '../config/db.js';
import { sendPushNotification } from './notifications.js';

const CHECK_EVERY_MS = 15 * 1000;
const GRACE_MS = 2 * 60 * 1000;
// TESTING: re-check fires ~60s after acceptance. Restore to 7/13 min for production.
const INTERVAL_MIN_MS = 60 * 1000;
const INTERVAL_MAX_MS = 60 * 1000;
const AUTO_DISABLE_THRESHOLD = 5;

export const nextComplianceDue = () =>
    new Date(Date.now() + INTERVAL_MIN_MS + Math.random() * (INTERVAL_MAX_MS - INTERVAL_MIN_MS));

const getOrderCook = async (orderId) => {
    const item = await prisma.orderItem.findFirst({
        where: { orderId },
        include: { meal: { include: { cook: true } } },
    });
    return item?.meal?.cook || null;
};

const recordViolation = async (cook, orderId, io) => {
    await prisma.violation.create({
        data: { cookId: cook.id, orderId, reason: 'Missed 10-minute PPE compliance photo' },
    });

    const newCount = cook.violationCount + 1;
    const shouldDisable = newCount >= AUTO_DISABLE_THRESHOLD && !cook.isDisabled;

    await prisma.user.update({
        where: { id: cook.id },
        data: {
            violationCount: newCount,
            ...(shouldDisable ? { isDisabled: true, isAvailable: false } : {}),
        },
    });

    if (cook.pushToken) {
        if (shouldDisable) {
            await sendPushNotification(
                [cook.pushToken],
                '🚫 Account Disabled',
                `You reached ${AUTO_DISABLE_THRESHOLD} hygiene violations. Your account has been disabled. Contact support.`,
                { type: 'disabled' }
            );
        } else {
            await sendPushNotification(
                [cook.pushToken],
                `⚠️ Hygiene Violation (${newCount}/${AUTO_DISABLE_THRESHOLD})`,
                'You missed a compliance photo. Repeated misses will disable your account.',
                { orderId, type: 'violation' }
            );
        }
    }

    io?.to(`user_${cook.id}`).emit('violation', { count: newCount, disabled: shouldDisable });
};

const scan = async (io) => {
    const now = new Date();
    const dueOrders = await prisma.order.findMany({
        where: {
            isAccepted: true,
            isReadyForPickup: false,
            isDelivered: false,
            isCancelled: false,
            isRejected: false,
            complianceDueAt: { not: null, lte: now },
        },
        select: { id: true, complianceReminderSent: true },
    });

    for (const order of dueOrders) {
        const cook = await getOrderCook(order.id);
        if (!cook) continue;

        if (!order.complianceReminderSent) {
            if (cook.pushToken) {
                await sendPushNotification(
                    [cook.pushToken],
                    '📸 Compliance Check Required',
                    'Take a new photo within 5 minutes to confirm you are still wearing your hairnet and gloves.',
                    { orderId: order.id, type: 'compliance' }
                );
            }
            await prisma.order.update({
                where: { id: order.id },
                data: { complianceReminderSent: true, complianceDueAt: new Date(now.getTime() + GRACE_MS) },
            });
            io?.to(`user_${cook.id}`).emit('compliance_due', { orderId: order.id });
        } else {
            await recordViolation(cook, order.id, io);
            await prisma.order.update({
                where: { id: order.id },
                data: { complianceReminderSent: false, complianceDueAt: nextComplianceDue() },
            });
        }
    }
};

export const startComplianceScheduler = (io) => {
    setInterval(() => {
        scan(io).catch(err => console.error('Compliance scan error:', err.message));
    }, CHECK_EVERY_MS);
    console.log('Compliance scheduler started (scans every 60s).');
};
