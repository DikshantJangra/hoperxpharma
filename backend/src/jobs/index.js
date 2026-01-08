/**
 * Job Scheduler
 * Initializes and manages all background jobs
 * Import and call initializeJobs() from server.js
 */

const { scheduleReconciliationJob } = require('./paymentReconciliation.job');
const { scheduleExpirationJob } = require('./paymentExpiration.job');

/**
 * Initialize all background jobs
 */
const initializeJobs = () => {
    console.log('[JobScheduler] Initializing background jobs...');

    try {
        // Schedule payment reconciliation (every 15 minutes)
        scheduleReconciliationJob();

        // Schedule payment expiration (every 10 minutes)
        scheduleExpirationJob();

        console.log('[JobScheduler] ✅ All background jobs initialized successfully');
    } catch (error) {
        console.error('[JobScheduler] ❌ Failed to initialize jobs:', error);
        // Don't crash the server if jobs fail to initialize
    }
};

module.exports = {
    initializeJobs
};
