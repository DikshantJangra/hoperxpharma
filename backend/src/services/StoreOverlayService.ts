/**
 * StoreOverlayService - Store-Specific Medicine Customizations
 * 
 * Handles store-specific overlays (pricing, inventory, custom fields) on top of medicine master.
 * Requirements: 2.1, 2.2, 2.4, 2.5
 */

import { PrismaClient } from '@prisma/client';
import { medicineMasterService } from './MedicineMasterService';

const prisma = new PrismaClient();

export interface SetOverlayInput {
  customMrp?: number;
  customDiscount?: number;
  customGstRate?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  internalQrCode?: string;
  customNotes?: string;
  isActive?: boolean;
}

export interface MergedMedicine {
  // Master fields
  canonicalId: string;
  name: string;
  genericName?: string;
  compositionText: string;
  manufacturerName: string;
  form: string;
  packSize: string;
  schedule?: string;
  requiresPrescription: boolean;
  status: string;
  defaultGstRate: number;
  hsnCode?: string;
  primaryBarcode?: string;
  alternateBarcodes: string[];
  confidenceScore: number;
  usageCount: number;
  
  // Overlay fields (store-specific)
  customMrp?: number;
  customDiscount?: number;
  customGstRate?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  internalQrCode?: string;
  customNotes?: string;
  isActive?: boolean;
  
  // Computed fields
  effectiveGstRate: number;
  hasOverlay: boolean;
}

export class StoreOverlayService {
  /**
   * Get overlay for a specific medicine in a store
   * Requirements: 2.1
   */
  async getOverlay(storeId: string, canonicalId: string): Promise<any | null> {
    return prisma.storeOverlay.findUnique({
      where: {
        storeId_canonicalId: {
          storeId,
          canonicalId,
        },
      },
    });
  }

