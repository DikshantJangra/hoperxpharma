const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const validationService = require('./validationService');
const auditService = require('./auditService');
const substituteService = require('./substituteService');
const { v4: uuidv4 } = require('uuid');

/**
 * Enhanced Drug Service
 * 
 * Manages drug CRUD operations with salt intelligence integration.
 * Validates: Requirements 1.5, 4.7, 7.4, 13.2, 13.3, 13.4, 6.4, 8.5
 */
class DrugService {
    /**
     * Create a new drug with default ingestion status
     * @param {Object} data - Drug data
     * @param {string} userId - User ID creating the drug
     * @returns {Promise<Object>} Created drug
     */
    async createDrug(data, userId) {
        const { storeId, name, saltLinks = [], ...otherData } = data;

        // Determine ingestion status based on salt links
        let ingestionStatus = 'SALT_PENDING';
        
        if (saltLinks && saltLinks.length > 0) {
            // Validate salt links
            const validation = validationService.validateSaltMapping({ salts: saltLinks });
            
            if (validation.valid) {
                ingestionStatus = 'ACTIVE';
            }
        }

        try {
            // Process salt links - find or create salts by name if saltId not provided
            const processedSaltLinks = [];
            for (const link of saltLinks) {
                let saltId = link.saltId;
                
                // If no saltId but has name, find or create the salt
                if (!saltId && link.name) {
                    let salt = await prisma.salt.findFirst({
                        where: { name: { equals: link.name.trim(), mode: 'insensitive' } }
                    });
                    
                    if (!salt) {
                        salt = await prisma.salt.create({
                            data: {
                                name: link.name.trim(),
                                aliases: [],
                                createdById: userId !== 'system' ? userId : null
                            }
                        });
                        logger.info(`Created new salt: ${salt.name} (${salt.id})`);
                    }
                    
                    saltId = salt.id;
                }
                
                if (saltId) {
                    processedSaltLinks.push({
                        saltId,
                        strengthValue: link.strengthValue ? Number(link.strengthValue) : null,
                        strengthUnit: link.strengthUnit || null,
                        role: link.role || 'PRIMARY',
                        order: link.order || processedSaltLinks.length
                    });
                }
            }

            const drug = await prisma.drug.create({
                data: {
                    storeId,
                    name,
                    ingestionStatus: processedSaltLinks.length > 0 ? 'ACTIVE' : 'SALT_PENDING',
                    ...otherData,
                    saltLinks: processedSaltLinks.length > 0 ? {
                        create: processedSaltLinks
                    } : undefined
                },
                include: {
                    saltLinks: {
                        include: {
                            salt: true
                        }
                    }
                }
            });

            // Log creation if salt links were provided
            if (processedSaltLinks.length > 0) {
                await auditService.logCreation({
                    drugId: drug.id,
                    userId,
                    newValue: processedSaltLinks,
                    wasAutoMapped: false
                });
            }

            logger.info(`Drug created: ${drug.id} with status ${drug.ingestionStatus}`);
            return drug;
        } catch (error) {
            logger.error(`Failed to create drug:`, error);
            throw error;
        }
    }

