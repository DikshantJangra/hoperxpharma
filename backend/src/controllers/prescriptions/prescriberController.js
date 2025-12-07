const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getPrescribers = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { licenseNumber: { contains: search, mode: 'insensitive' } },
            { clinic: { contains: search, mode: 'insensitive' } }
        ];
    }

    const prescribers = await prisma.prescriber.findMany({
        where,
        orderBy: { name: 'asc' },
        take: 50 // Limit results for performance
    });

    res.status(200).json(
        ApiResponse.success(prescribers, 'Prescribers retrieved successfully')
    );
});

const createPrescriber = asyncHandler(async (req, res) => {
    const { name, licenseNumber, clinic, phoneNumber, email, specialty } = req.body;

    if (!name || !licenseNumber) {
        throw ApiError.badRequest('Name and License Number are required');
    }

    const existing = await prisma.prescriber.findUnique({
        where: { licenseNumber }
    });

    if (existing) {
        throw ApiError.conflict('Prescriber with this license number already exists');
    }

    const prescriber = await prisma.prescriber.create({
        data: {
            name,
            licenseNumber,
            clinic,
            phoneNumber,
            email,
            specialty
        }
    });

    res.status(201).json(
        ApiResponse.success(prescriber, 'Prescriber added successfully')
    );
});

module.exports = {
    getPrescribers,
    createPrescriber
};
