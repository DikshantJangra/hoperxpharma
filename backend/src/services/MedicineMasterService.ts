/**
 * MedicineMasterService - Core Medicine Master Operations
 * 
 * Handles CRUD operations, versioning, and bulk operations for the medicine master database.
 * Requirements: 1.1, 1.2, 1.4, 1.6, 8.1, 8.2, 9.2
 */

import { MedicineStatus, Prisma } from '@prisma/client';
import { indexManagementService } from './IndexManagementService';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { medicineLogger } from '../lib/logger';
import { NotFoundError, ConflictError, ValidationError } from '../middlewares/errorHandler';
import { medicineMetrics } from '../lib/metrics';

export interface CreateMedicineInput {
  name: string;
  genericName?: string;
  compositionText: string;
  manufacturerName: string;
  form: string;
  packSize: string;
  schedule?: string;
  requiresPrescription: boolean;
  defaultGstRate: number;
  hsnCode?: string;
  primaryBarcode?: string;
  alternativeBarcodes?: string[];
  status?: MedicineStatus;
  confidenceScore?: number;
}

export interface UpdateMedicineInput {
  name?: string;
  genericName?: string;
  compositionText?: string;
  manufacturerName?: string;
  form?: string;
  packSize?: string;
  schedule?: string;
  requiresPrescription?: boolean;
  defaultGstRate?: number;
  hsnCode?: string;
  primaryBarcode?: string;
  alternativeBarcodes?: string[];
  status?: MedicineStatus;
  confidenceScore?: number;
}

