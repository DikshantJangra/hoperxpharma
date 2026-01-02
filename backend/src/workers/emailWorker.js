const queueService = require('../services/queueService');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Email Queue Processor
 * Processes email jobs from the queue
 */
if (queueService.isAvailable && queueService.queues.email) {
    const emailQueue = queueService.queues.email;

    // Process email jobs
    emailQueue.process('send-email', async (job) => {
        const { to, subject, html, text, attachments, type } = job.data;

        logger.info('Processing email job', {
            jobId: job.id,
            to,
            type,
        });

        try {
            // Send email using email service
            const result = await emailService.sendEmail({
                to,
                subject,
                html,
                text,
                attachments,
            });

            logger.info('Email sent successfully', {
                jobId: job.id,
                to,
                messageId: result.messageId,
            });

            return {
                success: true,
                messageId: result.messageId,
                to,
            };
        } catch (error) {
            logger.error('Email job failed', {
                jobId: job.id,
                to,
                error: error.message,
            });
            throw error; // Will trigger retry
        }
    });

    logger.info('Email queue processor initialized');
} else {
    logger.warn('Email queue processor not initialized - Bull/Redis not available');
}

module.exports = emailQueue;
