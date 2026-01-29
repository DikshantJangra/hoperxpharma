const prisma = require('../../db/prisma');
const logger = require('../../config/logger');

/**
 * Duplicate Detection Service
 * Detects duplicate and similar medicines based on multi-field matching
 */
class DuplicateDetectionService {
    /**
     * Normalize medicine name for comparison
     */
    normalizeName(name) {
        if (!name) return '';
        return name.trim().toLowerCase();
    }

    /**
     * Normalize strength unit for comparison
     * Converts common units to standardized forms
     */
    normalizeStrengthUnit(value, unit) {
        if (!unit || value === null) return { value, unit: unit || '' };

        const normalized = unit.trim().toLowerCase();

        // Convert to base units
        const conversions = {
            // Weight
            'g': { factor: 1, baseUnit: 'g' },
            'gram': { factor: 1, baseUnit: 'g' },
            'grams': { factor: 1, baseUnit: 'g' },
            'mg': { factor: 0.001, baseUnit: 'g' },
            'milligram': { factor: 0.001, baseUnit: 'g' },
            'milligrams': { factor: 0.001, baseUnit: 'g' },
            'mcg': { factor: 0.000001, baseUnit: 'g' },
            'microgram': { factor: 0.000001, baseUnit: 'g' },
            'micrograms': { factor: 0.000001, baseUnit: 'g' },
            'μg': { factor: 0.000001, baseUnit: 'g' },
            'kg': { factor: 1000, baseUnit: 'g' },
            'kilogram': { factor: 1000, baseUnit: 'g' },
            'kilograms': { factor: 1000, baseUnit: 'g' },

            // Volume
            'l': { factor: 1, baseUnit: 'l' },
            'liter': { factor: 1, baseUnit: 'l' },
            'litre': { factor: 1, baseUnit: 'l' },
            'ml': { factor: 0.001, baseUnit: 'l' },
            'milliliter': { factor: 0.001, baseUnit: 'l' },
            'millilitre': { factor: 0.001, baseUnit: 'l' },

            // Units (no conversion)
            'iu': { factor: 1, baseUnit: 'iu' },
            'unit': { factor: 1, baseUnit: 'unit' },
            'units': { factor: 1, baseUnit: 'unit' },
        };

        const conversion = conversions[normalized];
        if (conversion) {
            return {
                value: parseFloat(value) * conversion.factor,
                unit: conversion.baseUnit
            };
        }

        // Return as-is if no conversion found
        return { value: parseFloat(value), unit: normalized };
    }

    /**
     * Compare two salt compositions
     * Returns true if they are equivalent (same salts, strengths, units)
     */
    compareSaltComposition(salts1, salts2) {
        if (!salts1 || !salts2) return false;
        if (salts1.length !== salts2.length) return false;
        if (salts1.length === 0 && salts2.length === 0) return true;

        // Normalize and sort both salt arrays by name
        const normalize = (salt) => {
            const normalized = this.normalizeStrengthUnit(
                salt.strengthValue,
                salt.strengthUnit
            );
            return {
                name: this.normalizeName(salt.name || salt.salt?.name),
                value: normalized.value,
                unit: normalized.unit
            };
        };

        const normalized1 = salts1.map(normalize).sort((a, b) => a.name.localeCompare(b.name));
        const normalized2 = salts2.map(normalize).sort((a, b) => a.name.localeCompare(b.name));

        // Compare each salt
        for (let i = 0; i < normalized1.length; i++) {
            const s1 = normalized1[i];
            const s2 = normalized2[i];

            // Name must match
            if (s1.name !== s2.name) return false;

            // Strength value and unit must match (with tolerance for floating point)
            if (Math.abs(s1.value - s2.value) > 0.0001) return false;
            if (s1.unit !== s2.unit) return false;
        }

        return true;
    }

    /**
     * Normalize medicine criteria for comparison
     */
    normalizeMedicineCriteria(data) {
        return {
            name: this.normalizeName(data.name),
            manufacturer: this.normalizeName(data.manufacturer),
            form: this.normalizeName(data.form),
            saltLinks: data.saltLinks || []
        };
    }

    /**
     * Check for exact duplicate medicine
     * Returns match details if found
     */
    async checkDuplicateMedicine(storeId, criteria) {
        try {
            const normalized = this.normalizeMedicineCriteria(criteria);

            logger.info('[Duplicate Detection] Checking for duplicates:', {
                storeId,
                name: normalized.name,
                manufacturer: normalized.manufacturer,
                form: normalized.form,
                saltCount: normalized.saltLinks.length
            });

            // Find medicines with similar name in the same store
            const candidates = await prisma.drug.findMany({
                where: {
                    storeId: storeId,
                    name: {
                        contains: normalized.name,
                        mode: "insensitive"
                    },
                    // deletedAt: null, // Field does not exist on Drug model
                    // ingestionStatus: { not: "INACTIVE" }, // Removed: INACTIVE is not a valid enum value
                },
                include: {
                    saltLinks: {
                        include: { salt: true },
                        orderBy: { order: 'asc' }
                    },
                    inventory: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            batchNumber: true,
                            quantityInStock: true,
                            baseUnitQuantity: true
                        }
                    }
                },
                take: 50
            });

            logger.info(`[Duplicate Detection] Found ${candidates.length} candidates`);

