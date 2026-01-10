const prisma = require('../db/prisma');

/**
 * Barcode Repository - Data access layer for barcode and scan operations
 */
class BarcodeRepository {
    /**
     * Create barcode registry entry
     */
    async create(data) {
        return await prisma.barcodeRegistry.create({
            data,
            include: {
                batch: {
                    include: {
                        drug: true,
                        store: true
                    }
                }
            }
        });
    }

    /**
     * Find barcode by value
     */
    async findByBarcode(barcode) {
        return await prisma.barcodeRegistry.findUnique({
            where: { barcode },
            include: {
                batch: {
                    include: {
                        drug: true,
                        store: true
                    }
                }
            }
        });
    }

    /**
     * Find all barcodes for a batch
     */
    async findByBatch(batchId) {
        return await prisma.barcodeRegistry.findMany({
            where: { batchId },
            orderBy: { createdAt: 'asc' }
        });
    }

    /**
     * Check if barcode exists
     */
    async exists(barcode) {
        const count = await prisma.barcodeRegistry.count({
            where: { barcode }
        });
        return count > 0;
    }

    /**
     * Log scan event
     */
    async logScan(scanData) {
        return await prisma.scanAudit.create({
            data: scanData
        });
    }

    /**
     * Get scan history with filters
     */
    async getScanHistory(filters) {
        const { employeeId, storeId, startDate, endDate, scanType, limit = 100 } = filters;

        const where = {
            ...(employeeId && { employeeId }),
            ...(storeId && { storeId }),
            ...(scanType && { scanType }),
            ...(startDate && endDate && {
                scannedAt: {
                    gte: startDate,
                    lte: endDate
                }
            })
        };

        return await prisma.scanAudit.findMany({
            where,
            include: {
                barcode: {
                    include: {
                        batch: {
                            include: { drug: true }
                        }
                    }
                }
            },
            orderBy: { scannedAt: 'desc' },
            take: limit
        });
    }

    /**
     * Get scan count for employee in date range
     */
    async getEmployeeScanCount(employeeId, startDate, endDate, scanType = null) {
        const where = {
            employeeId,
            scannedAt: {
                gte: startDate,
                lte: endDate
            },
            ...(scanType && { scanType })
        };

        return await prisma.scanAudit.count({ where });
    }

    /**
     * Update barcode registry
     */
    async update(barcode, data) {
        return await prisma.barcodeRegistry.update({
            where: { barcode },
            data
        });
    }

    /**
     * Delete barcode registry
     */
    async delete(barcode) {
        return await prisma.barcodeRegistry.delete({
            where: { barcode }
        });
    }
}

module.exports = new BarcodeRepository();
