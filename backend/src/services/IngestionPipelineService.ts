/**
 * IngestionPipelineService - New Medicine Ingestion and Promotion
 * 
 * Handles ingestion of new medicines from stores with instant availability and auto-promotion.
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { PrismaClient, PendingMedicineStatus, IngestionSource, Prisma } from '@prisma/client';
import { medicineMasterService, CreateMedicineInput } from './MedicineMasterService';
import { storeOverlayService } from './StoreOverlayService';

const prisma = new PrismaClient();

export interface IngestMedicineInput {
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
  source: IngestionSource;
  sourceMetadata?: any;
}

export interface IngestionResult {
  canonicalId: string;
  isNewMedicine: boolean;
  status: PendingMedicineStatus;
  confidenceScore: number;
  instantlyAvailable: boolean;
}

export class IngestionPipelineService {
  /**
   * Calculate confidence score based on data completeness
   * Requirements: 4.5
   */
  calculateConfidenceScore(input: IngestMedicineInput): number {
    let score = 0;
    const weights = {
      name: 15,
      genericName: 10,
      compositionText: 20,
      manufacturerName: 15,
      form: 10,
      packSize: 5,
      schedule: 5,
      hsnCode: 10,
      primaryBarcode: 10,
    };

    if (input.name && input.name.length > 3) score += weights.name;
    if (input.genericName) score += weights.genericName;
    if (input.compositionText && input.compositionText.length > 5) score += weights.compositionText;
    if (input.manufacturerName && input.manufacturerName.length > 2) score += weights.manufacturerName;
    if (input.form) score += weights.form;
    if (input.packSize) score += weights.packSize;
    if (input.schedule) score += weights.schedule;
    if (input.hsnCode) score += weights.hsnCode;
    if (input.primaryBarcode) score += weights.primaryBarcode;

    return Math.min(100, score);
  }

  /**
   * Validate medicine data quality
   * Requirements: 4.3, 4.4
   */
  validateMedicine(input: IngestMedicineInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.name || input.name.trim().length < 3) {
      errors.push('Name must be at least 3 characters');
    }

    if (!input.compositionText || input.compositionText.trim().length < 3) {
      errors.push('Composition text must be at least 3 characters');
    }

    if (!input.manufacturerName || input.manufacturerName.trim().length < 2) {
      errors.push('Manufacturer name must be at least 2 characters');
    }

    if (!input.form || input.form.trim().length === 0) {
      errors.push('Form is required');
    }

    if (!input.packSize || input.packSize.trim().length === 0) {
      errors.push('Pack size is required');
    }

    if (input.defaultGstRate < 0 || input.defaultGstRate > 28) {
      errors.push('GST rate must be between 0 and 28');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for duplicate medicines
   * Requirements: 4.4
   */
  async checkDuplicates(input: IngestMedicineInput): Promise<any[]> {
    // Check by barcode first (exact match)
    if (input.primaryBarcode) {
      const byBarcode = await medicineMasterService.findByBarcode(input.primaryBarcode);
      if (byBarcode) {
        return [byBarcode];
      }
    }

    // Check by name and manufacturer (fuzzy match)
    const byManufacturer = await medicineMasterService.findByManufacturer(
      input.manufacturerName
    );

    const duplicates = byManufacturer.filter((m) => {
      const nameSimilar = m.name.toLowerCase().includes(input.name.toLowerCase()) ||
                         input.name.toLowerCase().includes(m.name.toLowerCase());
      const compositionSimilar = m.compositionText.toLowerCase() === input.compositionText.toLowerCase();
      
      return nameSimilar && compositionSimilar;
    });

    return duplicates;
  }

  /**
   * Ingest a new medicine with instant availability
   * Requirements: 4.1
   */
  async ingest(
    storeId: string,
    input: IngestMedicineInput
  ): Promise<IngestionResult> {
    // Validate input
    const validation = this.validateMedicine(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for duplicates
    const duplicates = await this.checkDuplicates(input);
    if (duplicates.length > 0) {
      // Use existing medicine
      const existing = duplicates[0];
      
      // Increment usage count
      await medicineMasterService.incrementUsageCount(existing.id);

      // Create audit trail
      await this.createAuditTrail(storeId, existing.id, input.source, 'DUPLICATE_FOUND');

      return {
        canonicalId: existing.id,
        isNewMedicine: false,
        status: PendingMedicineStatus.APPROVED,
        confidenceScore: existing.confidenceScore,
        instantlyAvailable: true,
      };
    }

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(input);

    // Create pending medicine entry with submittedData as JSON
    const submittedData = {
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
    };

    const pending = await prisma.pendingMedicine.create({
      data: {
        submittedData: submittedData as Prisma.JsonObject,
        source: input.source,
        sourceStoreId: storeId,
        usedByStoreIds: [storeId],
        confidenceScore,
        dataCompletenessScore: confidenceScore,
        status: PendingMedicineStatus.PENDING,
      },
    });

    // Create medicine master immediately (instant availability)
    const medicine = await medicineMasterService.create({
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
      alternativeBarcodes: input.alternativeBarcodes,
      confidenceScore,
    }, storeId);

    // Link pending medicine to master
    await prisma.pendingMedicine.update({
      where: { id: pending.id },
      data: { resolvedCanonicalId: medicine.id },
    });

    // Create audit trail
    await this.createAuditTrail(storeId, medicine.id, input.source, 'INGESTED');

    // Check for auto-promotion
    await this.checkPromotionEligibility(medicine.id);

    return {
      canonicalId: medicine.id,
      isNewMedicine: true,
      status: PendingMedicineStatus.PENDING,
      confidenceScore,
      instantlyAvailable: true,
    };
  }

  /**
   * Bulk ingest medicines
   * Requirements: 4.1
   */
  async bulkIngest(
    storeId: string,
    inputs: IngestMedicineInput[]
  ): Promise<{ success: number; failed: number; results: IngestionResult[] }> {
    let success = 0;
    let failed = 0;
    const results: IngestionResult[] = [];

    for (const input of inputs) {
      try {
        const result = await this.ingest(storeId, input);
        results.push(result);
        success++;
      } catch (error) {
        failed++;
        console.error('Ingestion failed:', error);
      }
    }

    return { success, failed, results };
  }

  /**
   * Check if medicine is eligible for promotion to VERIFIED
   * Requirements: 4.6
   */
  async checkPromotionEligibility(canonicalId: string): Promise<boolean> {
    const medicine = await medicineMasterService.getById(canonicalId);
    if (!medicine) return false;

    // Get pending medicine record
    const pending = await prisma.pendingMedicine.findFirst({
      where: { resolvedCanonicalId: canonicalId },
    });

    if (!pending) return false;

    // Promotion criteria: confidence >= 80 AND usedByStoreIds.length >= 3
    const usedByStoreCount = pending.usedByStoreIds.length;
    const eligible = medicine.confidenceScore >= 80 && usedByStoreCount >= 3;

    if (eligible) {
      await this.promoteToVerified(canonicalId);
      return true;
    }

    return false;
  }

  /**
   * Promote medicine to VERIFIED status
   * Requirements: 4.6
   */
  async promoteToVerified(canonicalId: string): Promise<void> {
    // Update medicine status
    await medicineMasterService.update(
      canonicalId,
      { status: 'VERIFIED' as any },
      'auto-promotion'
    );

    // Update pending medicine status
    await prisma.pendingMedicine.updateMany({
      where: { resolvedCanonicalId: canonicalId },
      data: { status: PendingMedicineStatus.APPROVED },
    });

    // Create audit trail
    await this.createAuditTrail('system', canonicalId, 'SYSTEM' as any, 'AUTO_PROMOTED');

    console.log(`✅ Medicine ${canonicalId} auto-promoted to VERIFIED`);
  }

  /**
   * Increment usage count for a medicine (when another store uses it)
   */
  async incrementUsage(canonicalId: string, storeId: string): Promise<void> {
    // Increment in medicine master
    await medicineMasterService.incrementUsageCount(canonicalId);

    // Add store to usedByStoreIds if not already present
    const pending = await prisma.pendingMedicine.findFirst({
      where: { resolvedCanonicalId: canonicalId },
    });

    if (pending && !pending.usedByStoreIds.includes(storeId)) {
      await prisma.pendingMedicine.update({
        where: { id: pending.id },
        data: {
          usedByStoreIds: {
            push: storeId,
          },
        },
      });
    }

    // Check for promotion
    await this.checkPromotionEligibility(canonicalId);

    // Create audit trail
    await this.createAuditTrail(storeId, canonicalId, 'SYSTEM' as any, 'USAGE_INCREMENTED');
  }

  /**
   * Create audit trail for ingestion events
   * Requirements: 4.7
   */
  private async createAuditTrail(
    storeId: string,
    canonicalId: string,
    source: IngestionSource,
    eventType: string
  ): Promise<void> {
    // In a real implementation, this would write to an audit log table
    console.log(`[AUDIT] ${eventType} - Store: ${storeId}, Medicine: ${canonicalId}, Source: ${source}`);
  }

  /**
   * Get pending medicines for review
   */
  async getPendingMedicines(
    options: { skip?: number; take?: number; status?: PendingMedicineStatus } = {}
  ): Promise<any[]> {
    const { skip = 0, take = 50, status } = options;

    return prisma.pendingMedicine.findMany({
      where: status ? { status } : undefined,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<any> {
    const total = await prisma.pendingMedicine.count();
    const pending = await prisma.pendingMedicine.count({
      where: { status: PendingMedicineStatus.PENDING },
    });
    const approved = await prisma.pendingMedicine.count({
      where: { status: PendingMedicineStatus.APPROVED },
    });
    const rejected = await prisma.pendingMedicine.count({
      where: { status: PendingMedicineStatus.REJECTED },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
    };
  }
}

// Export singleton instance
export const ingestionPipelineService = new IngestionPipelineService();
