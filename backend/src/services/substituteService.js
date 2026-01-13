const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const cacheService = require('./cacheService');

/**
 * Substitute Discovery Service
 * 
 * Fast discovery of alternative medicines with identical salt composition.
 * Implements exact matching with ranking and caching.
 */
class SubstituteService {
    /**
     * Find substitute medicines for a given drug
     * @param {Object} query - Substitute query
     * @param {string} query.drugId - Source drug ID
     * @param {string} query.storeId - Store ID for inventory filtering
     * @param {boolean} query.includePartialMatches - Include partial matches (default: false)
     * @returns {Promise<Array>} Array of substitute medicines
     */
    async findSubstitutes(query) {
        const { drugId, storeId, includePartialMatches = false } = query;

        if (!drugId || !storeId) {
            throw ApiError.badRequest('drugId and storeId are required');
        }

        // Check cache first
        const cacheKey = `substitutes:${drugId}:${storeId}:${includePartialMatches}`;
        const cached = cacheService.get(cacheKey);
        
        if (cached) {
            logger.debug(`Returning cached substitutes for drug ${drugId}`);
            return cached;
        }

        try {
            // Get source drug with salt composition
            const sourceDrug = await prisma.drug.findUnique({
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

            if (!sourceDrug) {
                throw ApiError.notFound('Source drug not found');
            }

            if (!sourceDrug.drugSaltLinks || sourceDrug.drugSaltLinks.length === 0) {
                logger.debug(`No salt composition for drug ${drugId}`);
                return [];
            }

            // Find exact matches
            const exactMatches = await this.findExactMatches(
                sourceDrug.drugSaltLinks,
                storeId,
                drugId
            );

            let substitutes = exactMatches;

            // Optionally include partial matches
            if (includePartialMatches && exactMatches.length < 5) {
                const partialMatches = await this.findPartialMatches(
                    sourceDrug.drugSaltLinks,
                    storeId,
                    drugId
                );
                substitutes = [...exactMatches, ...partialMatches];
            }

            // Rank substitutes
            const rankedSubstitutes = this.rankSubstitutes(substitutes, sourceDrug);

            logger.info(`Found ${rankedSubstitutes.length} substitutes for drug ${drugId}`);

            // Cache results for 1 hour
            cacheService.set(cacheKey, rankedSubstitutes, 3600);

            return rankedSubstitutes;
        } catch (error) {
            logger.error(`Error finding substitutes for drug ${drugId}:`, error);
            throw error;
        }
    }

    /**
     * Find drugs with exact salt composition match
     * @private
     * @param {Array} saltLinks - Source drug salt links
     * @param {string} storeId - Store ID
     * @param {string} excludeDrugId - Drug ID to exclude (source drug)
     * @returns {Promise<Array>}
     */
    async findExactMatches(saltLinks, storeId, excludeDrugId) {
        // Build composition signature for matching
        const saltCount = saltLinks.length;
        const saltIds = saltLinks.map(link => link.saltId);

        // Find drugs with same number of salts
        const candidateDrugs = await prisma.drug.findMany({
            where: {
                id: { not: excludeDrugId },
                storeId: storeId,
                ingestionStatus: 'ACTIVE',
                deletedAt: null,
                drugSaltLinks: {
                    some: {
                        saltId: { in: saltIds }
                    }
                }
            },
            include: {
                drugSaltLinks: {
                    include: {
                        salt: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                inventoryBatches: {
                    where: {
                        storeId: storeId,
                        deletedAt: null,
                        quantityInStock: { gt: 0 }
                    },
                    select: {
                        quantityInStock: true,
                        mrp: true
                    }
                }
            }
        });

        // Filter for exact composition match
        const exactMatches = candidateDrugs.filter(drug => {
            // Must have same number of salts
            if (drug.drugSaltLinks.length !== saltCount) {
                return false;
            }

            // Check each salt matches (ID, strength, unit)
            return saltLinks.every(sourceLink => {
                return drug.drugSaltLinks.some(drugLink =>
                    drugLink.saltId === sourceLink.saltId &&
                    drugLink.strengthValue === sourceLink.strengthValue &&
                    drugLink.strengthUnit === sourceLink.strengthUnit
                );
            });
        });

        // Transform to substitute format
        return exactMatches.map(drug => this.transformToSubstitute(drug, 'EXACT', 100));
    }

    /**
     * Find drugs with partial salt composition match
     * @private
     * @param {Array} saltLinks - Source drug salt links
     * @param {string} storeId - Store ID
     * @param {string} excludeDrugId - Drug ID to exclude
     * @returns {Promise<Array>}
     */
    async findPartialMatches(saltLinks, storeId, excludeDrugId) {
        const saltIds = saltLinks.map(link => link.saltId);

        // Find drugs with at least one matching salt
        const candidateDrugs = await prisma.drug.findMany({
            where: {
                id: { not: excludeDrugId },
                storeId: storeId,
                ingestionStatus: 'ACTIVE',
                deletedAt: null,
                drugSaltLinks: {
                    some: {
                        saltId: { in: saltIds }
                    }
                }
            },
            include: {
                drugSaltLinks: {
                    include: {
                        salt: true
                    },
                    orderBy: {
                        order: 'asc'
                    }
                },
                inventoryBatches: {
                    where: {
                        storeId: storeId,
                        deletedAt: null,
                        quantityInStock: { gt: 0 }
                    },
                    select: {
                        quantityInStock: true,
                        mrp: true
                    }
                }
            }
        });

        // Calculate match scores
        const partialMatches = candidateDrugs
            .map(drug => {
                const matchScore = this.calculateMatchScore(saltLinks, drug.drugSaltLinks);
                
                // Only include if score is above threshold (50%)
                if (matchScore < 50) {
                    return null;
                }

                return this.transformToSubstitute(drug, 'PARTIAL', matchScore);
            })
            .filter(match => match !== null);

        return partialMatches;
    }

    /**
     * Calculate match score between two salt compositions
     * @private
     * @param {Array} sourceSalts - Source drug salt links
     * @param {Array} targetSalts - Target drug salt links
     * @returns {number} Match score (0-100)
     */
    calculateMatchScore(sourceSalts, targetSalts) {
        let matchingCount = 0;
        let exactMatchCount = 0;

        sourceSalts.forEach(sourceLink => {
            const match = targetSalts.find(targetLink =>
                targetLink.saltId === sourceLink.saltId
            );

            if (match) {
                matchingCount++;
                
                // Bonus for exact strength match
                if (match.strengthValue === sourceLink.strengthValue &&
                    match.strengthUnit === sourceLink.strengthUnit) {
                    exactMatchCount++;
                }
            }
        });

        // Score calculation:
        // - 70% weight for salt matching
        // - 30% weight for strength matching
        const saltMatchPercent = (matchingCount / sourceSalts.length) * 70;
        const strengthMatchPercent = (exactMatchCount / sourceSalts.length) * 30;

        return Math.round(saltMatchPercent + strengthMatchPercent);
    }

    /**
     * Transform drug to substitute format
     * @private
     * @param {Object} drug - Drug with relations
     * @param {string} matchType - 'EXACT' or 'PARTIAL'
     * @param {number} matchScore - Match score (0-100)
     * @returns {Object} Substitute object
     */
    transformToSubstitute(drug, matchType, matchScore) {
        // Calculate total available stock
        const totalStock = drug.inventoryBatches.reduce(
            (sum, batch) => sum + batch.quantityInStock,
            0
        );

        // Get average MRP
        const avgMrp = drug.inventoryBatches.length > 0
            ? drug.inventoryBatches.reduce((sum, batch) => sum + batch.mrp, 0) / drug.inventoryBatches.length
            : 0;

        return {
            drugId: drug.id,
            name: drug.name,
            manufacturer: drug.manufacturer || 'Unknown',
            form: drug.form || 'Unknown',
            mrp: avgMrp,
            availableStock: totalStock,
            matchType,
            matchScore,
            salts: drug.drugSaltLinks.map(link => ({
                saltName: link.salt.name,
                strengthValue: link.strengthValue,
                strengthUnit: link.strengthUnit
            }))
        };
    }

    /**
     * Rank substitutes by availability, price, and manufacturer
     * @private
     * @param {Array} substitutes - Array of substitutes
     * @param {Object} sourceDrug - Source drug for comparison
     * @returns {Array} Ranked substitutes
     */
    rankSubstitutes(substitutes, sourceDrug) {
        return substitutes.sort((a, b) => {
            // 1. Exact matches before partial matches
            if (a.matchType !== b.matchType) {
                return a.matchType === 'EXACT' ? -1 : 1;
            }

            // 2. Higher match score first
            if (a.matchScore !== b.matchScore) {
                return b.matchScore - a.matchScore;
            }

            // 3. In-stock before out-of-stock
            if (a.availableStock > 0 && b.availableStock === 0) return -1;
            if (a.availableStock === 0 && b.availableStock > 0) return 1;

            // 4. Higher stock first
            if (a.availableStock !== b.availableStock) {
                return b.availableStock - a.availableStock;
            }

            // 5. Lower price first
            if (a.mrp !== b.mrp) {
                return a.mrp - b.mrp;
            }

            // 6. Same manufacturer as source (if available)
            if (sourceDrug.manufacturer) {
                const aMatchesManufacturer = a.manufacturer === sourceDrug.manufacturer;
                const bMatchesManufacturer = b.manufacturer === sourceDrug.manufacturer;
                
                if (aMatchesManufacturer && !bMatchesManufacturer) return -1;
                if (!aMatchesManufacturer && bMatchesManufacturer) return 1;
            }

            // 7. Alphabetical by name
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Get substitute statistics for a store
     * @param {string} storeId - Store ID
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics(storeId) {
        // Count drugs with substitutes available
        const activeDrugs = await prisma.drug.count({
            where: {
                storeId,
                ingestionStatus: 'ACTIVE',
                deletedAt: null,
                drugSaltLinks: {
                    some: {}
                }
            }
        });

        return {
            totalActiveDrugs: activeDrugs,
            // Additional statistics can be added here
        };
    }

    /**
     * Invalidate substitute cache for a drug
     * @param {string} drugId - Drug ID
     */
    invalidateCache(drugId) {
        // Invalidate all cache entries for this drug
        const pattern = `substitutes:${drugId}:*`;
        const deletedCount = cacheService.deletePattern(pattern);
        
        if (deletedCount > 0) {
            logger.info(`Invalidated ${deletedCount} cache entries for drug ${drugId}`);
        }
    }

    /**
     * Invalidate substitute cache for a store
     * @param {string} storeId - Store ID
     */
    invalidateStoreCache(storeId) {
        // Invalidate all cache entries for this store
        const pattern = `substitutes:*:${storeId}:*`;
        const deletedCount = cacheService.deletePattern(pattern);
        
        if (deletedCount > 0) {
            logger.info(`Invalidated ${deletedCount} cache entries for store ${storeId}`);
        }
    }
}

module.exports = new SubstituteService();
