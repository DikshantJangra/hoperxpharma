const queueService = require('../services/queueService');
const gstReportService = require('../services/gstReportService');
const reportsRepository = require('../repositories/reportsRepository');
const logger = require('../config/logger');

/**
 * Report Queue Processor
 * Processes report generation jobs
 */
if (queueService.isAvailable && queueService.queues.reports) {
    const reportQueue = queueService.queues.reports;

    // Process report generation jobs
    reportQueue.process('generate-report', async (job) => {
        const { reportType, storeId, params } = job.data;

        logger.info('Processing report job', {
            jobId: job.id,
            reportType,
            storeId,
        });

        try {
            let reportData;

            switch (reportType) {
                case 'gstr1':
                    reportData = await gstReportService.getGSTR1Summary(storeId, params.month);
                    break;

                case 'gstr3b':
                    reportData = await gstReportService.getGSTR3BSummary(storeId, params.month);
                    break;

                case 'sales':
                    reportData = await reportsRepository.getSalesReportData(
                        storeId,
                        params.startDate,
                        params.endDate
                    );
                    break;

                case 'inventory':
                    reportData = await reportsRepository.getInventoryReportData(storeId);
                    break;

                case 'profit':
                    reportData = await reportsRepository.getProfitReportData(
                        storeId,
                        params.startDate,
                        params.endDate
                    );
                    break;

                default:
                    throw new Error(`Unknown report type: ${reportType}`);
            }

            logger.info('Report generated successfully', {
                jobId: job.id,
                reportType,
                storeId,
            });

            // Update progress
            job.progress(100);

            return {
                success: true,
                reportType,
                data: reportData,
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error('Report job failed', {
                jobId: job.id,
                reportType,
                error: error.message,
            });
            throw error;
        }
    });

    logger.info('Report queue processor initialized');
} else {
    logger.warn('Report queue processor not initialized - Bull/Redis not available');
}

module.exports = reportQueue;
