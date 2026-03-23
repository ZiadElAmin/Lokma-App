/**
 * Data Layer - Database Schemas
 * 
 * This directory contains all database schema definitions
 * organized by domain.
 */

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

/*
Prisma Schema Reference:

model User {
    id        String   @id @default(cuid())
    name      String
    email     String   @unique
    password  String
    phone     String?
    role      Role     @default(Customer)
    isVerified Boolean @default(false)
    meals     Meal[]   @relation("CookMeals")
    orders    Order[]  @relation("UserOrders")
    reviews   Review[]
    deliveries Order[] @relation("DeliveryOrders")
    createdAt DateTime @default(now())
}

model Meal {
    id          String   @id @default(cuid())
    name        String
    description String
    price       Float
    image       String
    cook        User     @relation("CookMeals", fields: [cookId], references: [id])
    cookId      String
    rating      Float    @default(0)
    numReviews  Int      @default(0)
    isAvailable Boolean  @default(true)
    orderItems  OrderItem[]
    reviews     Review[]
    createdAt   DateTime @default(now())
}

model Order {
    id              String       @id @default(cuid())
    user            User         @relation("UserOrders", fields: [userId], references: [id])
    userId          String
    deliveryPerson  User?        @relation("DeliveryOrders", fields: [deliveryPersonId], references: [id])
    deliveryPersonId String?
    status          OrderStatus @default(PENDING)
    shippingAddress String
    paymentMethod   String
    paymentStatus   PaymentStatus @default(PENDING)
    itemsPrice      Float
    taxPrice        Float
    shippingPrice    Float
    totalPrice       Float
    isPaid          Boolean     @default(false)
    paidAt          DateTime?
    isDelivered     Boolean     @default(false)
    deliveredAt     DateTime?
    orderItems      OrderItem[]
    reviews         Review[]
    createdAt       DateTime     @default(now())
}

model OrderItem {
    id        String  @id @default(cuid())
    order     Order   @relation(fields: [orderId], references: [id])
    orderId   String
    meal      Meal    @relation(fields: [mealId], references: [id])
    mealId    String
    name      String
    qty       Int
    image     String
    price     Float
}

model Review {
    id        String   @id @default(cuid())
    user      User     @relation(fields: [userId], references: [id])
    userId    String
    meal      Meal     @relation(fields: [mealId], references: [id])
    mealId    String
    order     Order    @relation(fields: [orderId], references: [id])
    orderId   String
    rating    Float
    comment   String
    createdAt DateTime @default(now())
}

model AISafetyLog {
    id          String   @id @default(cuid())
    type        AISafetyCheckType
    subjectId   String   // User or Meal ID
    subjectType String   // 'User' or 'Meal'
    status      AISafetyStatus
    score       Float?
    details     Json?
    checkedBy   String?  // Admin who verified
    createdAt   DateTime @default(now())
}
*/