  /**
   * Set or update overlay for a medicine in a store
   * Requirements: 2.2
   */
  async setOverlay(
    storeId: string,
    canonicalId: string,
    input: SetOverlayInput
  ): Promise<any> {
    // Verify medicine exists
    const medicine = await medicineMasterService.getById(canonicalId);
    if (!medicine) {
      throw new Error(`Medicine ${canonicalId} not found`);
    }

    // Upsert overlay
    return prisma.storeOverlay.upsert({
      where: {
        storeId_canonicalId: {
          storeId,
          canonicalId,
        },
      },
      create: {
        storeId,
        canonicalId,
        ...input,
      },
      update: {
        ...input,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Remove overlay for a medicine in a store
   * Requirements: 2.2
   */
  async removeOverlay(storeId: string, canonicalId: string): Promise<void> {
    await prisma.storeOverlay.delete({
      where: {
        storeId_canonicalId: {
          storeId,
          canonicalId,
        },
      },
    });
  }

  /**
   * Get overlays for multiple medicines in a store
   * Requirements: 2.1
   */
  async getOverlaysForStore(
    storeId: string,
    canonicalIds: string[]
  ): Promise<Map<string, any>> {
    const overlays = await prisma.storeOverlay.findMany({
      where: {
        storeId,
        canonicalId: {
          in: canonicalIds,
        },
      },
    });

    const map = new Map<string, any>();
    for (const overlay of overlays) {
      map.set(overlay.canonicalId, overlay);
    }

    return map;
  }

  /**
   * Get all overlays for a store (paginated)
   */
  async getAllOverlaysForStore(
    storeId: string,
    options: { skip?: number; take?: number } = {}
  ): Promise<any[]> {
    const { skip = 0, take = 100 } = options;

    return prisma.storeOverlay.findMany({
      where: { storeId },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get merged medicine (master + overlay)
   * Requirements: 2.4, 2.5
   */
  async getMergedMedicine(
    storeId: string,
    canonicalId: string
  ): Promise<MergedMedicine | null> {
    // Get master data
    const master = await medicineMasterService.getById(canonicalId);
    if (!master) {
      return null;
    }

    // Get overlay (may not exist)
    const overlay = await this.getOverlay(storeId, canonicalId);

    // Merge data
    return this.mergeMedicineData(master, overlay);
  }

  /**
   * Get merged medicines for multiple IDs
   * Requirements: 2.4
   */
  async getMergedMedicines(
    storeId: string,
    canonicalIds: string[]
  ): Promise<MergedMedicine[]> {
    // Get master data
    const masters = await medicineMasterService.getByIds(canonicalIds);

    // Get overlays
    const overlayMap = await this.getOverlaysForStore(storeId, canonicalIds);

    // Merge each medicine
    return masters.map((master) => {
      const overlay = overlayMap.get(master.id) || null;
      return this.mergeMedicineData(master, overlay);
    });
  }

  /**
   * Merge master and overlay data
   * Requirements: 2.4, 2.5
   */
  private mergeMedicineData(master: any, overlay: any | null): MergedMedicine {
    return {
      // Master fields
      canonicalId: master.id,
      name: master.name,
      genericName: master.genericName,
      compositionText: master.compositionText,
      manufacturerName: master.manufacturerName,
      form: master.form,
      packSize: master.packSize,
      schedule: master.schedule,
      requiresPrescription: master.requiresPrescription,
      status: master.status,
      defaultGstRate: parseFloat(master.defaultGstRate.toString()),
      hsnCode: master.hsnCode,
      primaryBarcode: master.primaryBarcode,
      alternateBarcodes: master.alternateBarcodes || [],
      confidenceScore: master.confidenceScore,
      usageCount: master.usageCount,

      // Overlay fields (null if no overlay)
      customMrp: overlay?.customMrp ? parseFloat(overlay.customMrp.toString()) : undefined,
      customDiscount: overlay?.customDiscount ? parseFloat(overlay.customDiscount.toString()) : undefined,
      customGstRate: overlay?.customGstRate ? parseFloat(overlay.customGstRate.toString()) : undefined,
      stockQuantity: overlay?.stockQuantity || undefined,
      reorderLevel: overlay?.reorderLevel || undefined,
      internalQrCode: overlay?.internalQrCode || undefined,
      customNotes: overlay?.customNotes || undefined,
      isActive: overlay?.isActive !== undefined ? overlay.isActive : true,

      // Computed fields
      effectiveGstRate: overlay?.customGstRate
        ? parseFloat(overlay.customGstRate.toString())
        : parseFloat(master.defaultGstRate.toString()),
      hasOverlay: overlay !== null,
    };
  }

  /**
   * Search medicines with store-specific data
   * Returns merged view of search results
   */
  async searchWithOverlays(
    storeId: string,
    searchResults: any[]
  ): Promise<MergedMedicine[]> {
    const canonicalIds = searchResults.map((r) => r.canonicalId);
    return this.getMergedMedicines(storeId, canonicalIds);
  }

  /**
   * Update stock quantity
   */
  async updateStock(
    storeId: string,
    canonicalId: string,
    quantity: number
  ): Promise<any> {
    return this.setOverlay(storeId, canonicalId, {
      stockQuantity: quantity,
    });
  }

  /**
   * Increment stock quantity
   */
  async incrementStock(
    storeId: string,
    canonicalId: string,
    amount: number
  ): Promise<any> {
    const overlay = await this.getOverlay(storeId, canonicalId);
    const currentStock = overlay?.stockQuantity || 0;

    return this.setOverlay(storeId, canonicalId, {
      stockQuantity: currentStock + amount,
    });
  }

  /**
   * Decrement stock quantity
   */
  async decrementStock(
    storeId: string,
    canonicalId: string,
    amount: number
  ): Promise<any> {
    const overlay = await this.getOverlay(storeId, canonicalId);
    const currentStock = overlay?.stockQuantity || 0;
    const newStock = Math.max(0, currentStock - amount);

    return this.setOverlay(storeId, canonicalId, {
      stockQuantity: newStock,
    });
  }

  /**
   * Get low stock medicines for a store
   */
  async getLowStockMedicines(storeId: string): Promise<MergedMedicine[]> {
    const overlays = await prisma.storeOverlay.findMany({
      where: {
        storeId,
        stockQuantity: {
          lte: prisma.storeOverlay.fields.reorderLevel,
        },
      },
    });

    const canonicalIds = overlays.map((o) => o.canonicalId);
    return this.getMergedMedicines(storeId, canonicalIds);
  }
}

// Export singleton instance
export const storeOverlayService = new StoreOverlayService();
