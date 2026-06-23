import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js';
import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['Customer', 'Cook', 'Rider', 'Admin'];

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password && password.length >= 6;
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    if (!validateEmail(email)) {
        res.status(400);
        throw new Error('Invalid email format');
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Name, email, and password are required');
    }

    if (!validateEmail(email)) {
        res.status(400);
        throw new Error('Invalid email format');
    }

    if (!validatePassword(password)) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    if (role && !VALID_ROLES.includes(role)) {
        res.status(400);
        throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const userExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'Customer',
            phone: phone || null,
        },
    });

    res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
    });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatar: true,
            isAvailable: true,
            createdAt: true,
        },
    });

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

const toggleAvailability = asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) { res.status(404); throw new Error('User not found'); }
    const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { isAvailable: !user.isAvailable },
    });
    res.json({ isAvailable: updated.isAvailable });
});

const savePushToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    await prisma.user.update({
        where: { id: req.user.id },
        data: { pushToken: token },
    });
    res.json({ message: 'Push token saved' });
});

const googleAuth = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) { res.status(400); throw new Error('Access token required'); }

    const googleRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!googleRes.ok) { res.status(401); throw new Error('Invalid Google token'); }

    const googleUser = await googleRes.json();
    const email = googleUser.email.toLowerCase();

    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
        isNewUser = true;
        const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
        user = await prisma.user.create({
            data: { name: googleUser.name, email, password: randomPassword, role: 'Customer' },
        });
    }

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isNewUser,
        token: generateToken(user.id),
    });
});

const updateProfile = asyncHandler(async (req, res) => {
    const { name, phone, email } = req.body;
    if (email) {
        const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (existing && existing.id !== req.user.id) {
            res.status(400);
            throw new Error('Email already in use by another account');
        }
    }
    const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
            ...(name && { name }),
            ...(phone !== undefined && { phone: phone || null }),
            ...(email && { email: email.toLowerCase() }),
        },
        select: { id: true, name: true, email: true, phone: true, role: true, isAvailable: true },
    });
    res.json(updated);
});

const saveLocation = asyncHandler(async (req, res) => {
    const { lat, lng, address } = req.body;
    await prisma.user.update({
        where: { id: req.user.id },
        data: { cookLat: lat, cookLng: lng, cookAddress: address || null },
    });
    res.json({ message: 'Location saved' });
});

const uploadAvatar = asyncHandler(async (req, res) => {
    const { avatar } = req.body;
    if (!avatar) { res.status(400); throw new Error('No avatar provided'); }
    await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar },
    });
    res.json({ avatar });
});

const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.review.deleteMany({ where: { userId } });
    await prisma.address.deleteMany({ where: { userId } });

    const cookMeals = await prisma.meal.findMany({ where: { cookId: userId }, select: { id: true } });
    const cookMealIds = cookMeals.map(m => m.id);
    if (cookMealIds.length > 0) {
        await prisma.review.deleteMany({ where: { mealId: { in: cookMealIds } } });
        await prisma.orderItem.deleteMany({ where: { mealId: { in: cookMealIds } } });
        await prisma.meal.deleteMany({ where: { cookId: userId } });
    }

    const userOrders = await prisma.order.findMany({ where: { userId }, select: { id: true } });
    const userOrderIds = userOrders.map(o => o.id);
    if (userOrderIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: { in: userOrderIds } } });
        await prisma.order.deleteMany({ where: { userId } });
    }

    await prisma.order.updateMany({ where: { riderId: userId }, data: { riderId: null } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Account deleted' });
});

const setRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const allowedRoles = ['Customer', 'Cook', 'Rider'];
    if (!role || !allowedRoles.includes(role)) {
        res.status(400);
        throw new Error('Role must be Customer, Cook, or Rider');
    }
    const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
    });
    res.json(updated);
});

export { authUser, registerUser, googleAuth, getUserProfile, updateProfile, toggleAvailability, savePushToken, saveLocation, setRole, uploadAvatar, deleteAccount };
