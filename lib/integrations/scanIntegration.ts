/**
 * Enhanced ProductSearch with Scan API Integration
 * Add this to the existing ProductSearch component's onManualScan handler
 */

import { processBarcodecan } from '@/lib/hooks/usePOSScan';
import { scanDataToBasketItem } from '@/lib/hooks/usePOSScan';

// Example enhancement for the ProductSearch component's onManualScan prop:

export async function handleBarcodeScanned(
    barcode: string,
    onAddProduct: (product: any) => void
) {
    // Call the scan API
    const scannedData = await processBarcodecan(barcode);

    if (scannedData) {
        // Convert to basket item format
        const basketItem = scanDataToBasketItem(scannedData, 1);

        // Add to basket - this will trigger FEFO check
        onAddProduct(basketItem);
    } else {
        // Barcode not found - allow manual search
        // The existing search functionality will handle this
    }
}

// Usage in ProductSearch component:
// <ProductSearch 
//   onManualScan={async (barcode) => await handleBarcodeScanned(barcode, onAddProduct)}
//   ...
// />
