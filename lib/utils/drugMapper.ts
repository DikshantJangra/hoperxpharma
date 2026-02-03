/**
 * Maps drug data from API to StockDetailPanel format
 */
export function mapDrugToDetailPanel(drug: any) {
    if (!drug) return null;

    const inventory = drug.inventory || [];
    const totalStock = inventory.reduce((sum: number, batch: any) => sum + (Number(batch.baseUnitQuantity) || 0), 0);

    // Calculate avgUsage from SALE/DISPENSE movements over last 90 days
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let totalSold = 0;
    let oldestMovementDate = now;

    inventory.forEach((batch: any) => {
        (batch.movements || []).forEach((m: any) => {
            const movementDate = new Date(m.createdAt);
            // Count negative movements (sales, dispenses, adjustments out)
            if (m.movementType === 'SALE' || m.movementType === 'DISPENSE' ||
                (m.movementType === 'ADJUSTMENT' && m.quantity < 0)) {
                totalSold += Math.abs(Number(m.baseUnitQuantity) || Math.abs(m.quantity));
            }
            if (movementDate < oldestMovementDate) {
                oldestMovementDate = movementDate;
            }
        });
    });

    // Calculate months of data (min 1 to avoid division by zero, max based on oldest movement)
    const daysSinceOldest = Math.max(1, (now.getTime() - oldestMovementDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsOfData = Math.max(1, daysSinceOldest / 30);
    const avgUsage = Math.round(totalSold / monthsOfData);

    return {
        id: drug.id,
        name: drug.name,
        generic: drug.genericName || null,
        manufacturer: drug.manufacturer || null,
        sku: drug.id,
        hsn: drug.hsnCode || 'N/A',
        gstRate: drug.gstRate || 0,
        baseUnit: drug.baseUnit,
        displayUnit: drug.displayUnit,
        coldChain: false, // Field doesn't exist in Drug schema
        onHand: totalStock,
        available: totalStock, // TODO: Subtract reserved quantities
        reorderPoint: drug.lowStockThreshold || 10,
        avgUsage, // Calculated from stock movements
        batchCount: inventory.length,
        batches: inventory.map((batch: any) => {
            const daysToExpiry = Math.floor(
                (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                id: batch.id, // Database ID (cuid) - needed for API calls
                batchNumber: batch.batchNumber, // Batch number for display
                qty: Number(batch.baseUnitQuantity),
                expiry: new Date(batch.expiryDate).toLocaleDateString(),
                daysToExpiry,
                location: batch.location || 'N/A',
                cost: Number(batch.purchasePrice),
                mrp: Number(batch.mrp)
            };
        })
    };
}
