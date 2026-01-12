const prisma = require('../../db/prisma');
const { Decimal } = require('@prisma/client/runtime/library');

/**
 * Service to handle Margin & Profitability logic.
 * Source of Truth: MarginLedger table.
 */

/**
 * Calculate and record margin for a finalized sale.
 * This is an immutable financial record.
 * 
 * @param {string} saleId 
 * @param {string} storeId 
 */
const calculateAndRecordSaleMargin = async (saleId, storeId) => {
    try {
        console.log(`[MarginService] Starting calculation for Sale: ${saleId}`);

        // 1. Fetch Sale with Items and Batch details (Cost Price is in Batch)
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: {
                items: {
                    include: {
                        batch: true,
                        drug: true
                    }
                }
            }
        });

        if (!sale) {
            throw new Error(`Sale not found: ${saleId}`);
        }

        const ledgerEntries = [];

        // 2. Process each item
        for (const item of sale.items) {
            // SKIP if item is a service or non-stock (if applicable)
            if (!item.batchId) continue;

            const quantity = new Decimal(item.quantity); // Sold quantity (units or strips)
            let costPerUnit = new Decimal(item.batch.purchasePrice || 0);
            let sellingPriceTotal = new Decimal(item.lineTotal); // Net Revenue (post-discount)
            const taxAmount = new Decimal(item.cgstAmount).plus(item.sgstAmount).plus(item.igstAmount).plus(item.cessAmount);

            // Normalize Revenue: Exclude Tax from Margin Calculation?
            // "Margin" is typically (Net Sales - COGS). Net Sales = Revenue - Tax.
            // saleItem.lineTotal in this system usually includes Tax if it's MRP based? 
            // Checking Schema: lineTotal seems to be final amount. taxableAmount is pre-tax.
            // Let's use taxableAmount for Net Sales to be safe and accurate for margin.

            let netRevenue = new Decimal(item.taxableAmount);

            // Handle Partial Strips for Cost
            // If item.isPartialSale is true, quantity is in tablets. 
            // Batch Purchase Price is usually per STRIP / PACK.
            // We need to derive cost per tablet.

            if (item.isPartialSale) {
                const tabletsPerStrip = item.batch.tabletsPerStrip || 10; // Fallback to 10 if missing safe
                const costPerStrip = costPerUnit;
                costPerUnit = costPerStrip.dividedBy(tabletsPerStrip);
            } else {
                // Whole sale. 
                // Check if unit match? Assuming quantity is in same unit as price (Pack/Strip)
            }

            const totalCost = costPerUnit.times(quantity);
            const marginAmount = netRevenue.minus(totalCost);

            let marginPercent = new Decimal(0);
            if (!netRevenue.isZero()) {
                marginPercent = marginAmount.dividedBy(netRevenue).times(100);
            }

            ledgerEntries.push({
                storeId: storeId,
                saleId: saleId,
                saleItemId: item.id,
                batchId: item.batchId,
                drugId: item.drugId,
                costPrice: costPerUnit, // per unit used in this sale
                sellingPrice: netRevenue.dividedBy(quantity), // net realization per unit
                taxAmount: taxAmount,
                quantity: quantity,
                totalCost: totalCost,
                totalRevenue: netRevenue,
                marginAmount: marginAmount,
                marginPercent: marginPercent,
                type: 'SALE',
                isProvisional: false, // Assumed final if Sale is completed
                finalizedAt: new Date(),
            });
        }

        // 3. Batch Insert into Ledger
        if (ledgerEntries.length > 0) {
            await prisma.marginLedger.createMany({
                data: ledgerEntries
            });
            console.log(`[MarginService] Recorded ${ledgerEntries.length} ledger entries for Sale: ${saleId}`);
        }

    } catch (error) {
        console.error(`[MarginService] Failed to record margin for Sale ${saleId}:`, error);
        // Do not block the sale flow, but log error for retry
    }
};

/**
 * Get aggregated margin for a specific sale (Sum of ledger entries)
 * @param {string} saleId 
 */
const getMarginForSale = async (saleId) => {
    const aggregations = await prisma.marginLedger.aggregate({
        where: { saleId: saleId },
        _sum: {
            marginAmount: true,
            totalRevenue: true,
            totalCost: true
        }
    });

    return {
        margin: aggregations._sum.marginAmount || new Decimal(0),
        revenue: aggregations._sum.totalRevenue || new Decimal(0),
        cost: aggregations._sum.totalCost || new Decimal(0)
    };
};

/**
 * Get aggregated margin stats for a period
 */
const getAggregatedMargin = async (storeId, startDate, endDate) => {
    const aggregations = await prisma.marginLedger.aggregate({
        where: {
            storeId: storeId,
            finalizedAt: {
                gte: startDate,
                lte: endDate
            }
        },
        _sum: {
            marginAmount: true,
            totalRevenue: true,
            totalCost: true
        }
    });

    return {
        totalMargin: aggregations._sum.marginAmount || 0,
        totalRevenue: aggregations._sum.totalRevenue || 0,
        totalCost: aggregations._sum.totalCost || 0,
        netMarginPercent: aggregations._sum.totalRevenue && aggregations._sum.totalRevenue > 0
            ? (aggregations._sum.marginAmount / aggregations._sum.totalRevenue) * 100
            : 0
    };
};

/**
 * Calculate provisional margin for a list of items (e.g. from POS basket).
 * Does NOT save to database.
 * @param {Array} items - List of items with batchId, quantity, price, discount
 * @returns {Promise<Object>} - Aggregated margin stats
 */
