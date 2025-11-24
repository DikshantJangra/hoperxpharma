// backend/src/controllers/onboarding/onboarding.controller.js

const { PrismaClient } = require('@prisma/client');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../middlewares/asyncHandler');

const prisma = new PrismaClient();

// Map day names to numbers (0 = Sunday, 6 = Saturday)
const DAY_MAP = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
};

/**
 * Get onboarding progress for the current user
 */
const getProgress = asyncHandler(async (req, res) => {
    // If no user is authenticated, return empty progress
    if (!req.user || !req.user.id) {
        return res.status(200).json(new ApiResponse(200, {
            currentStep: 1,
            completedSteps: [],
            data: {},
            isComplete: false
        }));
    }

    const progress = await prisma.onboardingProgress.findUnique({
        where: { userId: req.user.id }
    });

    if (!progress) {
        return res.status(200).json(new ApiResponse(200, {
            currentStep: 1,
            completedSteps: [],
            data: {},
            isComplete: false
        }));
    }

    return res.status(200).json(new ApiResponse(200, progress));
});

/**
 * Save onboarding progress for the current user
 */
const saveProgress = asyncHandler(async (req, res) => {
    // If no user is authenticated, skip saving
    if (!req.user || !req.user.id) {
        return res.status(200).json(new ApiResponse(200, { success: true }));
    }

    const { currentStep, completedSteps, data, isComplete } = req.body;

    const progress = await prisma.onboardingProgress.upsert({
        where: { userId: req.user.id },
        update: {
            currentStep: currentStep || 1,
            completedSteps: completedSteps || [],
            data: data || {},
            isComplete: isComplete || false
        },
        create: {
            userId: req.user.id,
            currentStep: currentStep || 1,
            completedSteps: completedSteps || [],
            data: data || {},
            isComplete: isComplete || false
        }
    });

    return res.status(200).json(new ApiResponse(200, progress));
});

/**
 * Complete onboarding: create store, licenses, operating hours in a transaction.
 * Expected payload:
 * {
 *   store: { name, displayName, addressLine1, addressLine2?, city, state, pinCode, phoneNumber, email?, whatsapp?, gstin?, dlNumber?, dlValidityStart?, dlValidityEnd?, dlDocument?, gstCertificate? },
 *   licenses: [{ type, licenseNumber, issuedBy, issuedDate, expiryDate, documentUrl? }],
 *   operatingHours: [{ dayOfWeek, openTime, closeTime, isClosed }]
 * }
 */
const completeOnboarding = asyncHandler(async (req, res) => {
    const { store, licenses = [], operatingHours = [], suppliers = [], users = [] } = req.body;
    
    if (!store || !store.name) {
        throw new ApiError(400, 'Store data is required');
    }

    if (!req.user || !req.user.id) {
        throw new ApiError(401, 'User must be authenticated');
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Generate unique email if not provided
            const storeEmail = store.email || `store-${Date.now()}-${req.user.id}@hoperx.temp`;
            
            // Create Store with all required fields
            const createdStore = await tx.store.create({
                data: {
                    name: store.name,
                    displayName: store.displayName || store.name,
                    email: storeEmail,
                    phoneNumber: store.phoneNumber || '+919999999999',
                    businessType: store.businessType || 'Retail Pharmacy',
                    logoUrl: store.storeLogo || null,
                    addressLine1: store.addressLine1 || store.address || 'Not provided',
                    addressLine2: store.addressLine2 || null,
                    city: store.city || 'Not provided',
                    state: store.state || 'Not provided',
                    pinCode: store.pinCode || '000000',
                    landmark: store.landmark || null,
                    is24x7: store.is24x7 || false,
                    homeDelivery: store.homeDelivery || false,
                },
            });

            // Associate user with store
            await tx.storeUser.create({
                data: {
                    userId: req.user.id,
                    storeId: createdStore.id,
                    isPrimary: true,
                },
            });

            // Create Licenses if any
            if (licenses.length > 0) {
                const licenseCreates = licenses.map((lic) =>
                    tx.storeLicense.create({
                        data: {
                            storeId: createdStore.id,
                            type: lic.type,
                            number: lic.licenseNumber || lic.number,
                            validFrom: new Date(lic.issuedDate || lic.validFrom || Date.now()),
                            validTo: new Date(lic.expiryDate || lic.validTo || Date.now()),
                            documentUrl: lic.documentUrl || null,
                            status: 'Active',
                        },
                    })
                );
                await Promise.all(licenseCreates);
            }

            // Create Operating Hours if any
            if (operatingHours.length > 0) {
                const hoursCreates = operatingHours.map((h) => {
                    // Convert day name to number if it's a string
                    const dayOfWeek = typeof h.dayOfWeek === 'string' 
                        ? DAY_MAP[h.dayOfWeek] 
                        : h.dayOfWeek;
                    
                    return tx.storeOperatingHours.create({
                        data: {
                            storeId: createdStore.id,
                            dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : 1,
                            openTime: h.openTime || '09:00',
                            closeTime: h.closeTime || '21:00',
                            isClosed: h.isClosed || false,
                            lunchStart: h.lunchStart || null,
                            lunchEnd: h.lunchEnd || null,
                        },
                    });
                });
                await Promise.all(hoursCreates);
            }

            // Create Suppliers if any
            if (suppliers.length > 0) {
                const supplierCreates = suppliers.map((sup) =>
                    tx.supplier.create({
                        data: {
                            name: sup.name,
                            category: sup.category || 'Distributor',
                            status: 'Active',
                            contactName: sup.contactName || sup.name,
                            phoneNumber: sup.phone || sup.phoneNumber,
                            email: sup.email || null,
                            whatsapp: sup.whatsapp || null,
                            gstin: sup.gstin || null,
                            dlNumber: sup.dlNumber || null,
                            pan: sup.pan || null,
                            addressLine1: sup.addressLine1 || sup.deliveryArea || 'Not provided',
                            addressLine2: sup.addressLine2 || null,
                            city: sup.city || 'Not provided',
                            state: sup.state || 'Not provided',
                            pinCode: sup.pinCode || '000000',
                            paymentTerms: sup.creditTerms || sup.paymentTerms || null,
                            creditLimit: sup.creditLimit || null,
                        },
                    })
                );
                await Promise.all(supplierCreates);
            }

            // Create Users/Staff if any
            if (users.length > 0) {
                const userCreates = users.map((user) =>
                    tx.user.create({
                        data: {
                            name: user.name,
                            phoneNumber: user.phone,
                            role: user.role.toUpperCase(),
                            pin: user.pin,
                            isActive: true,
                        },
                    }).then(async (createdUser) => {
                        // Associate user with store
                        await tx.storeUser.create({
                            data: {
                                userId: createdUser.id,
                                storeId: createdStore.id,
                                isPrimary: false,
                            },
                        });
                        return createdUser;
                    })
                );
                await Promise.all(userCreates);
            }

            // Mark onboarding as complete
            await tx.onboardingProgress.upsert({
                where: { userId: req.user.id },
                update: {
                    isComplete: true,
                    currentStep: 10,
                    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                },
                create: {
                    userId: req.user.id,
                    isComplete: true,
                    currentStep: 10,
                    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                    data: {},
                },
            });

            return createdStore;
        });

        return res.status(201).json(new ApiResponse(201, result, 'Onboarding completed successfully'));
    } catch (err) {
        console.error('Onboarding error:', err);
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(500, `Failed to complete onboarding: ${err.message}`);
    }
});

module.exports = {
    getProgress,
    saveProgress,
    completeOnboarding,
};
