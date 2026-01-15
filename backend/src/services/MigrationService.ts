/**
 * MigrationService - Data Migration and Normalization
 * 
 * Handles migration from existing CSV/JSON data to the new medicine master system.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { PrismaClient } from '@prisma/client';
import { medicineMasterService, CreateMedicineInput } from './MedicineMasterService';
import { indexManagementService } from './IndexManagementService';
import * as fs from 'fs/promises';

const prisma = new PrismaClient();

export interface MigrationReport {
  totalRecords: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: Array<{ record: any; error: string }>;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface NormalizationResult {
  name: string;
  strength?: string;
  packSize?: string;
}

export class MigrationService {
  /**
   * Normalize medicine name
   * Requirements: 5.2
   */
  normalizeName(name: string): string {
    if (!name) return '';

    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Title case
  }

  /**
   * Normalize strength (dosage)
   * Requirements: 5.2
   */
  normalizeStrength(strength: string): string {
    if (!strength) return '';

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
  normalizePackSize(packSize: string): string {
    if (!packSize) return '';

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
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate similarity score (0-100)
   */
  private similarityScore(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 100 : ((maxLen - distance) / maxLen) * 100;
  }

  /**
   * Find potential duplicates
   * Requirements: 5.3
   */
  async findPotentialDuplicates(
    medicine: CreateMedicineInput,
    threshold: number = 85
  ): Promise<any[]> {
    // Search by similar name and manufacturer
    const candidates = await prisma.medicineMaster.findMany({
      where: {
        manufacturerName: {
          contains: medicine.manufacturerName,
          mode: 'insensitive',
        },
      },
    });

    const duplicates: any[] = [];

    for (const candidate of candidates) {
      const nameScore = this.similarityScore(medicine.name, candidate.name);
      const compositionScore = this.similarityScore(
        medicine.compositionText,
        candidate.compositionText
      );

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
  async mergeDuplicates(
    targetId: string,
    sourceIds: string[]
  ): Promise<void> {
    // Get target medicine
    const target = await medicineMasterService.getById(targetId);
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
      await medicineMasterService.softDelete(sourceId, 'migration-merge');
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
  async createIdMapping(oldId: string, newCanonicalId: string): Promise<void> {
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
  async lookupByOldId(oldId: string): Promise<string | null> {
    const mapping = await prisma.idMapping.findUnique({
      where: { oldId },
    });

    return mapping?.canonicalId || null;
  }

  /**
   * Import from JSON file
   * Requirements: 5.1, 5.2, 5.3
   */
  async importFromJson(
    filePath: string,
    options: {
      batchSize?: number;
      deduplicateThreshold?: number;
      skipDuplicates?: boolean;
    } = {}
  ): Promise<MigrationReport> {
    const {
      batchSize = 100,
      deduplicateThreshold = 85,
      skipDuplicates = true,
    } = options;

    const report: MigrationReport = {
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
            const normalized: CreateMedicineInput = {
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
              const duplicates = await this.findPotentialDuplicates(
                normalized,
                deduplicateThreshold
              );

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
            const created = await medicineMasterService.create(normalized, 'migration');

            // Create ID mapping if old ID exists
            if (record.id) {
              await this.createIdMapping(record.id, created.id);
            }

            report.imported++;
          } catch (error: any) {
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
      await indexManagementService.rebuildIndex();

      report.endTime = new Date();
      report.duration = report.endTime.getTime() - report.startTime.getTime();

      console.log('✅ Migration complete!');
      console.log(`   Imported: ${report.imported}`);
      console.log(`   Duplicates skipped: ${report.duplicates}`);
      console.log(`   Errors: ${report.errors}`);
      console.log(`   Duration: ${report.duration}ms`);

      return report;
    } catch (error: any) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Generate migration report
   * Requirements: 5.6
   */
  async generateReport(report: MigrationReport): Promise<string> {
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
  async normalizeRecord(record: any): Promise<CreateMedicineInput> {
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
  async importRecord(normalized: CreateMedicineInput): Promise<any> {
    return medicineMasterService.create(normalized, 'migration');
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
