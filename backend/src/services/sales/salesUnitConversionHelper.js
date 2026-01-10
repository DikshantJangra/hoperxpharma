/**
 * Sales Unit Conversion Helper
 * 
 * Helper functions for converting sale quantities to base units
 * Used during sale creation to deduct correct base unit quantities
 */

const unitConversionService = require('../services/inventory/unitConversionService');
const logger = require('../config/logger');

class SalesUnitConversionHelper {
    /**
     * Calculate base unit quantity for a sale item
     * 
     * This is called during sale creation to convert sale quantities
     * (e.g., 3 tablets or 1 strip) to base units for deduction
     * 
     * @param {Object} saleItem - Sale item with quantity, drugId, unit
     * @returns {Promise<{baseUnitQty: number, unit: string}>}
     */
    async calculateSaleBaseUnitQty(saleItem) {
        try {
            const { baseQuantity, baseUnit } = await unitConversionService.convertToBaseUnits(
                saleItem.drugId,
                saleItem.quantity,
                saleItem.unit || 'unit'
            );

            logger.debug(`Sale Unit Conversion: ${saleItem.quantity} ${saleItem.unit} = ${baseQuantity} ${baseUnit}`, {
                drugId: saleItem.drugId,
                quantity: saleItem.quantity,
                unit: saleItem.unit,
                baseQuantity,
                baseUnit
            });

            return {
                baseUnitQty: baseQuantity,
                unit: saleItem.unit || 'unit'
            };
        } catch (error) {
            // Fallback: use quantity as-is if no conversion configured
            logger.warn(`No unit conversion configured for drug ${saleItem.drugId}, using 1:1 mapping`, {
                error: error.message
            });

            return {
                baseUnitQty: saleItem.quantity,
                unit: saleItem.unit || 'unit'
            };
        }
    }

    /**
     * Calculate pricing for partial units
     * 
     * @param {Object} batch - Inventory batch with MRP
     * @param {number} quantity - Quantity being sold
     * @param {string} unit - Unit of sale
     * @param {string} drugId - Drug ID
     * @returns {Promise<{unitPrice: number, lineTotal: number}>}
     */
    async calculatePartialUnitPrice(batch, quantity, unit, drugId) {
        try {
            // Get conversion factor to calculate per-unit price
            const drug = await require('../db/prisma').drug.findUnique({
                where: { id: drugId },
                select: { displayUnit: true, baseUnit: true }
            });

            if (!drug) {
                throw new Error(`Drug ${drugId} not found`);
            }

            const displayUnit = drug.displayUnit || batch.receivedUnit || 'unit';

            // If selling in the same unit as MRP is priced, use MRP directly
            if (unit === displayUnit) {
                const lineTotal = parseFloat((batch.mrp * quantity).toFixed(2));
                return {
                    unitPrice: parseFloat(batch.mrp.toFixed(2)),
                    lineTotal
                };
            }

            // Get conversion factor (e.g., 1 strip = 10 tablets)
            const conversionFactor = await unitConversionService.getConversionFactor(
                drugId,
                displayUnit,
                unit
            );

            // Calculate per-unit price
            const unitPrice = batch.mrp / conversionFactor;
            const lineTotal = unitPrice * quantity;

            return {
                unitPrice: parseFloat(unitPrice.toFixed(2)),
                lineTotal: parseFloat(lineTotal.toFixed(2))
            };
        } catch (error) {
            logger.error('Error calculating partial unit price:', error);
            // Fallback: use MRP as-is
            const lineTotal = parseFloat((batch.mrp * quantity).toFixed(2));
            return {
                unitPrice: parseFloat(batch.mrp.toFixed(2)),
                lineTotal
            };
        }
    }
}

module.exports = new SalesUnitConversionHelper();
