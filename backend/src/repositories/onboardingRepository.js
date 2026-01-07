const prisma = require('../db/prisma');

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
 * Onboarding Repository - Data access layer for onboarding operations
 */
class OnboardingRepository {
    /**
     * Get onboarding progress for user
     */
    async getProgress(userId) {
        // 1. Check persistent progress first (Setup Wizard & Saved Steps)
        const progress = await prisma.onboardingProgress.findUnique({
            where: { userId }
        });

        if (progress) {
            return {
                completed: progress.isComplete,
                steps: {}, // Can optionally populate derived steps if needed
                currentStep: progress.currentStep,
                completedSteps: progress.completedSteps || [],
                data: progress.data || {},
                mode: progress.mode, // Return value: NULL, "REAL", "DEMO"
                storeId: null // Store might not exist yet if in wizard
            };
        }

        // 2. Fallback: Check existing store (Legacy/Safety)
        const stores = await prisma.store.findMany({
            where: {
                users: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                licenses: true,
                operatingHours: true,
                subscription: true,
            },
        });

        if (stores.length === 0) {
            return {
                completed: false,
                steps: {
                    storeCreated: false,
                    licensesAdded: false,
                    hoursConfigured: false,
                    subscriptionActive: false,
                },
                currentStep: 1, // Default to 1 (numeric) for frontend consistency
                mode: null
            };
        }

        const store = stores[0]; // Primary store
        const steps = {
            storeCreated: true,
            licensesAdded: store.licenses.length > 0,
            hoursConfigured: store.operatingHours.length > 0,
            subscriptionActive: !!store.subscription,
        };

        const completed = Object.values(steps).every((step) => step === true);

        let currentStep = 10; // Default to completed/last step if store exists
        if (!steps.licensesAdded) currentStep = 2; // Assuming Store is Step 1
        else if (!steps.hoursConfigured) currentStep = 3;
        else if (!steps.subscriptionActive) currentStep = 4;

        // This fallback mapping is rough, ideally we rely on OnboardingProgress table

        return {
            completed,
            steps,
            currentStep,
            storeId: store.id,
            mode: 'REAL' // If they have a store, they are in REAL mode
        };
    }

    /**
     * Mark onboarding as complete
     */
    async markComplete(userId) {
        // Could store this in a UserPreferences or UserSettings table
        // For now, we'll just verify all steps are complete
        const progress = await this.getProgress(userId);
        return progress.completed;
    }