export class MedicineMasterService {
  /**
   * Generate canonical ID from medicine attributes
   * Format: {manufacturer-slug}-{name-slug}-{form-slug}-{strength-slug}
   * Requirements: 1.2
   */
  private generateCanonicalId(input: CreateMedicineInput): string {
    const slugify = (text: string) =>
      text
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
    const hash = crypto
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
  async create(input: CreateMedicineInput, createdBy?: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Generate canonical ID
      const canonicalId = this.generateCanonicalId(input);

      // Check if already exists
      const existing = await prisma.medicineMaster.findUnique({
        where: { id: canonicalId },
      });

      if (existing) {
        throw new ConflictError(`Medicine with ID ${canonicalId} already exists`);
      }

      // Create medicine
      const medicine = await prisma.medicineMaster.create({
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
          status: input.status || MedicineStatus.PENDING,
          confidenceScore: input.confidenceScore || 50,
          usageCount: 0,
          createdBy,
        },
      });

      // Create initial version
      await this.createVersion(canonicalId, medicine, 'CREATED', createdBy);

      // Index in Typesense
      await indexManagementService.indexMedicine(canonicalId);

      // Log and track metrics
      const duration = Date.now() - startTime;
      medicineLogger.info('Medicine created', { canonicalId, createdBy, duration });
      medicineMetrics.recordMedicineOperation('create', duration);
      medicineMetrics.incrementMedicineCount();

      return medicine;
    } catch (error) {
      const duration = Date.now() - startTime;
      medicineLogger.error('Failed to create medicine', { error, input, duration });
      throw error;
    }
  }

  /**
   * Get medicine by canonical ID
   * Requirements: 1.4
   */
  async getById(canonicalId: string): Promise<any | null> {
    const startTime = Date.now();
    
    try {
      const medicine = await prisma.medicineMaster.findUnique({
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
      medicineMetrics.recordMedicineOperation('getById', duration);

      return medicine;
    } catch (error) {
      medicineLogger.error('Failed to get medicine by ID', { error, canonicalId });
      throw error;
    }
  }

  /**
   * Get multiple medicines by IDs
   * Requirements: 1.4
   */
  async getByIds(canonicalIds: string[]): Promise<any[]> {
    return prisma.medicineMaster.findMany({
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
  async update(
    canonicalId: string,
    input: UpdateMedicineInput,
    updatedBy?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get current medicine
      const current = await this.getById(canonicalId);
      if (!current) {
        throw new NotFoundError(`Medicine ${canonicalId}`);
      }

      // Update medicine
      const updated = await prisma.medicineMaster.update({
        where: { id: canonicalId },
        data: {
          ...input,
          updatedAt: new Date(),
        },
      });

      // Create version record
      await this.createVersion(canonicalId, updated, 'UPDATED', updatedBy);

      // Update search index
      await indexManagementService.indexMedicine(canonicalId);

      const duration = Date.now() - startTime;
      medicineLogger.info('Medicine updated', { canonicalId, updatedBy, duration });
      medicineMetrics.recordMedicineOperation('update', duration);

      return updated;
    } catch (error) {
      const duration = Date.now() - startTime;
      medicineLogger.error('Failed to update medicine', { error, canonicalId, duration });
      throw error;
    }
  }

  /**
   * Soft delete medicine
   * Requirements: 8.1
   */
  async softDelete(canonicalId: string, deletedBy?: string): Promise<any> {
    const medicine = await this.update(
      canonicalId,
      { status: MedicineStatus.DISCONTINUED },
      deletedBy
    );

    // Create version record
    await this.createVersion(canonicalId, medicine, 'DISCONTINUED', deletedBy);

    return medicine;
  }

  /**
   * Find by barcode
   * Requirements: 1.6
   */
  async findByBarcode(barcode: string): Promise<any | null> {
    return prisma.medicineMaster.findFirst({
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
  async findByComposition(saltName: string): Promise<any[]> {
    return prisma.medicineMaster.findMany({
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
  async findByManufacturer(manufacturer: string): Promise<any[]> {
    return prisma.medicineMaster.findMany({
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
  private async createVersion(
    canonicalId: string,
    snapshot: any,
    changeType: string,
    changedBy?: string
  ): Promise<void> {
    await prisma.medicineVersion.create({
      data: {
        medicineId: canonicalId,
        versionNumber: await this.getNextVersionNumber(canonicalId),
        snapshotData: snapshot as Prisma.JsonObject,
        changeType,
        changedBy,
        changedAt: new Date(),
      },
    });
  }

  /**
   * Get next version number
   */
  private async getNextVersionNumber(canonicalId: string): Promise<number> {
    const latest = await prisma.medicineVersion.findFirst({
      where: { medicineId: canonicalId },
      orderBy: { versionNumber: 'desc' },
    });

    return (latest?.versionNumber || 0) + 1;
  }

  /**
   * Get version history
   * Requirements: 8.1, 8.2
   */
  async getVersionHistory(canonicalId: string): Promise<any[]> {
    return prisma.medicineVersion.findMany({
      where: { medicineId: canonicalId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  /**
   * Rollback to previous version
   * Requirements: 8.4
   */
  async rollback(
    canonicalId: string,
    versionNumber: number,
    rolledBackBy?: string
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get target version
      const version = await prisma.medicineVersion.findFirst({
        where: {
          medicineId: canonicalId,
          versionNumber,
        },
      });

      if (!version) {
        throw new NotFoundError(`Version ${versionNumber} for medicine ${canonicalId}`);
      }

      // Restore snapshot data
      const snapshot = version.snapshotData as any;
      const restored = await prisma.medicineMaster.update({
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
      await this.createVersion(
        canonicalId,
        restored,
        `ROLLBACK_TO_V${versionNumber}`,
        rolledBackBy
      );

      // Update search index
      await indexManagementService.indexMedicine(canonicalId);

      const duration = Date.now() - startTime;
      medicineLogger.info('Medicine rolled back', { canonicalId, versionNumber, rolledBackBy, duration });
      medicineMetrics.recordMedicineOperation('rollback', duration);

      return restored;
    } catch (error) {
      const duration = Date.now() - startTime;
      medicineLogger.error('Failed to rollback medicine', { error, canonicalId, versionNumber, duration });
      throw error;
    }
  }

  /**
   * Bulk create medicines
   * Requirements: 9.2
   */
  async bulkCreate(
    inputs: CreateMedicineInput[],
    createdBy?: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const input of inputs) {
      try {
        await this.create(input, createdBy);
        success++;
      } catch (error: any) {
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
  async bulkUpdate(
    updates: Array<{ canonicalId: string; input: UpdateMedicineInput }>,
    updatedBy?: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const { canonicalId, input } of updates) {
      try {
        await this.update(canonicalId, input, updatedBy);
        success++;
      } catch (error: any) {
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
  async incrementUsageCount(canonicalId: string): Promise<void> {
    await prisma.medicineMaster.update({
      where: { id: canonicalId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Update search index to reflect new usage count
    await indexManagementService.indexMedicine(canonicalId);
  }
}

// Export singleton instance
export const medicineMasterService = new MedicineMasterService();
