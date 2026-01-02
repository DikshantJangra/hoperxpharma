const cron = require('node-cron');
const prisma = require('../config/database').getClient();
const alertService = require('./alertService');
const logger = require('../config/logger');

class SchedulerService {
    init() {
        logger.info('Initializing Scheduler Service...');

        // Run daily at midnight: 0 0 * * *
        cron.schedule('0 0 * * *', async () => {
            logger.info('Running Daily Jobs: License Expiry Check');
            await this.checkLicenseExpiry();
        });

        // Run immediately on startup for testing/dev (optional, maybe controlled by ENV)
        if (process.env.NODE_ENV === 'development') {
            // this.checkLicenseExpiry(); // Uncomment if immediate check needed
        }
    }

    /**
     * Check for licenses expiring within 30 days
     */
    async checkLicenseExpiry() {
        try {
            const warningDays = 30;
            const warningDate = new Date();
            warningDate.setDate(warningDate.getDate() + warningDays);

            // Find licenses expiring soon that are actively valid
            // We verify against 'Expiring Soon' or check for existing alerts to avoid spam
            const licenses = await prisma.storeLicense.findMany({
                where: {
                    validTo: {
                        lte: warningDate,
                        gte: new Date(), // Not already expired
                    },
                    status: 'Active' // Only warn if currently considered Active
                },
                include: {
                    store: true
                }
            });

            logger.info(`Found ${licenses.length} licenses expiring within ${warningDays} days.`);

            for (const license of licenses) {
                // Check if an open alert specifically for this license already exists
                // We use 'compliance' type and check description or relatedId if available
                // To be precise, let's query for existing alerts
                const existingAlert = await prisma.alert.findFirst({
                    where: {
                        storeId: license.storeId,
                        type: 'compliance',
                        status: { in: ['NEW', 'SNOOZED'] },
                        description: { contains: license.number }
                    }
                });

                if (!existingAlert) {
                    // Create Alert
                    await alertService.createAlert(license.storeId, {
                        type: 'compliance',
                        severity: 'HIGH',
                        title: `${license.type} Expiring Soon`,
                        description: `Your ${license.type} (${license.number}) is expiring on ${license.validTo.toDateString()}. Please renew it within 30 days or less.`,
                        source: 'System Scheduler',
                        priority: 'High'
                    });

                    // Update License Status
                    await prisma.storeLicense.update({
                        where: { id: license.id },
                        data: { status: 'Expiring Soon' }
                    });

                    logger.info(`Created expiry alert for License ${license.number} in Store ${license.store.name}`);
                }
            }

        } catch (error) {
            logger.error('Error running checkLicenseExpiry job:', error);
        }
    }
}

module.exports = new SchedulerService();
