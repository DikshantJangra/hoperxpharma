const drugRepository = require('../../repositories/drugRepository');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');
const fs = require('fs');
const csv = require('csv-parser');

/**
 * Drug Service - Business logic for drug/medicine management
 */
class DrugService {
    /**
     * Search drugs with fuzzy matching
     */
    async searchDrugs({ query, supplierId, limit }) {
        const drugs = await drugRepository.searchDrugs(query, limit);

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
     */
    async getDrugById(id, storeId) {
        const drug = await drugRepository.findDrugById(id);

        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        // If storeId provided, fetch inventory details
        if (storeId) {
            const inventory = await drugRepository.getInventoryForDrug(id, storeId);
            drug.inventory = inventory;
        }

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
    async createOrUpdateDrugFromRow(row) {
        const drugData = {
            name: row.name || row.drug_name || row.product_name,
            strength: row.strength || row.dosage,
            form: row.form || row.dosage_form || 'Tablet',
            manufacturer: row.manufacturer || row.company,
            hsnCode: row.hsnCode || row.hsn_code || row.hsn,
            gstRate: parseFloat(row.gstRate || row.gst_rate || row.gst || 12),
            requiresPrescription: this.parseBooleanField(row.requiresPrescription || row.prescription_required),
            defaultUnit: row.defaultUnit || row.unit || 'Strip',
            lowStockThreshold: parseInt(row.lowStockThreshold || row.min_stock || 10),
            description: row.description || null
        };

        // Validate required fields
        if (!drugData.name) {
            throw new Error('Drug name is required');
        }

        // Check if drug already exists by name + strength
        const existing = await drugRepository.findDrugByNameAndStrength(
            drugData.name,
            drugData.strength
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

        const drug = await drugRepository.createDrug(drugData);
        logger.info(`Drug created: ${drug.name} (ID: ${drug.id})`);

        return drug;
    }

    /**
     * Update drug
     */
    async updateDrug(id, drugData) {
        const existing = await drugRepository.findDrugById(id);

        if (!existing) {
            throw ApiError.notFound('Drug not found');
        }

        const drug = await drugRepository.updateDrug(id, drugData);
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
