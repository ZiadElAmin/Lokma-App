import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

const getAddresses = asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
    });
    res.json(addresses);
});

const createAddress = asyncHandler(async (req, res) => {
    const { label, lat, lng, building, floor, apartment, notes } = req.body;
    if (!lat || !lng || !building) {
        res.status(400);
        throw new Error('lat, lng, and building are required');
    }
    const address = await prisma.address.create({
        data: {
            userId: req.user.id,
            label: label || 'Home',
            lat,
            lng,
            building,
            floor: floor || null,
            apartment: apartment || null,
            notes: notes || null,
        },
    });
    res.status(201).json(address);
});

const deleteAddress = asyncHandler(async (req, res) => {
    const address = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!address) { res.status(404); throw new Error('Address not found'); }
    if (address.userId !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Address deleted' });
});

export { getAddresses, createAddress, deleteAddress };
