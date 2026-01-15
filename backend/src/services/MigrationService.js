"use strict";
/**
 * MigrationService - Data Migration and Normalization
 *
 * Handles migration from existing CSV/JSON data to the new medicine master system.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationService = exports.MigrationService = void 0;
const client_1 = require("@prisma/client");
const MedicineMasterService_1 = require("./MedicineMasterService");
const IndexManagementService_1 = require("./IndexManagementService");
const fs = __importStar(require("fs/promises"));
const prisma = new client_1.PrismaClient();
class MigrationService {
    /**
     * Normalize medicine name
     * Requirements: 5.2
     */
    normalizeName(name) {
        if (!name)
            return '';
        return name
            .trim()
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .replace(/\b\w/g, (char) => char.toUpperCase()); // Title case
    }
    /**
     * Normalize strength (dosage)
     * Requirements: 5.2
     */
    normalizeStrength(strength) {
        if (!strength)
            return '';
        return strength
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/milligram/gi, 'mg')
            .replace(/microgram/gi, 'mcg')
            .replace(/gram/gi, 'g')
            .replace(/milliliter/gi, 'ml')
            .replace(/liter/gi, 'l')
            .replace(/international\s*unit/gi, 'IU')
            .replace(/unit/gi, 'U');
    }
    /**
     * Normalize pack size
     * Requirements: 5.2
     */
    normalizePackSize(packSize) {
        if (!packSize)
            return '';
        return packSize
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/tablet/gi, 'tablets')
            .replace(/capsule/gi, 'capsules')
            .replace(/bottle/gi, 'bottles')
            .replace(/strip/gi, 'strips');
    }
    /**
     * Calculate Levenshtein distance for fuzzy matching
     */
    levenshteinDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = [];
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
            }
        }
        return matrix[len1][len2];
    }
    /**
     * Calculate similarity score (0-100)
     */
    similarityScore(str1, str2) {
        const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
        const maxLen = Math.max(str1.length, str2.length);
        return maxLen === 0 ? 100 : ((maxLen - distance) / maxLen) * 100;
    }
    /**
     * Find potential duplicates
     * Requirements: 5.3
     */
    async findPotentialDuplicates(medicine, threshold = 85) {
        // Search by similar name and manufacturer
        const candidates = await prisma.medicineMaster.findMany({
            where: {
                manufacturerName: {
                    contains: medicine.manufacturerName,
                    mode: 'insensitive',
                },
            },
        });
        const duplicates = [];
        for (const candidate of candidates) {
            const nameScore = this.similarityScore(medicine.name, candidate.name);
            const compositionScore = this.similarityScore(medicine.compositionText, candidate.compositionText);
            // Consider duplicate if name and composition are similar
            if (nameScore >= threshold && compositionScore >= threshold) {
                duplicates.push({
                    medicine: candidate,
                    nameScore,
                    compositionScore,
                    overallScore: (nameScore + compositionScore) / 2,
                });
            }
        }
        return duplicates.sort((a, b) => b.overallScore - a.overallScore);
    }
    /**
     * Merge duplicate records
     * Requirements: 5.3
     */
    async mergeDuplicates(targetId, sourceIds) {
        // Get target medicine
        const target = await MedicineMasterService_1.medicineMasterService.getById(targetId);
        if (!target) {
            throw new Error(`Target medicine ${targetId} not found`);
        }
        for (const sourceId of sourceIds) {
            // Create ID mapping for backward compatibility
            await this.createIdMapping(sourceId, targetId);
            // Update overlays to point to target
            await prisma.storeOverlay.updateMany({
                where: { canonicalId: sourceId },
                data: { canonicalId: targetId },
            });
            // Soft delete source
            await MedicineMasterService_1.medicineMasterService.softDelete(sourceId, 'migration-merge');
        }
        // Increment usage count on target
        await prisma.medicineMaster.update({
            where: { id: targetId },
            data: {
                usageCount: {
                    increment: sourceIds.length,
                },
            },
        });
    }
    /**
     * Create ID mapping for backward compatibility
     * Requirements: 5.4, 5.5
     */
    async createIdMapping(oldId, newCanonicalId) {
        await prisma.idMapping.upsert({
            where: { oldId },
            create: {
                oldId,
                canonicalId: newCanonicalId,
                source: 'MIGRATION',
            },
            update: {
                canonicalId: newCanonicalId,
            },
        });
    }
    /**
     * Lookup by old ID
     * Requirements: 5.4, 5.5
     */
    async lookupByOldId(oldId) {
        const mapping = await prisma.idMapping.findUnique({
            where: { oldId },
        });
        return mapping?.canonicalId || null;
    }
    /**
     * Import from JSON file
     * Requirements: 5.1, 5.2, 5.3
     */
    async importFromJson(filePath, options = {}) {
        const { batchSize = 100, deduplicateThreshold = 85, skipDuplicates = true, } = options;
        const report = {
            totalRecords: 0,
            imported: 0,
            duplicates: 0,
            errors: 0,
            errorDetails: [],
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
        };
        try {
            // Read JSON file
            const content = await fs.readFile(filePath, 'utf-8');
            const records = JSON.parse(content);
            report.totalRecords = records.length;
            console.log(`📦 Starting migration of ${records.length} records...`);
            // Process in batches
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                for (const record of batch) {
                    try {
                        // Normalize data
                        const normalized = {
                            name: this.normalizeName(record.name || record.medicineName),
                            genericName: record.genericName,
                            compositionText: record.composition || record.compositionText || '',
                            manufacturerName: this.normalizeName(record.manufacturer || record.manufacturerName || 'Unknown'),
                            form: record.form || record.dosageForm || 'Tablet',
                            packSize: this.normalizePackSize(record.packSize || '10 units'),
                            schedule: record.schedule,
                            requiresPrescription: record.requiresPrescription || false,
                            defaultGstRate: parseFloat(record.gstRate || record.defaultGstRate || '12'),
                            hsnCode: record.hsnCode,
                            primaryBarcode: record.barcode || record.primaryBarcode,
                            confidenceScore: 70, // Migrated data starts at 70
                        };
                        // Check for duplicates
                        if (skipDuplicates) {
                            const duplicates = await this.findPotentialDuplicates(normalized, deduplicateThreshold);
                            if (duplicates.length > 0) {
                                report.duplicates++;
                                // Create ID mapping if old ID exists
                                if (record.id) {
                                    await this.createIdMapping(record.id, duplicates[0].medicine.id);
                                }
                                continue;
                            }
                        }
                        // Create medicine
                        const created = await MedicineMasterService_1.medicineMasterService.create(normalized, 'migration');
                        // Create ID mapping if old ID exists
                        if (record.id) {
                            await this.createIdMapping(record.id, created.id);
                        }
                        report.imported++;
                    }
                    catch (error) {
                        report.errors++;
                        report.errorDetails.push({
                            record,
                            error: error.message,
                        });
                    }
                }
                console.log(`Progress: ${Math.min(i + batchSize, records.length)}/${records.length}`);
            }
            // Rebuild search index
            console.log('🔄 Rebuilding search index...');
            await IndexManagementService_1.indexManagementService.rebuildIndex();
            report.endTime = new Date();
            report.duration = report.endTime.getTime() - report.startTime.getTime();
            console.log('✅ Migration complete!');
            console.log(`   Imported: ${report.imported}`);
            console.log(`   Duplicates skipped: ${report.duplicates}`);
            console.log(`   Errors: ${report.errors}`);
            console.log(`   Duration: ${report.duration}ms`);
            return report;
        }
        catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    }
    /**
     * Generate migration report
     * Requirements: 5.6
     */
    async generateReport(report) {
        const lines = [
            '# Migration Report',
            '',
            `**Start Time:** ${report.startTime.toISOString()}`,
            `**End Time:** ${report.endTime.toISOString()}`,
            `**Duration:** ${(report.duration / 1000).toFixed(2)}s`,
            '',
            '## Summary',
            '',
            `- Total Records: ${report.totalRecords}`,
            `- Successfully Imported: ${report.imported}`,
            `- Duplicates Skipped: ${report.duplicates}`,
            `- Errors: ${report.errors}`,
            `- Success Rate: ${((report.imported / report.totalRecords) * 100).toFixed(2)}%`,
            '',
        ];
        if (report.errorDetails.length > 0) {
            lines.push('## Errors', '');
            for (const error of report.errorDetails.slice(0, 100)) {
                lines.push(`- ${error.record.name || 'Unknown'}: ${error.error}`);
            }
            if (report.errorDetails.length > 100) {
                lines.push(`- ... and ${report.errorDetails.length - 100} more errors`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Normalize a raw record from CSV/JSON
     * Requirements: 5.2
     */
    async normalizeRecord(record) {
        return {
            name: this.normalizeName(record.name || record.medicineName || ''),
            genericName: record.genericName,
            compositionText: record.composition || record.compositionText || '',
            manufacturerName: this.normalizeName(record.manufacturer || record.manufacturerName || 'Unknown'),
            form: record.form || record.dosageForm || 'Tablet',
            packSize: this.normalizePackSize(record.packSize || '10 units'),
            schedule: record.schedule,
            requiresPrescription: record.requiresPrescription || false,
            defaultGstRate: parseFloat(record.gstRate || record.defaultGstRate || '12'),
            hsnCode: record.hsnCode,
            primaryBarcode: record.barcode || record.primaryBarcode,
            confidenceScore: 70, // Migrated data starts at 70
        };
    }
    /**
     * Import a single normalized record
     * Requirements: 5.1
     */
    async importRecord(normalized) {
        return MedicineMasterService_1.medicineMasterService.create(normalized, 'migration');
    }
}
exports.MigrationService = MigrationService;
// Export singleton instance
exports.migrationService = new MigrationService();
