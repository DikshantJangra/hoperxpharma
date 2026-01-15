"use strict";
/**
 * MedicineMasterService - Core Medicine Master Operations
 *
 * Handles CRUD operations, versioning, and bulk operations for the medicine master database.
 * Requirements: 1.1, 1.2, 1.4, 1.6, 8.1, 8.2, 9.2
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicineMasterService = exports.MedicineMasterService = void 0;
const client_1 = require("@prisma/client");
const IndexManagementService_1 = require("./IndexManagementService");
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const logger_1 = require("../lib/logger");
const errorHandler_1 = require("../middlewares/errorHandler");
const metrics_1 = require("../lib/metrics");
class MedicineMasterService {
    /**
     * Generate canonical ID from medicine attributes
     * Format: {manufacturer-slug}-{name-slug}-{form-slug}-{strength-slug}
     * Requirements: 1.2
     */
    generateCanonicalId(input) {
        const slugify = (text) => text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
        const parts = [
            slugify(input.manufacturerName),
            slugify(input.name),
            slugify(input.form),
        ];
        const baseId = parts.join('-');
        // Add hash suffix for uniqueness
        const hash = crypto_1.default
            .createHash('md5')
            .update(`${input.name}|${input.compositionText}|${input.manufacturerName}|${input.form}|${input.packSize}`)
            .digest('hex')
            .substring(0, 8);
        return `${baseId}-${hash}`;
    }
    /**
     * Create a new medicine
     * Requirements: 1.1, 1.2
     */
    async create(input, createdBy) {
        const startTime = Date.now();
        try {
            // Generate canonical ID
            const canonicalId = this.generateCanonicalId(input);
            // Check if already exists
            const existing = await prisma_1.default.medicineMaster.findUnique({
                where: { id: canonicalId },
            });
            if (existing) {
                throw new errorHandler_1.ConflictError(`Medicine with ID ${canonicalId} already exists`);
            }
            // Create medicine
            const medicine = await prisma_1.default.medicineMaster.create({
                data: {
                    id: canonicalId,
                    name: input.name,
                    genericName: input.genericName,
                    compositionText: input.compositionText,
                    manufacturerName: input.manufacturerName,
                    form: input.form,
                    packSize: input.packSize,
                    schedule: input.schedule,
                    requiresPrescription: input.requiresPrescription,
                    defaultGstRate: input.defaultGstRate,
                    hsnCode: input.hsnCode,
                    primaryBarcode: input.primaryBarcode,
                    alternativeBarcodes: input.alternativeBarcodes || [],
                    status: input.status || client_1.MedicineStatus.PENDING,
                    confidenceScore: input.confidenceScore || 50,
                    usageCount: 0,
                    createdBy,
                },
            });
            // Create initial version
            await this.createVersion(canonicalId, medicine, 'CREATED', createdBy);
            // Index in Typesense
            await IndexManagementService_1.indexManagementService.indexMedicine(canonicalId);
            // Log and track metrics
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.info('Medicine created', { canonicalId, createdBy, duration });
            metrics_1.medicineMetrics.recordMedicineOperation('create', duration);
            metrics_1.medicineMetrics.incrementMedicineCount();
            return medicine;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.error('Failed to create medicine', { error, input, duration });
            throw error;
        }
    }
    /**
     * Get medicine by canonical ID
     * Requirements: 1.4
     */
    async getById(canonicalId) {
        const startTime = Date.now();
        try {
            const medicine = await prisma_1.default.medicineMaster.findUnique({
                where: { id: canonicalId },
                include: {
                    saltLinks: {
                        include: {
                            salt: true,
                        },
                    },
                },
            });
            const duration = Date.now() - startTime;
            metrics_1.medicineMetrics.recordMedicineOperation('getById', duration);
            return medicine;
        }
        catch (error) {
            logger_1.medicineLogger.error('Failed to get medicine by ID', { error, canonicalId });
            throw error;
        }
    }
    /**
     * Get multiple medicines by IDs
     * Requirements: 1.4
     */
    async getByIds(canonicalIds) {
        return prisma_1.default.medicineMaster.findMany({
            where: {
                id: {
                    in: canonicalIds,
                },
            },
            include: {
                saltLinks: {
                    include: {
                        salt: true,
                    },
                },
            },
        });
    }
    /**
     * Update medicine with versioning
     * Requirements: 8.1, 8.2
     */
    async update(canonicalId, input, updatedBy) {
        const startTime = Date.now();
        try {
            // Get current medicine
            const current = await this.getById(canonicalId);
            if (!current) {
                throw new errorHandler_1.NotFoundError(`Medicine ${canonicalId}`);
            }
            // Update medicine
            const updated = await prisma_1.default.medicineMaster.update({
                where: { id: canonicalId },
                data: {
                    ...input,
                    updatedAt: new Date(),
                },
            });
            // Create version record
            await this.createVersion(canonicalId, updated, 'UPDATED', updatedBy);
            // Update search index
            await IndexManagementService_1.indexManagementService.indexMedicine(canonicalId);
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.info('Medicine updated', { canonicalId, updatedBy, duration });
            metrics_1.medicineMetrics.recordMedicineOperation('update', duration);
            return updated;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.error('Failed to update medicine', { error, canonicalId, duration });
            throw error;
        }
    }
    /**
     * Soft delete medicine
     * Requirements: 8.1
     */
    async softDelete(canonicalId, deletedBy) {
        const medicine = await this.update(canonicalId, { status: client_1.MedicineStatus.DISCONTINUED }, deletedBy);
        // Create version record
        await this.createVersion(canonicalId, medicine, 'DISCONTINUED', deletedBy);
        return medicine;
    }
    /**
     * Find by barcode
     * Requirements: 1.6
     */
    async findByBarcode(barcode) {
        return prisma_1.default.medicineMaster.findFirst({
            where: {
                OR: [
                    { primaryBarcode: barcode },
                    { alternativeBarcodes: { has: barcode } },
                ],
            },
        });
    }
    /**
     * Find by composition (salt)
     * Requirements: 1.4
     */
    async findByComposition(saltName) {
        return prisma_1.default.medicineMaster.findMany({
            where: {
                compositionText: {
                    contains: saltName,
                    mode: 'insensitive',
                },
            },
            include: {
                saltLinks: {
                    include: {
                        salt: true,
                    },
                },
            },
        });
    }
    /**
     * Find by manufacturer
     * Requirements: 1.6
     */
    async findByManufacturer(manufacturer) {
        return prisma_1.default.medicineMaster.findMany({
            where: {
                manufacturerName: {
                    contains: manufacturer,
                    mode: 'insensitive',
                },
            },
        });
    }
    /**
     * Create version record
     * Requirements: 8.1, 8.2
     */
    async createVersion(canonicalId, snapshot, changeType, changedBy) {
        await prisma_1.default.medicineVersion.create({
            data: {
                medicineId: canonicalId,
                versionNumber: await this.getNextVersionNumber(canonicalId),
                snapshotData: snapshot,
                changeType,
                changedBy,
                changedAt: new Date(),
            },
        });
    }
    /**
     * Get next version number
     */
    async getNextVersionNumber(canonicalId) {
        const latest = await prisma_1.default.medicineVersion.findFirst({
            where: { medicineId: canonicalId },
            orderBy: { versionNumber: 'desc' },
        });
        return (latest?.versionNumber || 0) + 1;
    }
    /**
     * Get version history
     * Requirements: 8.1, 8.2
     */
    async getVersionHistory(canonicalId) {
        return prisma_1.default.medicineVersion.findMany({
            where: { medicineId: canonicalId },
            orderBy: { versionNumber: 'desc' },
        });
    }
    /**
     * Rollback to previous version
     * Requirements: 8.4
     */
    async rollback(canonicalId, versionNumber, rolledBackBy) {
        const startTime = Date.now();
        try {
            // Get target version
            const version = await prisma_1.default.medicineVersion.findFirst({
                where: {
                    medicineId: canonicalId,
                    versionNumber,
                },
            });
            if (!version) {
                throw new errorHandler_1.NotFoundError(`Version ${versionNumber} for medicine ${canonicalId}`);
            }
            // Restore snapshot data
            const snapshot = version.snapshotData;
            const restored = await prisma_1.default.medicineMaster.update({
                where: { id: canonicalId },
                data: {
                    name: snapshot.name,
                    genericName: snapshot.genericName,
                    compositionText: snapshot.compositionText,
                    manufacturerName: snapshot.manufacturerName,
                    form: snapshot.form,
                    packSize: snapshot.packSize,
                    schedule: snapshot.schedule,
                    requiresPrescription: snapshot.requiresPrescription,
                    defaultGstRate: snapshot.defaultGstRate,
                    hsnCode: snapshot.hsnCode,
                    primaryBarcode: snapshot.primaryBarcode,
                    alternativeBarcodes: snapshot.alternativeBarcodes,
                    status: snapshot.status,
                    confidenceScore: snapshot.confidenceScore,
                    updatedAt: new Date(),
                },
            });
            // Create rollback version record
            await this.createVersion(canonicalId, restored, `ROLLBACK_TO_V${versionNumber}`, rolledBackBy);
            // Update search index
            await IndexManagementService_1.indexManagementService.indexMedicine(canonicalId);
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.info('Medicine rolled back', { canonicalId, versionNumber, rolledBackBy, duration });
            metrics_1.medicineMetrics.recordMedicineOperation('rollback', duration);
            return restored;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.medicineLogger.error('Failed to rollback medicine', { error, canonicalId, versionNumber, duration });
            throw error;
        }
    }
    /**
     * Bulk create medicines
     * Requirements: 9.2
     */
    async bulkCreate(inputs, createdBy) {
        let success = 0;
        let failed = 0;
        const errors = [];
        for (const input of inputs) {
            try {
                await this.create(input, createdBy);
                success++;
            }
            catch (error) {
                failed++;
                errors.push({
                    input,
                    error: error.message,
                });
            }
        }
        return { success, failed, errors };
    }
    /**
     * Bulk update medicines
     * Requirements: 9.2
     */
    async bulkUpdate(updates, updatedBy) {
        let success = 0;
        let failed = 0;
        const errors = [];
        for (const { canonicalId, input } of updates) {
            try {
                await this.update(canonicalId, input, updatedBy);
                success++;
            }
            catch (error) {
                failed++;
                errors.push({
                    canonicalId,
                    error: error.message,
                });
            }
        }
        return { success, failed, errors };
    }
    /**
     * Increment usage count
     */
    async incrementUsageCount(canonicalId) {
        await prisma_1.default.medicineMaster.update({
            where: { id: canonicalId },
            data: {
                usageCount: {
                    increment: 1,
                },
            },
        });
        // Update search index to reflect new usage count
        await IndexManagementService_1.indexManagementService.indexMedicine(canonicalId);
    }
}
exports.MedicineMasterService = MedicineMasterService;
// Export singleton instance
exports.medicineMasterService = new MedicineMasterService();
