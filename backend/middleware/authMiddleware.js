import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.id }
            });

            if (user) {
                const { password, ...userWithoutPassword } = user;
                req.user = userWithoutPassword;
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized');
        }
        
        if (roles.includes(req.user.role)) {
            next();
        } else {
            res.status(403);
            throw new Error(`Role '${req.user.role}' is not authorized to access this resource`);
        }
    };
};

// Legacy middleware (for backward compatibility)
const cook = (req, res, next) => {
    if (req.user && (req.user.role === 'Cook' || req.user.role === 'Admin')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as a cook');
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

const delivery = (req, res, next) => {
    if (req.user && (req.user.role === 'Delivery' || req.user.role === 'Admin')) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as delivery person');
    }
};

export { protect, authorize, cook, admin, delivery };
