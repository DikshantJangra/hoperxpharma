/**
 * Inventory Display Helper
 * 
 * This helper converts base unit quantities to user-friendly display units
 * for dashboards, reports, and UI displays. Ensures consistent formatting
 * across the application.
 */

const unitConversionService = require('./unitConversionService');
const logger = require('../../config/logger');

class InventoryDisplayHelper {
    /**
     * Format inventory quantity for display
     * 
     * Converts base unit quantity to display unit with appropriate formatting
     * 
     * @param {Object} batch - Inventory batch with baseUnitQuantity
     * @param {Object} drug - Drug with baseUnit and displayUnit
     * @returns {Promise<{quantity: number, unit: string, formatted: string}>}
     */
    async formatQuantityForDisplay(batch, drug) {
        try {
            const baseQty = batch.baseUnitQuantity || 0;
            const targetUnit = drug.displayUnit || drug.baseUnit || 'unit';

            // If already in display unit or no conversion configured, return as-is
            if (!drug.baseUnit || targetUnit === drug.baseUnit) {
                return {
                    quantity: parseFloat(baseQty),
                    unit: targetUnit,
                    formatted: `${parseFloat(baseQty).toFixed(2)} ${targetUnit}${baseQty !== 1 ? 's' : ''}`
                };
            }

            // Convert to display unit
            const { displayQuantity } = await unitConversionService.convertFromBaseUnits(
                drug.id,
                baseQty,
                targetUnit
            );

            return {
                quantity: displayQuantity,
                unit: targetUnit,
                formatted: `${displayQuantity.toFixed(2)} ${targetUnit}${displayQuantity !== 1 ? 's' : ''}`
            };
        } catch (error) {
            // Fallback: show base quantity
            logger.warn(`Failed to format inventory display for drug ${drug.id}:`, error.message);
            const baseQty = batch.baseUnitQuantity || 0;
            return {
                quantity: parseFloat(baseQty),
                unit: drug.baseUnit || 'unit',
                formatted: `${parseFloat(baseQty).toFixed(2)} ${drug.baseUnit || 'unit'}s`
            };
        }
    }

    /**
     * Format quantity with both display and base units
     * Useful for detailed views where showing both units is important
     * 
     * @param {number} baseQty - Base unit quantity
     * @param {Object} drug - Drug object
     * @returns {Promise<string>} - Formatted string like "50 Strips (500 Tablets)"
     */
    async formatWithBothUnits(baseQty, drug) {
        try {
            if (!drug.displayUnit || drug.displayUnit === drug.baseUnit) {
                return `${parseFloat(baseQty).toFixed(2)} ${drug.baseUnit || 'unit'}s`;
            }

            const { displayQuantity } = await unitConversionService.convertFromBaseUnits(
                drug.id,
                baseQty,
                drug.displayUnit
            );

            return `${displayQuantity.toFixed(2)} ${drug.displayUnit}${displayQuantity !== 1 ? 's' : ''} ` +
                `(${parseFloat(baseQty).toFixed(2)} ${drug.baseUnit}${baseQty !== 1 ? 's' : ''})`;
        } catch (error) {
            return `${parseFloat(baseQty).toFixed(2)} ${drug.baseUnit || 'unit'}s`;
        }
    }

    /**
     * Get low stock status with proper unit display
     * 
     * @param {number} baseQty - Current base unit quantity
     * @param {Object} drug - Drug with threshold info
     * @returns {Promise<{isLow: boolean, status: string, formatted: string}>}
     */
    async getLowStockStatus(baseQty, drug) {
        try {
            const threshold = drug.lowStockThresholdBase || drug.lowStockThreshold || 0;
            const isLow = baseQty <= threshold;

            // Format current quantity
            const displayInfo = await this.formatWithBothUnits(baseQty, drug);

            let status = 'OK';
            if (baseQty === 0) {
                status = 'OUT_OF_STOCK';
            } else if (baseQty <= threshold * 0.5) {
                status = 'CRITICAL';
            } else if (isLow) {
                status = 'LOW';
            }

            return {
                isLow,
                status,
                formatted: displayInfo,
                currentQty: baseQty,
                threshold
            };
        } catch (error) {
            logger.error('Error getting low stock status:', error);
            return {
                isLow: false,
                status: 'ERROR',
                formatted: `${baseQty} units`,
                currentQty: baseQty,
                threshold: 0
            };
        }
    }

    /**
     * Summarize total stock across multiple batches
     * 
     * @param {Array} batches - Array of inventory batches
     * @param {Object} drug - Drug information
     * @returns {Promise<{totalBaseQty: number, display: string}>}
     */
    async summarizeTotalStock(batches, drug) {
        try {
            const totalBaseQty = batches.reduce((sum, b) => {
                return sum + (Number(b.baseUnitQuantity) || 0);
            }, 0);

            const display = await this.formatWithBothUnits(totalBaseQty, drug);

            return {
                totalBaseQty,
                display,
                batchCount: batches.length
            };
        } catch (error) {
            logger.error('Error summarizing total stock:', error);
            const totalBaseQty = batches.reduce((sum, b) => {
                return sum + (Number(b.baseUnitQuantity) || 0);
            }, 0);

            return {
                totalBaseQty,
                display: `${totalBaseQty} units`,
                batchCount: batches.length
            };
        }
    }

    /**
     * Format stock movement for display
     * 
     * @param {Object} movement - Stock movement record
     * @returns {Promise<string>} - Formatted movement description
     */
    async formatStockMovement(movement) {
        try {
            const quantity = movement.baseUnitQuantity || 0;
            const unit = movement.movementUnit || 'unit';
            const origQty = movement.originalQuantity || Math.abs(quantity);

            const direction = quantity >= 0 ? '+' : '';
            return `${direction}${origQty} ${unit}${origQty !== 1 ? 's' : ''}`;
        } catch (error) {
            const quantity = movement.baseUnitQuantity || 0;
            return `${quantity >= 0 ? '+' : ''}${quantity} units`;
        }
    }
}

module.exports = new InventoryDisplayHelper();
