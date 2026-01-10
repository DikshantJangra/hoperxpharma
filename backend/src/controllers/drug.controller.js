/**
 * Drug Units API Controller
 * 
 * Provides unit configuration for drugs to support unit selection in POS
 */

const unitConversionService = require('../../services/inventory/unitConversionService');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

/**
 * Get available units for a drug
 * GET /api/drugs/:drugId/units
 */
exports.getDrugUnits = async (req, res, next) => {
    try {
        const { drugId } = req.params;

        const units = await unitConversionService.getValidUnits(drugId);

        // Calculate conversion factors for each unit relative to display unit
        const baseUnit = await unitConversionService.getBaseUnit(drugId);
        const displayUnit = await unitConversionService.getDefaultDisplayUnit(drugId);

        const unitsWithFactors = [];

        for (const unitInfo of units) {
            let conversionFactor = 1;

            try {
                // Get conversion factor from display unit to this unit
                // e.g., if display is "strip" and unit is "tablet", factor = 10
                conversionFactor = await unitConversionService.getConversionFactor(
                    drugId,
                    displayUnit,
                    unitInfo.unit
                );
            } catch (error) {
                logger.warn(`Could not get conversion factor for ${unitInfo.unit}:`, error.message);
            }

            unitsWithFactors.push({
                unit: unitInfo.unit,
                isBase: unitInfo.isBase,
                isDefault: unitInfo.isDefault,
                conversionFactor
            });
        }

        res.json({
            drugId,
            baseUnit,
            displayUnit,
            units: unitsWithFactors
        });
    } catch (error) {
        logger.error('Error fetching drug units:', error);
        next(error);
    }
};