    /**
     * Create complete store setup (atomic)
     */
    async createCompleteStore(storeData, licenses, hours, suppliers, users, userId) {
        return await prisma.$transaction(async (tx) => {
            // Ensure required fields are present with defaults
            const storeDataWithDefaults = {
                ...storeData,
                addressLine1: storeData.addressLine1 || 'Not specified',
                city: storeData.city || 'Not specified',
                state: storeData.state || 'Not specified',
                pinCode: storeData.pinCode || '000000'
            };
            
            // Create store
            const store = await tx.store.create({
                data: storeDataWithDefaults,
            });

            // Associate user
            await tx.storeUser.create({
                data: {
                    storeId: store.id,
                    userId,
                    isPrimary: true, // This is the owner/primary user
                },
            });

            // Add licenses if provided
            if (licenses && licenses.length > 0) {
                await Promise.all(
                    licenses.map((license) =>
                        tx.storeLicense.create({
                            data: {
                                storeId: store.id,
                                type: license.type,
                                number: license.licenseNumber || license.number,
                                validFrom: new Date(license.issuedDate || license.validFrom),
                                validTo: new Date(license.expiryDate || license.validTo),
                                documentUrl: license.documentUrl || null,
                                status: 'Active',
                            },
                        })
                    )
                );
            }

            // Add operating hours if provided
            if (hours && hours.length > 0) {
                await Promise.all(
                    hours.map((hour) => {
                        const dayOfWeek = typeof hour.dayOfWeek === 'string'
                            ? DAY_MAP[hour.dayOfWeek]
                            : hour.dayOfWeek;

                        return tx.storeOperatingHours.create({
                            data: {
                                ...hour,
                                dayOfWeek,
                                storeId: store.id,
                            },
                        });
                    })
                );
            }

            // Create suppliers
            if (suppliers && suppliers.length > 0) {
                await Promise.all(
                    suppliers.map((supplier) =>
                        tx.supplier.create({
                            data: {
                                storeId: store.id,
                                name: supplier.name,
                                category: supplier.category || 'Distributor',
                                status: 'Active',
                                contactName: supplier.name,
                                phoneNumber: supplier.phone,
                                email: supplier.email || null,
                                whatsapp: supplier.phone,
                                gstin: supplier.gstin || null,
                                dlNumber: supplier.dlNumber || null,
                                pan: supplier.pan || null,
                                addressLine1: supplier.deliveryArea || 'Not specified',
                                city: 'Not specified',
                                state: 'Not specified',
                                pinCode: '000000',
                                paymentTerms: supplier.creditTerms || 'COD',
                            },
                        })
                    )
                );
            }

            // Create user accounts for team members
            if (users && users.length > 0) {
                const bcrypt = require('bcrypt');
                const defaultPassword = await bcrypt.hash('Change@123', 10);

                await Promise.all(
                    users.map(async (user) => {
                        // Map role to schema enum
                        const roleMap = {
                            'PHARMACIST': 'PHARMACIST',
                            'MANAGER': 'PHARMACIST',
                            'CASHIER': 'CASHIER',
                            'ASSISTANT': 'TECHNICIAN',
                            'TECHNICIAN': 'TECHNICIAN',
                        };
                        const mappedRole = roleMap[user.role.toUpperCase()] || 'PHARMACIST';

                        // Create user account
                        const newUser = await tx.user.create({
                            data: {
                                email: `${user.phone} @temp.hoperx.com`,
                                phoneNumber: user.phone,
                                passwordHash: defaultPassword,
                                firstName: user.name.split(' ')[0] || user.name,
                                lastName: user.name.split(' ').slice(1).join(' ') || '',
                                role: mappedRole,
                                approvalPin: user.pin,
                                isActive: true,
                            },
                        });

                        // Associate user with store
                        await tx.storeUser.create({
                            data: {
                                storeId: store.id,
                                userId: newUser.id,
                                isPrimary: false,
                            },
                        });
                    })
                );
            }

            return store;
        });
    }

    /**
     * Create store settings from onboarding data
     */
    async createStoreSettings(storeId, posData, inventoryData) {
        const settingsData = {
            storeId,
            // Inventory settings
            lowStockThreshold: inventoryData?.lowStockThreshold || 10,
            nearExpiryThreshold: inventoryData?.nearExpiryThreshold || 90,
            defaultUoM: inventoryData?.defaultUoM || 'Units',
            defaultGSTSlab: inventoryData?.defaultGSTSlab || '5',
            batchTracking: inventoryData?.batchTracking !== false,
            autoGenerateCodes: inventoryData?.autoGenerateCodes !== false,
            purchaseRounding: inventoryData?.purchaseRounding || false,
            allowNegativeStock: inventoryData?.allowNegativeStock || false,
            // POS settings
            invoiceFormat: posData?.invoiceFormat || 'INV-{YY}{MM}-{SEQ:4}',
            paymentMethods: Array.isArray(posData?.paymentMethods)
                ? posData.paymentMethods.join(',')
                : 'Cash',
            upiId: posData?.upiId || null,
            billingType: posData?.billingType || 'MRP-based',
            printFormat: posData?.printFormat || 'Thermal (80mm)',
            footerText: posData?.footerText || 'Thank you for your business!',
            autoRounding: posData?.autoRounding !== false,
            defaultCustomerType: posData?.defaultCustomerType || 'Walk-in',
            enableGSTBilling: posData?.enableGSTBilling !== false,
        };

        return await prisma.storeSettings.create({
            data: settingsData,
        });
    }
}

module.exports = new OnboardingRepository();
