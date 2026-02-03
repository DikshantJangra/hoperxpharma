const barcodeRepository = require('../../repositories/barcodeRepository');
const inventoryRepository = require('../../repositories/inventoryRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const dayjs = require('dayjs');

/**
 * Scan Service - Business logic for barcode scanning and QR code generation
 * Implements scan-driven workflow for Indian Pharmacy System
 */
class ScanService {
    /**
     * Enroll barcode during GRN receipt or inventory addition
     */
    async enrollBarcode({ barcode, batchId, barcodeType = 'MANUFACTURER', unitType = 'STRIP' }) {
        // Validate batch exists
        const batch = await inventoryRepository.findBatchById(batchId);
        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        // Check if barcode already exists
        const existing = await barcodeRepository.findByBarcode(barcode);

        if (existing) {
            // Same barcode, same batch - return existing
            if (existing.batchId === batchId) {
                logger.info(`Barcode ${barcode} already enrolled for batch ${batchId}`);
                return existing;
            }

            // Same barcode, different batch - check if same drug
            if (existing.batch.drugId !== batch.drugId) {
                throw ApiError.conflict(
                    `Barcode already registered to different drug: ${existing.batch.drug.name}`
                );
            }

            // Same drug, different batch - log warning but allow (normal for manufacturer barcodes)
            logger.warn(`Barcode ${barcode} reused across batches: ${existing.batchId} -> ${batchId}`);
        }

        // Create new barcode registry entry
        const barcodeRegistry = await barcodeRepository.create({
            barcode,
            batchId,
            barcodeType,
            unitType,
            manufacturerCode: barcodeType === 'MANUFACTURER' ? barcode : null
        });

        // Sync with InventoryBatch for manufacturer barcodes
        if (barcodeType === 'MANUFACTURER') {
            await inventoryRepository.updateBatch(batchId, {
                manufacturerBarcode: barcode
            });
        }

        logger.info(`✅ Barcode enrolled: ${barcode} for batch ${batch.batchNumber} (${batch.drug.name})`);
        return barcodeRegistry;
    }

    /**
     * Generate internal QR code for batches without manufacturer barcode
     */
    async generateInternalQR(batchId) {
        const batch = await inventoryRepository.findBatchById(batchId);
        if (!batch) {
            throw ApiError.notFound('Batch not found');
        }

        // Check if QR already exists
        if (batch.internalQRCode) {
            logger.info(`QR code already exists for batch ${batchId}`);
            const qrDataURL = await QRCode.toDataURL(batch.internalQRCode);
            return {
                qrCode: batch.internalQRCode,
                qrDataURL,
                batchId
            };
        }

        // Create QR payload
        const qrPayload = {
            type: 'HOPERX_BATCH',
            batchId,
            drugId: batch.drugId,
            batchNumber: batch.batchNumber,
            timestamp: Date.now(),
            uuid: uuidv4()
        };

        const qrString = JSON.stringify(qrPayload);

        // Generate QR code as data URL
        const qrDataURL = await QRCode.toDataURL(qrString, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 300
        });

        // Update batch with internal QR code
        await inventoryRepository.updateBatch(batchId, {
            internalQRCode: qrString,
            barcodeType: 'QR_CODE'
        });

        // Also create barcode registry entry
        await barcodeRepository.create({
            barcode: qrString,
            batchId,
            barcodeType: 'INTERNAL',
            unitType: batch.receivedUnit || 'STRIP'
        });

        logger.info(`✅ Internal QR generated for batch ${batch.batchNumber}`);

        return {
            qrCode: qrString,
            qrDataURL,
            batchId,
            batchNumber: batch.batchNumber,
            drugName: batch.drug?.name
        };
    }

    /**
     * Process scanned barcode (main POS workflow)
     */
    async processScan({ barcode, employeeId, storeId, context = 'SALE' }) {
        logger.info(`Processing scan: ${barcode.substring(0, 20)}... by employee ${employeeId}`);

        // Try to find barcode in registry
        let barcodeData = await barcodeRepository.findByBarcode(barcode);

        // If not found, check if it's an internal QR code
        if (!barcodeData) {
            try {
                const qrPayload = JSON.parse(barcode);
                if (qrPayload.type === 'HOPERX_BATCH' && qrPayload.batchId) {
                    const batch = await inventoryRepository.findBatchById(qrPayload.batchId);
                    if (batch) {
                        // Log scan with null barcodeId (direct QR scan)
                        await this.logScan(null, employeeId, storeId, context, 'QR');
                        return this.enrichBatchData(batch);
                    }
                }
            } catch (e) {
                // Not a valid JSON QR code
            }

            throw ApiError.notFound('Barcode not recognized in system. Please enroll this barcode first.');
        }

        logger.info(`🔍 Found barcode: ${barcode} -> Batch ID: ${barcodeData.batchId}`);
        logger.info(`🔍 Batch Details: ${JSON.stringify({
            id: barcodeData.batch.id,
            drugName: barcodeData.batch.drug?.name,
            batchNumber: barcodeData.batch.batchNumber,
            qty: barcodeData.batch.baseUnitQuantity,
            deleted: barcodeData.batch.deletedAt
        })}`);

        // Validate batch is not deleted
        if (barcodeData.batch.deletedAt) {
            throw ApiError.badRequest('This batch has been deleted and cannot be sold');
        }

        // Check stock availability
        if (barcodeData.batch.baseUnitQuantity <= 0) {
            throw new Error(`No stock available for ${barcodeData.batch.drug.name} (Batch: ${barcodeData.batch.batchNumber})`);
        }

        // Check expiry
        const daysToExpiry = dayjs(barcodeData.batch.expiryDate).diff(dayjs(), 'days');
        if (daysToExpiry < 0) {
            logger.warn(`⚠️ Expired batch scanned: ${barcodeData.batch.batchNumber} (expired ${Math.abs(daysToExpiry)} days ago)`);
            // Don't block, but flag it
        }

        // Log scan event
        await this.logScan(barcodeData.id, employeeId, storeId, context, 'BARCODE');

        // Return enriched batch data for POS
        return this.enrichBatchData(barcodeData.batch);
    }

    /**
     * Log scan audit trail
     */
    async logScan(barcodeId, employeeId, storeId, scanType, deviceType) {
        return await barcodeRepository.logScan({
            barcodeId,
            employeeId,
            storeId,
            scanType,
            deviceType,
            scannedAt: new Date()
        });
    }

    /**
     * Enrich batch data with calculated fields for POS
     */
    enrichBatchData(batch) {
        const daysToExpiry = dayjs(batch.expiryDate).diff(dayjs(), 'days');

        return {
            batchId: batch.id,
            drugId: batch.drugId,
            drugName: batch.drug.name,
            strength: batch.drug.strength,
            form: batch.drug.form,
            manufacturer: batch.drug.manufacturer,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            daysToExpiry,
            isExpiringSoon: daysToExpiry <= 90,
            isExpired: daysToExpiry < 0,
            baseUnitQuantity: batch.baseUnitQuantity,
            mrp: batch.mrp,
            gstRate: batch.drug.gstRate,
            location: batch.location,
            tabletsPerStrip: batch.tabletsPerStrip,
            hasPartialStrips: batch.partialStripsCount > 0,
            partialStripsCount: batch.partialStripsCount,
            looseTabletsCount: batch.looseTabletsCount
        };
    }

    /**
     * Get scan statistics for employee
     */
    async getEmployeeScanStats(employeeId, startDate, endDate) {
        const scans = await barcodeRepository.getScanHistory({
            employeeId,
            startDate: startDate || dayjs().subtract(30, 'days').toDate(),
            endDate: endDate || new Date()
        });

        const stats = {
            totalScans: scans.length,
            scansByType: {},
            scansByDevice: {},
            scansByDay: {},
            averageScansPerDay: 0,
            mostScannedDrugs: {}
        };

        // Aggregate stats
        scans.forEach(scan => {
            // By type
            stats.scansByType[scan.scanType] = (stats.scansByType[scan.scanType] || 0) + 1;

            // By device
            stats.scansByDevice[scan.deviceType] = (stats.scansByDevice[scan.deviceType] || 0) + 1;

            // By day
            const day = dayjs(scan.scannedAt).format('YYYY-MM-DD');
            stats.scansByDay[day] = (stats.scansByDay[day] || 0) + 1;

            // By drug
            if (scan.barcode?.batch?.drug) {
                const drugName = scan.barcode.batch.drug.name;
                stats.mostScannedDrugs[drugName] = (stats.mostScannedDrugs[drugName] || 0) + 1;
            }
        });

        // Calculate average scans per day
        const daysDiff = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'days'));
        stats.averageScansPerDay = parseFloat((scans.length / daysDiff).toFixed(2));

        return stats;
    }

    /**
     * Verify barcode exists and is valid
     */
    async verifyBarcode(barcode) {
        const barcodeData = await barcodeRepository.findByBarcode(barcode);

        if (!barcodeData) {
            return {
                valid: false,
                message: 'Barcode not found in system'
            };
        }

        const batch = barcodeData.batch;
        const isExpired = dayjs(batch.expiryDate).isBefore(dayjs());
        const hasStock = batch.baseUnitQuantity > 0;

        return {
            valid: !isExpired && hasStock && !batch.deletedAt,
            message: isExpired ? 'Batch expired' : !hasStock ? 'Out of stock' : batch.deletedAt ? 'Batch deleted' : 'Valid',
            batch: this.enrichBatchData(batch)
        };
    }

    /**
     * Bulk barcode lookup for multiple scans
     */
    async bulkLookup(barcodes) {
        const results = await Promise.all(
            barcodes.map(async (barcode) => {
                try {
                    const data = await barcodeRepository.findByBarcode(barcode);
                    return {
                        barcode,
                        found: !!data,
                        batch: data ? this.enrichBatchData(data.batch) : null
                    };
                } catch (error) {
                    return {
                        barcode,
                        found: false,
                        error: error.message
                    };
                }
            })
        );

        return results;
    }
}

module.exports = new ScanService();
