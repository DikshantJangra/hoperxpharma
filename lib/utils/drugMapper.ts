/**
 * Maps drug data from API to StockDetailPanel format
 */
export function mapDrugToDetailPanel(drug: any) {
    if (!drug) return null;

    const inventory = drug.inventory || [];
    const totalStock = inventory.reduce((sum: number, batch: any) => sum + (batch.quantityInStock || 0), 0);

    return {
        id: drug.id,
        name: drug.name,
        generic: drug.genericName || 'N/A',
        sku: drug.id,
        hsn: drug.hsnCode || 'N/A',
        coldChain: false, // Field doesn't exist in Drug schema
        onHand: totalStock,
        available: totalStock, // TODO: Subtract reserved quantities
        reorderPoint: drug.lowStockThreshold || 10,
        avgUsage: 0, // TODO: Calculate from stock movements
        supplier: inventory[0]?.supplierId ? `Supplier ${inventory[0].supplierId.slice(-6)}` : 'N/A',
        batchCount: inventory.length,
        batches: inventory.map((batch: any) => {
            const daysToExpiry = Math.floor(
                (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                id: batch.id, // Database ID (cuid) - needed for API calls
                batchNumber: batch.batchNumber, // Batch number for display
                qty: batch.quantityInStock,
                expiry: new Date(batch.expiryDate).toLocaleDateString(),
                daysToExpiry,
                location: batch.location || 'N/A',
                cost: Number(batch.purchasePrice),
                mrp: Number(batch.mrp)
            };
        })
    };
}
