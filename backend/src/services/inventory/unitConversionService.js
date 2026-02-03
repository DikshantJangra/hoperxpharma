/**
 * Unit Conversion Service
 * 
 * Core service for managing unit conversions in the pharmacy inventory system.
 * Handles converting between purchase units (strips, bottles) and base dispensable units (tablets, ml).
 * 
 * CRITICAL RULES:
 * - All inventory math MUST use base units
 * - Never do manual conversions (quantity * 10) outside this service
 * - Conversions must be deterministic (no floating point drift)
 * - Invalid conversions MUST throw errors
 */

const { PrismaClient } = require('@prisma/client');
const ApiError = require('../../utils/ApiError');
const logger = require('../../config/logger');

const prisma = new PrismaClient();

class UnitConversionService {
    /**
     * Convert from any unit to base units
     * 
     * @param {string} drugId - Drug ID
     * @param {number} quantity - Quantity to convert
     * @param {string} fromUnit - Source unit (e.g., 'strip', 'bottle')
     * @returns {Promise<{baseQuantity: Decimal, baseUnit: string}>}
     */
    async convertToBaseUnits(drugId, quantity, fromUnit) {
        try {
            // Get drug with base unit info
            const drug = await prisma.drug.findUnique({
                where: { id: drugId },
                select: {
                    baseUnit: true,
                    displayUnit: true,
                    unitConfigurations: {
                        where: {
                            OR: [
                                { childUnit: fromUnit },
                                { parentUnit: fromUnit }
                            ]
                        }
                    }
                }
            });

            if (!drug) {
                throw new ApiError(404, `Drug not found: ${drugId}`);
            }

            if (!drug.baseUnit) {
                throw new ApiError(400, `Drug ${drugId} has no base unit configured. Please configure unit settings first.`);
            }

            // If already in base units, return as-is (case-insensitive comparison)
            const normalizeUnit = (u) => (u || '').toLowerCase().trim();
            if (normalizeUnit(fromUnit) === normalizeUnit(drug.baseUnit)) {
                return {
                    baseQuantity: quantity,
                    baseUnit: drug.baseUnit
                };
            }

            // Find conversion path
            const conversion = drug.unitConfigurations.find(
                c => c.parentUnit === fromUnit && c.childUnit === drug.baseUnit
            );

            if (!conversion) {
                throw new ApiError(
                    400,
                    `No conversion found from ${fromUnit} to ${drug.baseUnit} for drug ${drugId}. Please configure conversion.`
                );
            }

            // Apply conversion
            const baseQuantity = quantity * parseFloat(conversion.conversion);

            logger.debug(`Converted ${quantity} ${fromUnit} to ${baseQuantity} ${drug.baseUnit}`, {
                drugId,
                fromUnit,
                baseUnit: drug.baseUnit,
                conversionFactor: conversion.conversion
            });

            return {
                baseQuantity,
                baseUnit: drug.baseUnit
            };

        } catch (error) {
            logger.error('Error in convertToBaseUnits:', error);
            throw error;
        }
    }

    /**
     * Convert from base units to display/parent unit
     * 
     * @param {string} drugId - Drug ID
     * @param {number} baseQuantity - Base unit quantity
     * @param {string} toUnit - Target unit (e.g., 'strip', 'bottle')
     * @returns {Promise<{displayQuantity: number, displayUnit: string}>}
     */
    async convertFromBaseUnits(drugId, baseQuantity, toUnit) {
        try {
            const drug = await prisma.drug.findUnique({
                where: { id: drugId },
                select: {
                    baseUnit: true,
                    displayUnit: true,
                    unitConfigurations: {
                        where: {
                            childUnit: toUnit,
                            OR: [
                                { parentUnit: toUnit },
                                { childUnit: toUnit }
                            ]
                        }
                    }
                }
            });

            if (!drug) {
                throw new ApiError(404, `Drug not found: ${drugId}`);
            }

            // If already in target unit, return as-is
            if (toUnit === drug.baseUnit) {
                return {
                    displayQuantity: baseQuantity,
                    displayUnit: drug.baseUnit
                };
            }

            // Find conversion
            const conversion = drug.unitConfigurations.find(
                c => c.parentUnit === toUnit && c.childUnit === drug.baseUnit
            );

            if (!conversion) {
                throw new ApiError(
                    400,
                    `No conversion found from ${drug.baseUnit} to ${toUnit} for drug ${drugId}`
                );
            }

            // Apply inverse conversion
            const displayQuantity = baseQuantity / parseFloat(conversion.conversion);

            return {
                displayQuantity: parseFloat(displayQuantity.toFixed(3)), // Keep 3 decimal places for partial units
                displayUnit: toUnit
            };

        } catch (error) {
            logger.error('Error in convertFromBaseUnits:', error);
            throw error;
        }
    }

