const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getPrescribers = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const where = {
        storeId: req.storeId // Filter by current store
    };

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

    // Check if prescriber with same license exists in THIS store
    const existing = await prisma.prescriber.findFirst({
        where: {
            storeId: req.storeId,
            licenseNumber
        }
    });

    console.log('Existing prescriber check:', {
        searchedStoreId: req.storeId,
        searchedLicense: licenseNumber,
        found: existing ? {
            id: existing.id,
            storeId: existing.storeId,
            name: existing.name,
            license: existing.licenseNumber
        } : null
    });

    if (existing) {
        throw ApiError.conflict('Prescriber with this license number already exists in your store');
    }

    console.log('Creating prescriber with data:', {
        storeId: req.storeId,
        name,
        licenseNumber,
        clinic,
        phoneNumber,
        email,
        specialty
    });

    try {
        const prescriber = await prisma.prescriber.create({
            data: {
                storeId: req.storeId,
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
    } catch (error) {
        console.error('Prisma error details:', {
            code: error.code,
            meta: error.meta,
            message: error.message,
            name: error.name
        });

        // Handle unique constraint violation
        if (error.code === 'P2002') {
            const fields = error.meta?.target || [];
            console.log('Unique constraint violated on fields:', fields);
            throw ApiError.conflict(
                `A prescriber with license number "${licenseNumber}" already exists. Please use a different license number.`
            );
        }
        throw error;
    }
});

module.exports = {
    getPrescribers,
    createPrescriber
};