async function calculateProvisionalMargin(items) {
    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);

    for (const item of items) {
        // Fetch batch details for cost
        const batch = await prisma.inventoryBatch.findUnique({
            where: { id: item.batchId },
            include: { drug: true }
        });

        if (!batch) continue;

        // Calculate Cost Per Unit
        // Handle partial strips if applicable
        let costPerUnit = new Decimal(batch.purchasePrice);

        // If batch is a strip but item is sold as tablets (partial unit logic)
        // Note: item.conversionFactor should be passed from frontend if possible, 
        // effectively we need to know if we are selling base units or pack units.
        // For simplicity in provisional:
        // If batch.tabletsPerStrip > 1, assume purchasePrice is per strip.
        // We need to know if 'item.quantity' is in strips or tablets.
        // The frontend 'item' usually has 'unit' or 'conversionFactor'.

        // Use logic similar to calculateAndRecordSaleMargin but adapted for raw input
        const tabletsPerStrip = batch.tabletsPerStrip || 1;
        const conversionFactor = item.conversionFactor || 1; // 1 means same unit as batch (usually) or handled by frontend

        // Detailed Logic:
        // Batch Price is usually for the 'Pack' (e.g. Strip of 10).
        // If we are selling loose tablets, the quantity will be e.g. 5, and conversionFactor might be 1 (if UI handles it) 
        // OR quantity is 0.5 (if UI handles it as fraction of strip).
        // Let's rely on costPerUnit derivation:

        // If we're selling in base units (tablets) but purchased in packs (strips):
        if (item.isBaseUnit && tabletsPerStrip > 1) {
            costPerUnit = costPerUnit.div(tabletsPerStrip);
        } else if (conversionFactor > 1 && tabletsPerStrip > 1) {
            // Selling a strip, bought a strip. Cost is purchasePrice.
        }

        // To be safe and consistent with SaleService, let's look at how we handled partials there.
        // In marginService.calculateAndRecordSaleMargin, we checked saleItem.isPartialSale.

        // For Estimate: We'll calculate cost proportional to the fraction of the pack being sold.
        // The safest way: Calculate Cost of 1 BASE UNIT (tablet).
        // Then multiply by total BASE UNITS being sold.

        const costPerBaseUnit = new Decimal(batch.purchasePrice).div(tabletsPerStrip);

        // Total Base Units Sold:
        // If item.unit is 'Strip', quantity is 2 -> 2 * 10 = 20 base units.
        // If item.unit is 'Tablet', quantity is 5 -> 5 * 1 = 5 base units.

        const totalBaseUnits = new Decimal(item.qty).mul(conversionFactor > 1 ? conversionFactor : 1);

        // Wait, if conversionFactor is 1, it might be a Strip (if displayUnit == baseUnit).
        // Actually, let's simplify: 
        // Cost = (PurchasePrice / UnitSize) * QuantitySoldNormalized

        // If the item quantity is in 'Strips' (standard), cost is PurchasePrice * Qty.
        // If the item quantity is in 'Tablets' (partial), we need to normalize.
        // In the Basket, 'item.qty' is the user decision. 'item.conversionFactor' tells us relation to base.

        // Let's try:
        // Total Cost for Line = (Batch Purchase Price / Batch Size) * (Qty * Batch Size / Unit Size ???)

        // Simpler approach used in sales:
        // purchasePrice is for 1 'Unit' stored in InventoryBatch (usually a Strip).
        // If we sell 0.5 Strips, cost is purchasePrice * 0.5.
        // If we sell 2 Strips, cost is purchasePrice * 2.

        // If the frontend passes 'qty' properly normalized to the Batch's unit, we are good.
        // But frontend 'qty' might be in tablets.
        // Let's assume the frontend passes `unit` and we can infer.

        let quantityInBatchUnits = new Decimal(item.qty);

        // If selling in base unit (e.g. Tablet) but batch is in packs (Strip)
        if (item.unit !== batch.unit && item.unit === batch.baseUnit) {
            quantityInBatchUnits = quantityInBatchUnits.div(tabletsPerStrip);
        }

        const lineCost = new Decimal(batch.purchasePrice).mul(quantityInBatchUnits);

        // Revenue
        // We need tax-exclusive revenue for margin
        // Revenue = (Price * Qty) - Discount
        // Tax = Revenue * (GSTRate / 100) -> Wait, Price usually includes Tax in India (MRP).
        // NetSellingPrice = (Price - Discount) / (1 + GST/100)

        const sellingPrice = new Decimal(item.price || item.mrp); // unit price
        const discount = new Decimal(item.discount || 0); // total discount for line

        const grossRevenue = sellingPrice.mul(item.qty).minus(discount);

        const gstRate = new Decimal(item.gstRate || 0);
        const taxableAmount = grossRevenue.div(new Decimal(1).plus(gstRate.div(100)));

        totalCost = totalCost.plus(lineCost);
        totalRevenue = totalRevenue.plus(taxableAmount);
    }

    const marginAmount = totalRevenue.minus(totalCost);
    const marginPercent = totalRevenue.equals(0) ? new Decimal(0) : marginAmount.div(totalRevenue).mul(100);

    return {
        totalMargin: marginAmount.toNumber(),
        totalRevenue: totalRevenue.toNumber(),
        totalCost: totalCost.toNumber(),
        netMarginPercent: marginPercent.toNumber()
    };
}

module.exports = {
    calculateAndRecordSaleMargin,
    getMarginForSale,
    getAggregatedMargin,
    calculateProvisionalMargin
};
