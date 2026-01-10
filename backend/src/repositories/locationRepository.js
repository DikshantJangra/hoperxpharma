const prisma = require('../db/prisma');
const logger = require('../config/logger');

/**
 * Location Repository - Data access for location intelligence
 */
class LocationRepository {
    /**
     * Create or update location
     */
    async upsertLocation(storeId, data) {
        const { code, name, type, parentLocationId } = data;

        return await prisma.location.upsert({
            where: {
                storeId_code: { storeId, code }
            },
            create: {
                storeId,
                code,
                name,
                type,
                parentLocationId
            },
            update: {
                name,
                type,
                parentLocationId
            }
        });
    }

    /**
     * Get all locations for a store
     */
    async getStoreLocations(storeId) {
        return await prisma.location.findMany({
            where: { storeId },
            orderBy: [
                { type: 'asc' },
                { code: 'asc' }
            ]
        });
    }

    /**
     * Map drug to location
     */
    async mapDrugToLocation(drugId, locationId, confidence = 0.8) {
        return await prisma.locationMapping.create({
            data: {
                drugId,
                locationId,
                confidence,
                lastVerifiedAt: new Date()
            }
        });
    }

    /**
     * Get drug location mapping
     */
    async getDrugLocation(drugId) {
        return await prisma.locationMapping.findFirst({
            where: { drugId },
            include: { location: true },
            orderBy: { confidence: 'desc' }
        });
    }

    /**
     * Log location mismatch
     */
    async logLocationMismatch(data) {
        return await prisma.locationMismatch.create({
            data: {
                ...data,
                detectedAt: new Date()
            }
        });
    }

    /**
     * Get location mismatches for analysis
     */
    async getLocationMismatches(storeId, startDate, endDate) {
        return await prisma.locationMismatch.findMany({
            where: {
                storeId,
                detectedAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                drug: true,
                expectedLocation: true,
                actualLocation: true
            },
            orderBy: { detectedAt: 'desc' }
        });
    }

    /**
     * Update location confidence based on usage
     */
    async updateLocationConfidence(drugId, locationId, wasCorrect) {
        const mapping = await prisma.locationMapping.findFirst({
            where: { drugId, locationId }
        });

        if (!mapping) return null;

        // Adjust confidence: +0.1 if correct, -0.2 if wrong
        const adjustment = wasCorrect ? 0.1 : -0.2;
        const newConfidence = Math.max(0, Math.min(1, mapping.confidence + adjustment));

        return await prisma.locationMapping.update({
            where: { id: mapping.id },
            data: {
                confidence: newConfidence,
                lastVerifiedAt: new Date()
            }
        });
    }
}

module.exports = new LocationRepository();
