import { scanApi, ScanProcessResponse } from '@/lib/api/scan';
import { fefoApi, FEFORecommendation } from '@/lib/api/fefo';
import { toast } from 'sonner';

/**
 * Enhanced POS Hook with Scan API Integration
 * Handles barcode scanning, FEFO recommendations, and deviation logging
 */

export interface BasketItem {
    id: string;
    drugId: string;
    batchId: string;
    name: string;
    batchNumber: string;
    qty: number;
    mrp: number;
    stock: number;
    expiryDate?: string;
    location?: string;
    gstRate: number;
    scanned?: boolean;
    scanMethod?: string;
    fefoOverride?: boolean;
    overrideReason?: string;
    [key: string]: any;
}

/**
 * Process barcode scan using the scan API
 */
export async function processBarcodeScan(barcode: string): Promise<ScanProcessResponse | null> {
    try {
        const batchData = await scanApi.processScan(barcode, 'SALE');
        toast.success(`Scanned: ${batchData.drugName}`);
        return batchData;
    } catch(error: any) {
        if (error.response?.status === 404) {
            toast.error('Barcode not recognized. Please enroll this barcode or enter manually.');
        } else {
            toast.error('Scan failed. Please try again or enter manually.');
        }
        return null;
    }
}

/**
 * Get FEFO recommendation for a drug
 */
export async function getFEFORecommendation(
    drugId: string,
    quantity: number
): Promise<FEFORecommendation | null> {
    try {
        const recommendation = await fefoApi.recommendBatch(drugId, quantity);
        return recommendation;
    } catch (error) {
        console.error('Failed to get FEFO recommendation:', error);
        toast.error('Could not load batch recommendations');
        return null;
    }
}

/**
 * Log FEFO deviation when user selects non-recommended batch
 */
export async function logFEFODeviation(
    saleId: string,
    drugId: string,
    recommendedBatchId: string,
    actualBatchId: string,
    reason?: string
) {
    try {
        await fefoApi.logDeviation({
            saleId,
            drugId,
            recommendedBatchId,
            actualBatchId,
            reason: reason || 'No reason provided'
        });
    } catch (error) {
        console.error('Failed to log FEFO deviation:', error);
        // Don't show error to user - this is background logging
    }
}

/**
 * Convert scanned batch data to basket item
 */
export function scanDataToBasketItem(scanData: ScanProcessResponse, quantity: number = 1): BasketItem {
    return {
        id: `${scanData.batchId}-${Date.now()}`,
        drugId: scanData.drugId,
        batchId: scanData.batchId,
        name: `${scanData.drugName}${scanData.strength ? ` ${scanData.strength}` : ''}${scanData.form ? ` ${scanData.form}` : ''}`,
        batchNumber: scanData.batchNumber,
        manufacturer: scanData.manufacturer,
        qty: quantity,
        mrp: scanData.mrp,
        stock: scanData.quantityInStock,
        totalStock: scanData.quantityInStock,
        expiryDate: scanData.expiryDate,
        location: scanData.location,
        gstRate: scanData.gstRate,
        scanned: true,
        scanMethod: 'BARCODE',
        fefoOverride: false,
    };
}

/**
 * Check if item was added via scan or manual entry
 */
export function wasItemScanned(item: BasketItem): boolean {
    return item.scanned === true && !!item.scanMethod;
}

/**
 * Track manual entry for behavioral detection
 */
export function trackManualEntry(item: BasketItem) {
    // This would be logged to the sale when completed
    // The backend will calculate behavioral metrics from this
    if (!wasItemScanned(item)) {
        console.log('[Behavioral] Manual entry detected for:', item.name);
    }
}