    /**
     * Get conversion factor between two units
     * 
     * @param {string} drugId - Drug ID
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {Promise<number>} Conversion factor
     */
    async getConversionFactor(drugId, fromUnit, toUnit) {
        try {
            const drug = await prisma.drug.findUnique({
                where: { id: drugId },
                select: {
                    baseUnit: true,
                    unitConfigurations: true
                }
            });

            if (!drug) {
                throw new ApiError(404, `Drug not found: ${drugId}`);
            }

            // Same unit
            if (fromUnit === toUnit) {
                return 1;
            }

            // Direct conversion exists
            const directConversion = drug.unitConfigurations.find(
                c => c.parentUnit === fromUnit && c.childUnit === toUnit
            );

            if (directConversion) {
                return parseFloat(directConversion.conversion);
            }

            // Convert via base unit
            const fromBase = await this.convertToBaseUnits(drugId, 1, fromUnit);
            const toDisplay = await this.convertFromBaseUnits(drugId, fromBase.baseQuantity, toUnit);

            return fromBase.baseQuantity / toDisplay.displayQuantity;

        } catch (error) {
            logger.error('Error in getConversionFactor:', error);
            throw error;
        }
    }

    /**
     * Validate that a unit is valid for a drug
     * 
     * @param {string} drugId - Drug ID
     * @param {string} unit - Unit to validate
     * @throws {ApiError} If unit is invalid
     */
    async validateUnit(drugId, unit) {
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            select: {
                baseUnit: true,
                displayUnit: true,
                unitConfigurations: {
                    select: {
                        parentUnit: true,
                        childUnit: true
                    }
                }
            }
        });

        if (!drug) {
            throw new ApiError(404, `Drug not found: ${drugId}`);
        }

        // Check if unit is base unit
        if (unit === drug.baseUnit) {
            return true;
        }

        // Check if unit is in configurations
        const validUnits = new Set([drug.baseUnit, drug.displayUnit]);

        drug.unitConfigurations.forEach(config => {
            if (config.parentUnit) validUnits.add(config.parentUnit);
            if (config.childUnit) validUnits.add(config.childUnit);
        });

        if (!validUnits.has(unit)) {
            throw new ApiError(
                400,
                `Invalid unit "${unit}" for drug. Valid units: ${Array.from(validUnits).join(', ')}`
            );
        }

        return true;
    }

    /**
     * Get default display unit for a drug
     * 
     * @param {string} drugId - Drug ID
     * @returns {Promise<string>} Default display unit
     */
    async getDefaultDisplayUnit(drugId) {
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            select: { displayUnit: true, baseUnit: true }
        });

        if (!drug) {
            throw new ApiError(404, `Drug not found: ${drugId}`);
        }

        return drug.displayUnit || drug.baseUnit || 'unit';
    }

    /**
     * Get base unit for a drug
     * 
     * @param {string} drugId - Drug ID
     * @returns {Promise<string>} Base unit
     */
    async getBaseUnit(drugId) {
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            select: { baseUnit: true }
        });

        if (!drug) {
            throw new ApiError(404, `Drug not found: ${drugId}`);
        }

        if (!drug.baseUnit) {
            throw new ApiError(400, `Drug ${drugId} has no base unit configured`);
        }

        return drug.baseUnit;
    }

    /**
     * Get all valid units for a drug
     * 
     * @param {string} drugId - Drug ID
     * @returns {Promise<Array<{unit: string, isBase: boolean, isDefault: boolean}>>}
     */
    async getValidUnits(drugId) {
        const drug = await prisma.drug.findUnique({
            where: { id: drugId },
            select: {
                baseUnit: true,
                displayUnit: true,
                unitConfigurations: {
                    select: {
                        parentUnit: true,
                        childUnit: true,
                        isDefault: true
                    }
                }
            }
        });

        if (!drug) {
            throw new ApiError(404, `Drug not found: ${drugId}`);
        }

        const units = new Map();

        // Add base unit
        if (drug.baseUnit) {
            units.set(drug.baseUnit, { unit: drug.baseUnit, isBase: true, isDefault: false });
        }

        // Add configured units
        drug.unitConfigurations.forEach(config => {
            if (config.parentUnit && !units.has(config.parentUnit)) {
                units.set(config.parentUnit, {
                    unit: config.parentUnit,
                    isBase: false,
                    isDefault: config.isDefault || config.parentUnit === drug.displayUnit
                });
            }
        });

        return Array.from(units.values());
    }
}

module.exports = new UnitConversionService();