    /**
     * Activate a medicine by confirming salt mappings
     * @param {string} drugId - Drug ID
     * @param {string} userId - User ID confirming the activation
     * @returns {Promise<Object>} Updated drug
     */
    async activateMedicine(drugId, userId) {
        // Get drug with salt links
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            include: {
                saltLinks: {
                    include: {
                        salt: true
                    }
                }
            }
        });

        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        // Validate activation
        const validation = validationService.validateActivation(drug);
        
        if (!validation.valid) {
            throw ApiError.badRequest(validation.errors.join('; '));
        }

        try {
            // Update drug status
            const updatedDrug = await prisma.drug.update({
                where: { id: drugId },
                data: {
                    ingestionStatus: 'ACTIVE',
                    confirmedBy: userId,
                    confirmedAt: new Date()
                },
                include: {
                    saltLinks: {
                        include: {
                            salt: true
                        }
                    }
                }
            });

            // Log activation
            await auditService.logUpdate({
                drugId,
                userId,
                oldValue: { ingestionStatus: drug.ingestionStatus },
                newValue: { ingestionStatus: 'ACTIVE' }
            });

            // Invalidate substitute cache
            substituteService.invalidateCache(drugId);

            logger.info(`Medicine activated: ${drugId} by user ${userId}`);
            return updatedDrug;
        } catch (error) {
            logger.error(`Failed to activate medicine ${drugId}:`, error);
            throw error;
        }
    }

    /**
     * Import medicines with auto-mapping
     * @param {Array} importData - Array of medicine data
     * @param {string} userId - User ID performing the import
     * @returns {Promise<Object>} Import summary
     */
    async importMedicines(importData, userId) {
        const validation = validationService.validateImport(importData);
        
        const results = {
            total: importData.length,
            successful: 0,
            pending: 0,
            failed: 0,
            errors: []
        };

        for (const record of validation.validRecords) {
            try {
                // Determine status based on confidence
                let ingestionStatus = 'SALT_PENDING';
                let confidence = 'LOW';

                if (record.salts && record.salts.length > 0) {
                    // Check confidence of salt mappings
                    const highConfidence = record.salts.every(s => s.confidence === 'HIGH');
                    
                    if (highConfidence) {
                        ingestionStatus = 'ACTIVE';
                        confidence = 'HIGH';
                    } else {
                        confidence = 'MEDIUM';
                    }
                }

                const drug = await this.createDrug(record, userId);

                if (ingestionStatus === 'ACTIVE') {
                    results.successful++;
                } else {
                    results.pending++;
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    record: record.name,
                    error: error.message
                });
            }
        }

        // Add invalid records to failed count
        results.failed += validation.invalidRecords.length;
        validation.invalidRecords.forEach(invalid => {
            results.errors.push({
                record: invalid.record.name || `Record ${invalid.index}`,
                error: invalid.errors.join('; ')
            });
        });

        logger.info(`Import completed: ${results.successful} successful, ${results.pending} pending, ${results.failed} failed`);
        return results;
    }

    /**
     * Bulk update medicines with batching
     * @param {Array} updates - Array of update objects
     * @param {string} userId - User ID performing the updates
     * @returns {Promise<Object>} Update summary
     */
    async bulkUpdate(updates, userId) {
        const validation = validationService.validateBulkUpdate(updates);
        
        if (!validation.valid) {
            throw ApiError.badRequest(validation.errors.join('; '));
        }

        const BATCH_SIZE = 100;
        const batchId = uuidv4();
        
        const results = {
            total: updates.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Process in batches
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE);
            
            for (const update of batch) {
                try {
                    // Get current drug state
                    const currentDrug = await prisma.drug.findUnique({
                        where: { id: update.drugId },
                        include: {
                            drugSaltLinks: {
                                include: {
                                    salt: true
                                }
                            }
                        }
                    });

                    if (!currentDrug) {
                        throw new Error('Drug not found');
                    }

                    const oldValue = currentDrug.drugSaltLinks.map(link => ({
                        saltId: link.saltId,
                        strengthValue: link.strengthValue,
                        strengthUnit: link.strengthUnit
                    }));

                    // Delete existing salt links
                    await prisma.drugSaltLink.deleteMany({
                        where: { drugId: update.drugId }
                    });

                    // Create new salt links
                    if (update.salts && update.salts.length > 0) {
                        await prisma.drugSaltLink.createMany({
                            data: update.salts.map((salt, index) => ({
                                drugId: update.drugId,
                                saltId: salt.saltId,
                                strengthValue: salt.strengthValue,
                                strengthUnit: salt.strengthUnit,
                                role: salt.role || 'PRIMARY',
                                order: index
                            }))
                        });
                    }

                    // Log update
                    await auditService.logUpdate({
                        drugId: update.drugId,
                        userId,
                        oldValue,
                        newValue: update.salts,
                        batchId
                    });

                    // Invalidate substitute cache
                    substituteService.invalidateCache(update.drugId);

                    results.successful++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        drugId: update.drugId,
                        error: error.message
                    });
                }
            }

            // Log batch progress
            logger.info(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${results.successful} successful, ${results.failed} failed`);
        }

        logger.info(`Bulk update completed: ${results.successful} successful, ${results.failed} failed`);
        return results;
    }

    /**
     * Get drug by ID
     * @param {string} drugId - Drug ID
     * @returns {Promise<Object>} Drug
     */
    async getDrugById(drugId) {
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            include: {
                drugSaltLinks: {
                    include: {
                        salt: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        return drug;
    }

    /**
     * Get drugs by ingestion status
     * @param {string} storeId - Store ID
     * @param {string} status - Ingestion status
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Drugs
     */
    async getDrugsByStatus(storeId, status, options = {}) {
        const { limit = 100, offset = 0 } = options;

        return await prisma.drug.findMany({
            where: {
                storeId,
                ingestionStatus: status,
                deletedAt: null
            },
            include: {
                drugSaltLinks: {
                    include: {
                        salt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: offset
        });
    }
}

module.exports = new DrugService();
