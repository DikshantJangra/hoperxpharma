const prisma = require('../config/database').getClient();
const logger = require('../config/logger');

/**
 * Assign all users without stores to the first available store
 * This is a one-time fix for existing users created before store assignment was implemented
 */
async function assignUsersToStores() {
    try {
        logger.info('Starting user-store assignment migration...');

        // Get all users
        const users = await prisma.user.findMany({
            include: {
                storeUsers: true,
            },
        });

        // Get first store (admin's store)
        const firstStore = await prisma.store.findFirst();

        if (!firstStore) {
            logger.error('No store found in database. Cannot assign users.');
            return { success: false, message: 'No store found' };
        }

        let assignedCount = 0;

        for (const user of users) {
            // Skip users who already have stores
            if (user.storeUsers && user.storeUsers.length > 0) {
                continue;
            }

            // Assign user to first store
            await prisma.storeUser.create({
                data: {
                    userId: user.id,
                    storeId: firstStore.id,
                    isPrimary: true,
                },
            });

            assignedCount++;
            logger.info(`Assigned user ${user.email} to store ${firstStore.name}`);
        }

        logger.info(`Migration complete. Assigned ${assignedCount} users to stores.`);
        return {
            success: true,
            message: `Successfully assigned ${assignedCount} users to ${firstStore.name}`,
            assignedCount,
        };
    } catch (error) {
        logger.error('Migration failed:', error);
        return { success: false, message: error.message };
    }
}

module.exports = { assignUsersToStores };
