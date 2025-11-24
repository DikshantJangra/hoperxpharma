const database = require('../config/database');

const prisma = database.getClient();

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
                currentStep: 'store_creation',
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

        let currentStep = 'completed';
        if (!steps.licensesAdded) currentStep = 'licenses';
        else if (!steps.hoursConfigured) currentStep = 'operating_hours';
        else if (!steps.subscriptionActive) currentStep = 'subscription';

        return {
            completed,
            steps,
            currentStep,
            storeId: store.id,
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
            // Create store
            const store = await tx.store.create({
                data: storeData,
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

            // Note: Suppliers are not store-specific in the schema
            // They should be created separately via the supplier management API

            // Add additional users if provided (excluding current user)
            if (users && users.length > 0) {
                const additionalUsers = users.filter(user => (user.userId || userId) !== userId);
                if (additionalUsers.length > 0) {
                    await Promise.all(
                        additionalUsers.map((user) =>
                            tx.storeUser.create({
                                data: {
                                    storeId: store.id,
                                    userId: user.userId,
                                    isPrimary: false,
                                },
                            })
                        )
                    );
                }
            }

            return store;
        });
    }
}

module.exports = new OnboardingRepository();
