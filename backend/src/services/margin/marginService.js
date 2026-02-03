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
 * 
 * CRITICAL ASSUMPTIONS:
 * - item.price is the price PER SOLD UNIT (e.g. if selling "Tablet", price is per tablet = ₹2)
 * - item.qty is the quantity IN THE SOLD UNIT (e.g. "5" tablets)
 * - batch.purchasePrice is per BATCH/PACK UNIT (e.g. per Strip = ₹78)
 * - tabletsPerStrip tells us how many BASE units are in one BATCH unit (e.g. 10 tablets per strip)
 * 
 * Example:
 * - Selling: 1 Tablet at ₹2/tablet
 * - Batch: Strip costs ₹78, contains 10 tablets
 * - Revenue = 1 × ₹2 = ₹2
 * - Cost = (₹78 / 10) × 1 = ₹7.8
 * - Margin = ₹2 - ₹7.8 = -₹5.8 (LOSS)
 * 
 * @param {Array} items - List of items with { batchId, qty, unit, price, discount, gstRate, conversionFactor }
 * @returns {Promise<Object>} - { totalMargin, totalRevenue, totalCost, netMarginPercent }
 */
async function calculateProvisionalMargin(items) {
    console.log('\n🔍 [MARGIN-BACKEND] Starting calculation for', items.length, 'items');
    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);

    for (const item of items) {
        try {
            if (!item.batchId) {
                console.error(`[Margin] ❌ CRITICAL: Item without batchId:`, item.name);
                continue;
            }

            console.log(`\n=== Processing: ${item.name} (${item.batchId}) ===`);
            console.log('Input:', { qty: item.qty, price: item.price, mrp: item.mrp, discount: item.discount, unit: item.unit });

            const batch = await prisma.inventoryBatch.findUnique({
                where: { id: item.batchId },
                include: { drug: true }
            });

            if (!batch) {
                console.warn(`[Margin] Batch ${item.batchId} not found`);
                continue;
            }

            console.log(`📦 [BATCH-DATA] ${item.name}:`, {
                batchId: batch.id,
                purchasePrice: batch.purchasePrice,
                mrp: batch.mrp,
                tabletsPerStrip: batch.tabletsPerStrip,
                packSize: batch.packSize
            });

            const safeDecimal = (val) => {
                if (val === null || val === undefined || isNaN(Number(val))) return new Decimal(0);
                return new Decimal(val);
            };

            const conversionFactor = Number(item.conversionFactor) || 1;
            let sellingPrice;

            if (item.price) {
                sellingPrice = safeDecimal(item.price);
            } else if (item.mrp && conversionFactor > 1) {
                sellingPrice = safeDecimal(item.mrp).div(conversionFactor);
            } else {
                sellingPrice = safeDecimal(item.mrp || 0);
            }

            const qty = safeDecimal(item.qty);
            const grossRevenue = sellingPrice.mul(qty);

            const gstRate = safeDecimal(item.gstRate);
            const taxableAmount = grossRevenue.div(new Decimal(1).plus(gstRate.div(100)));

            console.log('Revenue calc:', { sellingPrice: sellingPrice.toNumber(), qty: qty.toNumber(), grossRevenue: grossRevenue.toNumber(), taxableAmount: taxableAmount.toNumber() });

            const purchasePrice = safeDecimal(batch.purchasePrice);
            let packSize = Number(batch.tabletsPerStrip || item.tabletsPerStrip || 1);
            if (packSize === 1 && conversionFactor > 1) {
                packSize = conversionFactor;
            }

            const normalizeString = (s) => (s || '').toLowerCase().trim();
            const itemUnit = normalizeString(item.unit);
            const drug = batch.drug || {};
            const baseUnit = normalizeString(drug.baseUnit);

            const isDerivedPrice = !item.price && item.mrp && conversionFactor > 1;
            const isBaseUnitSale = isDerivedPrice ||
                (itemUnit === baseUnit && baseUnit !== '') ||
                (itemUnit.includes('tab')) ||
                (itemUnit.includes('cap')) ||
                (itemUnit.includes('pill'));

            // CRITICAL FIX: purchasePrice is already per base unit (tablet)
            // Don't divide by packSize - use it directly
            let quantityInPackUnits = qty;
            const lineCost = purchasePrice.mul(quantityInPackUnits);

            console.log('Cost calc:', { purchasePrice: purchasePrice.toNumber(), packSize, isBaseUnitSale, quantityInPackUnits: quantityInPackUnits.toNumber(), lineCost: lineCost.toNumber() });

            totalCost = totalCost.plus(lineCost);
            totalRevenue = totalRevenue.plus(taxableAmount);

            console.log('Running totals:', { totalRevenue: totalRevenue.toNumber(), totalCost: totalCost.toNumber(), margin: totalRevenue.minus(totalCost).toNumber() });

        } catch (itemError) {
            console.error(`[Margin] ❌ Error processing ${item.name}:`, itemError);
        }
    }

    const marginAmount = totalRevenue.minus(totalCost);
    const marginPercent = totalRevenue.equals(0) ? new Decimal(0) : marginAmount.div(totalRevenue).mul(100);

    const result = {
        totalMargin: marginAmount.toNumber(),
        totalRevenue: totalRevenue.toNumber(),
        totalCost: totalCost.toNumber(),
        netMarginPercent: marginPercent.toNumber()
    };

    console.log('\n✅ [MARGIN-BACKEND] Final result:', result);
    return result;
}

module.exports = {
    calculateAndRecordSaleMargin,
    getMarginForSale,
    getAggregatedMargin,
    calculateProvisionalMargin
};
