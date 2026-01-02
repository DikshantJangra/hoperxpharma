const drugRepository = require('../../repositories/drugRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const cacheService = require('../cache/cacheService');
const fs = require('fs');
const csv = require('csv-parser');

/**
 * Drug Service - Business logic for drug/medicine management
 */
class DrugService {
    /**
     * Search drugs with fuzzy matching
     */
    async searchDrugs({ query, storeId, supplierId, limit }) {
        if (!storeId) {
            throw ApiError.badRequest('storeId is required');
        }

        const drugs = await drugRepository.searchDrugs(query, storeId, limit);

        // If supplierId provided, filter by supplier's catalog
        // This is a placeholder - enhance when supplier catalog is implemented
        if (supplierId) {
            // TODO: Join with SupplierCatalog table when available
            logger.info(`Filtering by supplier ${supplierId} - not yet implemented`);
        }

        return drugs;
    }

    /**
     * Get drug by ID with additional details
     * Uses cache-aside pattern for better performance
     */
    async getDrugById(id, storeId) {
        // Try cache first
        const cached = cacheService.drug.get(id);
        if (cached) {
            logger.debug('Drug cache HIT', { drugId: id });
            return cached;
        }

        // Cache miss - fetch from database
        const drug = await drugRepository.findDrugById(id, storeId);

        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        // If storeId provided, fetch inventory details
        if (storeId) {
            const inventory = await drugRepository.getInventoryForDrug(id, storeId);
            drug.inventory = inventory;
        }

        // Store in cache (10 minutes TTL)
        cacheService.drug.set(id, drug);

        return drug;
    }

    /**
     * Import drugs from CSV file
     */
    async importFromCSV(filePath) {
        const drugs = [];
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    drugs.push(row);
                })
                .on('end', async () => {
                    logger.info(`Processing ${drugs.length} drugs from CSV`);

                    for (const row of drugs) {
                        try {
                            await this.createOrUpdateDrugFromRow(row);
                            successCount++;
                        } catch (error) {
                            errorCount++;
                            errors.push({
                                row: row.name || 'Unknown',
                                error: error.message
                            });
                            logger.error(`Failed to import drug: ${row.name}`, error);
                        }
                    }

                    // Clean up uploaded file
                    fs.unlinkSync(filePath);

                    resolve({
                        total: drugs.length,
                        success: successCount,
                        failed: errorCount,
                        errors: errors.slice(0, 10) // Return first 10 errors
                    });
                })
                .on('error', (error) => {
                    logger.error('CSV parsing error', error);
                    reject(ApiError.badRequest('Failed to parse CSV file'));
                });
        });
    }

    /**
     * Create or update drug from CSV row
     */
    async createOrUpdateDrugFromRow(row, storeId) {
        if (!storeId) {
            throw new Error('storeId is required for drug import');
        }

        const drugData = {
            storeId,
            name: row.name || row.drug_name || row.product_name,
            strength: row.strength || row.dosage,
            form: row.form || row.dosage_form || 'Tablet',
            manufacturer: row.manufacturer || row.company,
            hsnCode: row.hsnCode || row.hsn_code || row.hsn,
            gstRate: parseFloat(row.gstRate || row.gst_rate || row.gst || 5),
            requiresPrescription: this.parseBooleanField(row.requiresPrescription || row.prescription_required),
            defaultUnit: row.defaultUnit || row.unit || 'Strip',
            lowStockThreshold: parseInt(row.lowStockThreshold || row.min_stock || 10),
            description: row.description || null
        };

        // Validate required fields
        if (!drugData.name) {
            throw new Error('Drug name is required');
        }

        // Check if drug already exists by name + strength in this store
        const existing = await drugRepository.findDrugByNameAndStrength(
            drugData.name,
            drugData.strength,
            storeId
        );

        if (existing) {
            return await drugRepository.updateDrug(existing.id, drugData);
        } else {
            return await drugRepository.createDrug(drugData);
        }
    }

    /**
     * Parse boolean fields from CSV
     */
    parseBooleanField(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return ['true', 'yes', '1', 'y'].includes(value.toLowerCase());
        }
        return false;
    }

    /**
     * Create drug manually
     */
    async createDrug(drugData) {
        // Validate required fields
        if (!drugData.name) {
            throw ApiError.badRequest('Drug name is required');
        }

        if (!drugData.storeId) {
            throw ApiError.badRequest('storeId is required');
        }

        // If hsnCodeId is provided, fetch and populate tax rate from HSN code
        if (drugData.hsnCodeId) {
            const gstRepository = require('../../repositories/gstRepository');
            const hsnCode = await gstRepository.findHsnCodeById(drugData.hsnCodeId);

            if (!hsnCode) {
                throw ApiError.badRequest('Invalid HSN code');
            }

            // Auto-populate tax rate and HSN code from linked record
            drugData.gstRate = hsnCode.taxSlab.rate;
            drugData.hsnCode = hsnCode.code; // Snapshot for backward compatibility

            logger.info(`Auto-populated GST rate ${drugData.gstRate}% from HSN ${hsnCode.code}`);
        } else if (!drugData.gstRate) {
            // Fallback to default GST rate if neither hsnCodeId nor gstRate provided
            drugData.gstRate = 12; // Default pharmacy rate
            logger.warn(`No HSN code linked, using default GST rate: 12%`);
        }

        const drug = await drugRepository.createDrug(drugData);
        logger.info(`Drug created: ${drug.name} (ID: ${drug.id}) for store ${drugData.storeId}`);

        return drug;
    }

    /**
     * Update drug
     */
    async updateDrug(id, drugData, storeId = null) {
        const existing = await drugRepository.findDrugById(id, storeId);

        if (!existing) {
            throw ApiError.notFound('Drug not found');
        }

        // If hsnCodeId is being updated, fetch and update tax rate
        if (drugData.hsnCodeId) {
            const gstRepository = require('../../repositories/gstRepository');
            const hsnCode = await gstRepository.findHsnCodeById(drugData.hsnCodeId);

            if (!hsnCode) {
                throw ApiError.badRequest('Invalid HSN code');
            }

            // Auto-update tax rate and HSN code
            drugData.gstRate = hsnCode.taxSlab.rate;
            drugData.hsnCode = hsnCode.code;

            logger.info(`Updated GST rate to ${drugData.gstRate}% from HSN ${hsnCode.code}`);
        }

        const drug = await drugRepository.updateDrug(id, drugData);

        // Invalidate cache on update
        cacheService.drug.invalidate(id);

        logger.info(`Drug updated: ${drug.name} (ID: ${drug.id})`);

        return drug;
    }

    /**
     * Get all drugs with pagination
     */
    async getAllDrugs(filters) {
        return await drugRepository.findAllDrugs(filters);
    }
}

module.exports = new DrugService();