            // Check each candidate for exact match
            for (const candidate of candidates) {
                const candidateNormalized = this.normalizeMedicineCriteria({
                    name: candidate.name,
                    manufacturer: candidate.manufacturer,
                    form: candidate.form,
                    saltLinks: candidate.saltLinks
                });

                // Check exact match on all fields
                const nameMatch = normalized.name === candidateNormalized.name;
                const manufacturerMatch = !normalized.manufacturer ||
                    !candidateNormalized.manufacturer ||
                    normalized.manufacturer === candidateNormalized.manufacturer;
                const formMatch = !normalized.form ||
                    !candidateNormalized.form ||
                    normalized.form === candidateNormalized.form;
                const saltMatch = this.compareSaltComposition(normalized.saltLinks, candidate.saltLinks);

                if (nameMatch && manufacturerMatch && formMatch && saltMatch) {
                    // Calculate total stock
                    const totalStock = candidate.inventory?.reduce((sum, batch) => {
                        return sum + (batch.baseUnitQuantity || batch.quantityInStock || 0);
                    }, 0) || 0;

                    logger.info('[Duplicate Detection] EXACT DUPLICATE FOUND:', {
                        existingId: candidate.id,
                        name: candidate.name
                    });

                    return {
                        isDuplicate: true,
                        matchType: 'EXACT_DUPLICATE',
                        existingMedicine: {
                            id: candidate.id,
                            name: candidate.name,
                            manufacturer: candidate.manufacturer,
                            form: candidate.form,
                            batchCount: candidate.inventory?.length || 0,
                            totalStock: totalStock,
                            saltComposition: candidate.saltLinks.map(sl => ({
                                name: sl.salt.name,
                                strength: `${sl.strengthValue}${sl.strengthUnit}`
                            }))
                        }
                    };
                }
            }

            logger.info('[Duplicate Detection] No exact duplicate found');
            return {
                isDuplicate: false,
                matchType: 'NO_MATCH'
            };

        } catch (error) {
            logger.error('[Duplicate Detection] Error:', error);
            throw error;
        }
    }

    /**
     * Find similar medicines (partial matches)
     */
    async findSimilarMedicines(storeId, criteria) {
        try {
            const normalized = this.normalizeMedicineCriteria(criteria);

            const candidates = await prisma.drug.findMany({
                where: {
                    storeId,
                    name: {
                        contains: criteria.name.split(' ')[0], // Match first word
                        mode: 'insensitive'
                    }
                },
                include: {
                    saltLinks: {
                        include: { salt: true },
                        orderBy: { order: 'asc' }
                    },
                    inventory: {
                        where: { deletedAt: null },
                        select: {
                            id: true,
                            quantityInStock: true,
                            baseUnitQuantity: true
                        }
                    }
                },
                take: 10
            });

            const similarMedicines = [];

            for (const candidate of candidates) {
                const candidateNormalized = this.normalizeMedicineCriteria({
                    name: candidate.name,
                    manufacturer: candidate.manufacturer,
                    form: candidate.form,
                    saltLinks: candidate.saltLinks
                });

                // Skip if exact match (would be caught by checkDuplicate)
                const nameMatch = normalized.name === candidateNormalized.name;
                const saltMatch = this.compareSaltComposition(normalized.saltLinks, candidate.saltLinks);

                if (nameMatch && saltMatch) continue; // Exact duplicate, skip

                // Check for similarity
                const nameSimilar = normalized.name.includes(candidateNormalized.name.split(' ')[0]) ||
                    candidateNormalized.name.includes(normalized.name.split(' ')[0]);

                if (nameSimilar || saltMatch) {
                    const totalStock = candidate.inventory?.reduce((sum, batch) => {
                        return sum + (batch.baseUnitQuantity || batch.quantityInStock || 0);
                    }, 0) || 0;

                    similarMedicines.push({
                        id: candidate.id,
                        name: candidate.name,
                        manufacturer: candidate.manufacturer,
                        form: candidate.form,
                        batchCount: candidate.inventory?.length || 0,
                        totalStock: totalStock,
                        saltComposition: candidate.saltLinks.map(sl => ({
                            name: sl.salt.name,
                            strength: `${sl.strengthValue}${sl.strengthUnit}`
                        })),
                        matchReason: saltMatch ? 'Same salt composition' : 'Similar name'
                    });
                }
            }

            logger.info(`[Duplicate Detection] Found ${similarMedicines.length} similar medicines`);

            return similarMedicines;

        } catch (error) {
            logger.error('[Duplicate Detection] Error finding similar:', error);
            throw error;
        }
    }

    /**
     * Check if batch number already exists for a drug
     */
    async checkBatchDuplicate(storeId, drugId, batchNumber) {
        try {
            const existing = await prisma.inventoryBatch.findFirst({
                where: {
                    storeId,
                    drugId,
                    batchNumber: {
                        equals: batchNumber,
                        mode: 'insensitive'
                    },
                    deletedAt: null
                },
                include: {
                    drug: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (existing) {
                return {
                    batchExists: true,
                    batchId: existing.id,
                    currentStock: existing.baseUnitQuantity || existing.quantityInStock,
                    expiryDate: existing.expiryDate,
                    message: `Batch ${batchNumber} already exists for ${existing.drug.name}`,
                    suggestedAction: 'UPDATE_BATCH'
                };
            }

            return {
                batchExists: false
            };

        } catch (error) {
            logger.error('[Duplicate Detection] Error checking batch:', error);
            throw error;
        }
    }
}

module.exports = new DuplicateDetectionService();
