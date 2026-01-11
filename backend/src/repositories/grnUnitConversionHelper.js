/**
 * GRN Unit Conversion Helper
 * 
 * Helper functions for converting GRN received quantities to base units
 * Used during GRN completion to create inventory with correct base unit quantities
 */

const unitConversionService = require('../services/inventory/unitConversionService');
const logger = require('../config/logger');

class GRNUnitConversionHelper {
    /**
     * Calculate base unit quantity for a GRN item
     * 
     * This is called during GRN completion to convert received quantities
     * (e.g., 100 strips) to base units (e.g., 1000 tablets)
     * 
     * @param {Object} grnItem - GRN item with receivedQty, freeQty, drugId
     * @param {string} packUnit - Unit of the received package (e.g., 'strip', 'bottle')
     * @param {number} packSize - Size of package (e.g., 10 for strip of 10 tablets)
     * @returns {Promise<{baseUnitQty: number, receivedUnit: string}>}
     */
    async calculateBaseUnitQty(grnItem, packUnit, packSize = 1) {
        try {
            const totalReceivedQty = grnItem.receivedQty + grnItem.freeQty;

            // Total items in parent units (e.g., total strips)
            const totalInParentUnits = totalReceivedQty * packSize;

            // Convert to base units if conversion exists
            try {
                const { baseQuantity, baseUnit } = await unitConversionService.convertToBaseUnits(
                    grnItem.drugId,
                    totalInParentUnits,
                    packUnit || 'unit'
                );

                logger.debug(`GRN Unit Conversion: ${totalReceivedQty} × ${packSize} ${packUnit} = ${baseQuantity} ${baseUnit}`, {
                    drugId: grnItem.drugId,
                    receivedQty: grnItem.receivedQty,
                    freeQty: grnItem.freeQty,
                    packSize,
                    packUnit,
                    baseQuantity,
                    baseUnit
                });

                return {
                    baseUnitQty: baseQuantity,
                    receivedUnit: packUnit,
                    receivedQuantity: totalReceivedQty
                };
            } catch (conversionError) {
                // No conversion configured - use 1:1 mapping
                // This handles drugs that haven't been configured yet
                logger.warn(`No unit conversion configured for drug ${grnItem.drugId}, using 1:1 mapping`, {
                    error: conversionError.message
                });

                return {
                    baseUnitQty: totalInParentUnits,
                    receivedUnit: packUnit || 'unit',
                    receivedQuantity: totalReceivedQty
                };
            }
        } catch (error) {
            logger.error('Error calculating base unit quantity:', error);
            throw error;
        }
    }

    /**
     * Calculate base unit stock movement quantity
     * 
     * @param {number} quantity - Movement quantity in display units
     * @param {string} drugId - Drug ID
     * @param {string} unit - Movement unit
     * @returns {Promise<{baseQuantity: number, movementUnit: string}>}
     */
    async calculateStockMovementBaseQty(quantity, drugId, unit) {
        try {
            const { baseQuantity, baseUnit } = await unitConversionService.convertToBaseUnits(
                drugId,
                quantity,
                unit
            );

            return {
                baseQuantity,
                movementUnit: unit,
                originalQuantity: quantity
            };
        } catch (error) {
            // Fallback: 1:1
            logger.warn(`Stock movement conversion fallback for drug ${drugId}:`, error.message);
            return {
                baseQuantity: quantity,
                movementUnit: unit || 'unit',
                originalQuantity: quantity
            };
        }
    }
}

module.exports = new GRNUnitConversionHelper();
