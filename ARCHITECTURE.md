# Peer-to-Peer Food Ordering System Architecture

## Project Structure

```
backend/
├── src/
│   ├── presentation/          # Presentation Layer - Routes & Controllers
│   │   ├── admin/            # Admin interfaces
│   │   │   ├── controllers/
│   │   │   └── routes/
│   │   ├── customer/         # Customer interfaces
│   │   │   ├── controllers/
│   │   │   └── routes/
│   │   ├── cook/            # Cook interfaces
│   │   │   ├── controllers/
│   │   │   └── routes/
│   │   └── delivery/        # Delivery/Rider interfaces
│   │       ├── controllers/
│   │       └── routes/
│   │
│   ├── logic/               # Logic Layer - Business Logic & Services
│   │   ├── api/            # Main API Server
│   │   │   └── server.js
│   │   └── services/       # Microservices
│   │       ├── auth/       # Authentication service
│   │       ├── order/     # Order lifecycle service
│   │       ├── payment/    # Payment processing service
│   │       ├── delivery/   # Delivery/rider matching service
│   │       └── ai-safety/ # AI Safety microservice
│   │
│   ├── data/               # Data Layer - Schemas & Database
│   │   ├── schemas/       # Database models
│   │   │   ├── userSchema.js
│   │   │   ├── mealSchema.js
│   │   │   ├── orderSchema.js
│   │   │   ├── paymentSchema.js
│   │   │   ├── reviewSchema.js
│   │   │   ├── deliverySchema.js
│   │   │   └── aiSafetyLogSchema.js
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── middleware/         # Express middleware
│   └── utils/             # Utilities
│
├── ai-safety-service/     # AI Safety Microservice (Separate)
│   ├── src/
│   │   ├── models/       # ML models
│   │   ├── services/     # AI logic
│   │   └── utils/
│   └── server.js
│
└── frontend/              # React Native Expo App
    └── app/
        ├── admin/         # Admin screens
        ├── customer/      # Customer screens
        ├── cook/          # Cook screens
        └── delivery/      # Delivery screens
```

## Order Lifecycle Flow

```
1. Customer browses meals
   ↓
2. Customer creates order
   ↓
3. Order status: PENDING
   ↓
4. Cook accepts order
   ↓
5. Order status: COOKING
   ↓
6. Cook marks ready
   ↓
7. Order status: READY_FOR_PICKUP
   ↓
8. Delivery person accepts
   ↓
9. Order status: PICKED_UP
   ↓
10. Delivery person delivers
    ↓
11. Order status: DELIVERED
    ↓
12. Customer leaves review
```

## API Endpoints

### Order Lifecycle Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create new order |
| GET | /api/orders | Get all orders (filtered by role) |
| GET | /api/orders/:id | Get order details |
| PUT | /api/orders/:id/accept | Cook accepts order |
| PUT | /api/orders/:id/cooking | Order is being cooked |
| PUT | /api/orders/:id/ready | Food is ready |
| PUT | /api/orders/:id/pickup | Delivery picked up |
| PUT | /api/orders/:id/deliver | Order delivered |
| PUT | /api/orders/:id/cancel | Cancel order |
| GET | /api/orders/customer/:id | Get customer's orders |
| GET | /api/orders/cook/:id | Get cook's orders |
| GET | /api/orders/delivery/:id | Get delivery person's orders |

## User Roles

| Role | Description |
|------|-------------|
| Customer | Browse, order, pay, review |
| Cook | Manage menu, cook meals, AI hygiene check |
| Delivery | Accept deliveries, track orders |
| Admin | Manage users, resolve issues |
