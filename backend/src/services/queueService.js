const logger = require('../config/logger');

// Bull queue instance (lazy-loaded)
let Queue = null;
let redisConfig = null;

// Initialize Bull if Redis is available
const initBull = () => {
    const isRedisEnabled = process.env.REDIS_ENABLED === 'true';
    const redisUrl = process.env.REDIS_URL;

    if (!isRedisEnabled || !redisUrl) {
        logger.info('Bull queue disabled - Redis not configured');
        return null;
    }

    try {
        Queue = require('bull');

        // Parse Redis URL
        const url = new URL(redisUrl);
        redisConfig = {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
        };

        logger.info('Bull queue initialized with Redis');
        return Queue;
    } catch (error) {
        logger.warn('Bull package not installed. Background jobs disabled.');
        logger.info('Install with: npm install bull');
        return null;
    }
};

/**
 * Queue Service
 * Manages background job processing using Bull
 */
class QueueService {
    constructor() {
        this.Queue = initBull();
        this.queues = {};
        this.isAvailable = this.Queue !== null;

        if (this.isAvailable) {
            this.initializeQueues();
        }
    }

    /**
     * Initialize all application queues
     */
    initializeQueues() {
        // Email queue
        this.queues.email = new this.Queue('email', {
            redis: redisConfig,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        });

        // Report generation queue
        this.queues.reports = new this.Queue('reports', {
            redis: redisConfig,
            defaultJobOptions: {
                attempts: 2,
                timeout: 60000, // 1 minute
                removeOnComplete: true,
            },
        });

        // Notification queue
        this.queues.notifications = new this.Queue('notifications', {
            redis: redisConfig,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'fixed',
                    delay: 5000,
                },
                removeOnComplete: true,
            },
        });

        this.setupEventHandlers();
        logger.info('All job queues initialized');
    }

    /**
     * Setup event handlers for all queues
     */
    setupEventHandlers() {
        Object.entries(this.queues).forEach(([name, queue]) => {
            queue.on('completed', (job) => {
                logger.info(`Job completed in ${name} queue`, {
                    jobId: job.id,
                    name: job.name,
                });
            });

            queue.on('failed', (job, err) => {
                logger.error(`Job failed in ${name} queue`, {
                    jobId: job.id,
                    name: job.name,
                    error: err.message,
                });
            });

            queue.on('stalled', (job) => {
                logger.warn(`Job stalled in ${name} queue`, {
                    jobId: job.id,
                });
            });
        });
    }

    /**
     * Add email job to queue
     */
    async addEmailJob(data, options = {}) {
        if (!this.isAvailable) {
            logger.warn('Email job queued but Bull not available - will be sent synchronously');
            return null;
        }

        try {
            const job = await this.queues.email.add('send-email', data, {
                priority: data.priority || 5,
                ...options,
            });
            logger.info('Email job added to queue', { jobId: job.id });
            return job;
        } catch (error) {
            logger.error('Failed to add email job:', error);
            throw error;
        }
    }

    /**
     * Add report generation job to queue
     */
    async addReportJob(data, options = {}) {
        if (!this.isAvailable) {
            logger.warn('Report job queued but Bull not available');
            return null;
        }

        try {
            const job = await this.queues.reports.add('generate-report', data, {
                priority: data.priority || 3,
                ...options,
            });
            logger.info('Report job added to queue', { jobId: job.id });
            return job;
        } catch (error) {
            logger.error('Failed to add report job:', error);
            throw error;
        }
    }

    /**
     * Add notification job to queue
     */
    async addNotificationJob(data, options = {}) {
        if (!this.isAvailable) {
            logger.warn('Notification job queued but Bull not available');
            return null;
        }

        try {
            const job = await this.queues.notifications.add('send-notification', data, {
                priority: data.priority || 5,
                ...options,
            });
            logger.info('Notification job added to queue', { jobId: job.id });
            return job;
        } catch (error) {
            logger.error('Failed to add notification job:', error);
            throw error;
        }
    }

    /**
     * Get job status
     */
    async getJobStatus(queueName, jobId) {
        if (!this.isAvailable || !this.queues[queueName]) {
            return null;
        }

        try {
            const job = await this.queues[queueName].getJob(jobId);
            if (!job) return null;

            const state = await job.getState();
            return {
                id: job.id,
                name: job.name,
                state,
                progress: job.progress(),
                data: job.data,
                returnvalue: job.returnvalue,
                failedReason: job.failedReason,
            };
        } catch (error) {
            logger.error('Failed to get job status:', error);
            return null;
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats(queueName) {
        if (!this.isAvailable || !this.queues[queueName]) {
            return null;
        }

        try {
            const queue = this.queues[queueName];
            const [waiting, active, completed, failed, delayed] = await Promise.all([
                queue.getWaitingCount(),
                queue.getActiveCount(),
                queue.getCompletedCount(),
                queue.getFailedCount(),
                queue.getDelayedCount(),
            ]);

            return {
                queueName,
                waiting,
                active,
                completed,
                failed,
                delayed,
                total: waiting + active + completed + failed + delayed,
            };
        } catch (error) {
            logger.error('Failed to get queue stats:', error);
            return null;
        }
    }

    /**
     * Get all queues statistics
     */
    async getAllStats() {
        if (!this.isAvailable) {
            return { available: false, queues: [] };
        }

        const stats = await Promise.all(
            Object.keys(this.queues).map(name => this.getQueueStats(name))
        );

        return {
            available: true,
            queues: stats.filter(s => s !== null),
        };
    }

    /**
     * Clean completed jobs older than specified time
     */
    async cleanQueues(olderThan = 24 * 60 * 60 * 1000) {
        if (!this.isAvailable) return;

        try {
            for (const [name, queue] of Object.entries(this.queues)) {
                await queue.clean(olderThan, 'completed');
                await queue.clean(olderThan, 'failed');
                logger.info(`Cleaned ${name} queue`);
            }
        } catch (error) {
            logger.error('Failed to clean queues:', error);
        }
    }

    /**
     * Close all queues (for graceful shutdown)
     */
    async closeAll() {
        if (!this.isAvailable) return;

        try {
            await Promise.all(
                Object.values(this.queues).map(queue => queue.close())
            );
            logger.info('All queues closed');
        } catch (error) {
            logger.error('Error closing queues:', error);
        }
    }
}

module.exports = new QueueService();
