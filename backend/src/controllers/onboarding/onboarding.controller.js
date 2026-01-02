// backend/src/controllers/onboarding/onboarding.controller.js

const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
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
    // Authenticated route matching
    if (!req.user || !req.user.id) {
        throw new ApiError(401, 'User authentication required for progress');
    }

    const progress = await prisma.onboardingProgress.findUnique({
        where: { userId: req.user.id }
    });

    if (progress && progress.data) {
        console.log(`[DEBUG_LOAD] User: ${req.user.id}`);
        const d = progress.data;
        if (d.inventory) console.log('[DEBUG_LOAD] Inventory:', JSON.stringify(d.inventory));
        if (d.pos) console.log('[DEBUG_LOAD] POS:', JSON.stringify(d.pos));
    }

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

    // Debug Request
    console.log('[DEBUG_SAVE_REQ] Content-Type:', req.headers['content-type']);
    console.log('[DEBUG_SAVE_REQ] Body Keys:', Object.keys(req.body));
    if (req.body.data) {
        console.log('[DEBUG_SAVE_REQ] Data Type:', typeof req.body.data);
    } else {
        console.log('[DEBUG_SAVE_REQ] req.body.data is MISSING or NULL');
    }

    const { currentStep, completedSteps, data, isComplete } = req.body;

    // Debug Log
    if (data) {
        console.log(`[DEBUG_SAVE] User: ${req.user.id} | Step: ${currentStep}`);
        if (data.storeIdentity) console.log('[DEBUG_SAVE] Identity:', JSON.stringify(data.storeIdentity));
        if (data.inventory) console.log('[DEBUG_SAVE] Inventory:', JSON.stringify(data.inventory));
        if (data.pos) console.log('[DEBUG_SAVE] POS:', JSON.stringify(data.pos));
    }

    // Validate data is not empty if step > 1
    if (currentStep > 1 && (!data || Object.keys(data).length === 0)) {
        logger.warn(`User ${req.user.id}: Saving EMPTY data for step > 1`);
    }

    // Fetch existing progress first
    const existing = await prisma.onboardingProgress.findUnique({
        where: { userId: req.user.id }
    });

    // Deep merge data
    const existingData = (existing && existing.data) ? existing.data : {};
    const newData = data || {};

    const mergedData = {
        ...existingData,
        ...newData,
    };

    // Explicitly merge sub-sections to be safe
    if (existingData.storeIdentity && newData.storeIdentity) {
        mergedData.storeIdentity = { ...existingData.storeIdentity, ...newData.storeIdentity };
    }
    if (existingData.inventory && newData.inventory) {
        mergedData.inventory = { ...existingData.inventory, ...newData.inventory };
    }
    if (existingData.pos && newData.pos) {
        mergedData.pos = { ...existingData.pos, ...newData.pos };
    }
    if (existingData.timings && newData.timings) {
        mergedData.timings = { ...existingData.timings, ...newData.timings };
    }
    if (existingData.licensing && newData.licensing) {
        mergedData.licensing = { ...existingData.licensing, ...newData.licensing };
    }
    if (existingData.integrations && newData.integrations) {
        mergedData.integrations = { ...existingData.integrations, ...newData.integrations };
    }

    const progress = await prisma.onboardingProgress.upsert({
        where: { userId: req.user.id },
        update: {
            currentStep: currentStep || existing?.currentStep || 1,
            completedSteps: completedSteps || existing?.completedSteps || [],
            data: mergedData,
            isComplete: isComplete !== undefined ? isComplete : (existing?.isComplete || false)
        },
        create: {
            userId: req.user.id,
            currentStep: currentStep || 1,
            completedSteps: completedSteps || [],
            data: mergedData,
            isComplete: isComplete || false
        }
    });

    if (mergedData.storeIdentity) console.log('[DEBUG_DB_SAVE] Merged Store Identity:', JSON.stringify(mergedData.storeIdentity));
    if (mergedData.inventory) console.log('[DEBUG_DB_SAVE] Merged Inventory:', JSON.stringify(mergedData.inventory));

    logger.info(`Saved progress for user ${req.user.id}`);

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

            // Create Store with all required and optional fields
            const createdStore = await tx.store.create({
                data: {
                    name: store.name,
                    displayName: store.displayName || store.name,
                    email: storeEmail,
                    phoneNumber: store.phoneNumber || '+919999999999',
                    whatsapp: store.whatsapp || null, // WhatsApp number
                    businessType: store.businessType || 'Retail Pharmacy',
                    logoUrl: store.storeLogo || null,
                    gstin: store.gstin || null, // GST number
                    dlNumber: store.dlNumber || null, // Drug License number
                    pan: store.pan || null, // PAN Card number
                    addressLine1: store.addressLine1 || store.address || 'Not provided',
                    addressLine2: store.addressLine2 || null,
                    city: store.city || 'Not provided',
                    state: store.state || 'Not provided',
                    pinCode: store.pinCode || '000000',
                    landmark: store.landmark || null,
                    is24x7: store.is24x7 || false,
                    homeDelivery: store.homeDelivery || false,
                    latitude: store.latitude || null,
                    longitude: store.longitude || null,
                    geofenceRadius: store.geofenceRadius || 50,
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

            // Create Store Settings with inventory and POS configuration
            const inventory = req.body.inventory || {};
            const pos = req.body.pos || {};
            await tx.storeSettings.create({
                data: {
                    storeId: createdStore.id,
                    // Inventory settings
                    lowStockThreshold: inventory.lowStockThreshold || 10,
                    nearExpiryThreshold: inventory.nearExpiryThreshold || 90,
                    defaultUoM: inventory.defaultUoM || 'Units',
                    defaultGSTSlab: inventory.defaultGSTSlab || '5',
                    batchTracking: inventory.batchTracking !== undefined ? inventory.batchTracking : true,
                    autoGenerateCodes: inventory.autoGenerateCodes !== undefined ? inventory.autoGenerateCodes : true,
                    purchaseRounding: inventory.purchaseRounding || false,
                    allowNegativeStock: inventory.allowNegativeStock || false,
                    // POS settings
                    invoiceFormat: pos.invoiceFormat || 'INV-{YY}{MM}-{SEQ:4}',
                    paymentMethods: Array.isArray(pos.paymentMethods) ? pos.paymentMethods.join(',') : 'Cash',
                    upiId: pos.upiId || null,
                    billingType: pos.billingType || 'MRP-based',
                    printFormat: pos.printFormat || 'Thermal',
                    footerText: pos.footerText || 'Thank you for your business!',
                    autoRounding: pos.autoRounding !== undefined ? pos.autoRounding : true,
                    defaultCustomerType: pos.defaultCustomerType || 'Walk-in',
                    enableGSTBilling: pos.enableGSTBilling !== undefined ? pos.enableGSTBilling : true,
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
                            storeId: createdStore.id, // CRITICAL: Link supplier to store
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
                const bcrypt = require('bcrypt');
                const userCreates = users.map(async (user) => {
                    // Hash password if provided
                    const passwordHash = user.password ? await bcrypt.hash(user.password, 10) : null;

                    const createdUser = await tx.user.create({
                        data: {
                            email: user.email || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@temp.local`,
                            name: user.name,
                            phoneNumber: user.phone,
                            passwordHash: passwordHash,
                            role: user.role.toUpperCase(),
                            pin: user.pin,
                            isActive: true,
                        },
                    });

                    // Associate user with store
                    await tx.storeUser.create({
                        data: {
                            userId: createdUser.id,
                            storeId: createdStore.id,
                            isPrimary: false,
                        },
                    });

                    return createdUser;
                });
                await Promise.all(userCreates);
            }

            // Update User Role to ADMIN (Store Owner)
            await tx.user.update({
                where: { id: req.user.id },
                data: { role: 'ADMIN' }
            });

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
        logger.error('Onboarding error:', err);
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
