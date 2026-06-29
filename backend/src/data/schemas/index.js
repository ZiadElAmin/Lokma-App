
export const OrderStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    COOKING: 'COOKING',
    READY: 'READY',
    PICKED_UP: 'PICKED_UP',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
};

export const UserRoles = {
    CUSTOMER: 'Customer',
    COOK: 'Cook',
    DELIVERY: 'Delivery',
    ADMIN: 'Admin'
};

export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
};

export const AISafetyCheckType = {
    HYGIENE_CHECK: 'HYGIENE_CHECK',
    IMAGE_MODERATION: 'IMAGE_MODERATION',
    CONTENT_FILTER: 'CONTENT_FILTER',
    ANOMALY_DETECTION: 'ANOMALY_DETECTION',
    IDENTITY_VERIFICATION: 'IDENTITY_VERIFICATION'
};

export const AISafetyStatus = {
    PASS: 'PASS',
    FAIL: 'FAIL',
    PENDING: 'PENDING',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED'
};
