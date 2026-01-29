import React from 'react';

/**
 * Stock Display Utility
 * 
 * Helper to display stock quantities with proper units and styling.
 * Supports both string formatting and JSX rendering for UI components.
 */

/**
 * Capitalizes and cleans up unit names for display
 * e.g., "tablet" -> "Tablet", "strip" -> "Strip"
 */
export function formatUnitName(unit: string): string {
    if (!unit) return '';

    // Units that should remain lowercase or have specific formatting
    const lowercaseUnits = ['ml', 'mg', 'gm', 'kg'];
    const lowerUnit = unit.toLowerCase();

    if (lowercaseUnits.includes(lowerUnit)) {
        return lowerUnit;
    }

    // Capitalize first letter for others
    return lowerUnit.charAt(0).toUpperCase() + lowerUnit.slice(1);
}

interface FormatOptions {
    showUnit?: boolean;
    showBothUnits?: boolean;
    preferDisplayUnit?: boolean;
    forceBoth?: boolean;
}

export function formatStockQuantity(
    batch: any,
    options: FormatOptions = {}
): string {
    const {
        showUnit = true,
        showBothUnits = false,
        preferDisplayUnit = true,
        forceBoth = false
    } = options;

    // Use baseUnitQuantity if available, otherwise fall back to quantityInStock or totalStock
    const baseQuantity = batch.baseUnitQuantity ?? batch.quantityInStock ?? batch.totalStock ?? 0;

    // Get unit information - support both nested and flat structures
    const baseUnit = batch.drug?.baseUnit || batch.baseUnit || (batch.drug?.form && batch.drug.form !== 'Tablet' ? batch.drug.form : 'Tablet');
    const displayUnit = batch.drug?.displayUnit || batch.displayUnit || batch.unit || baseUnit;

    // Get conversion factor - support multiple structures
    // Default to 10 if no conversion factor found
    let conversionFactor = batch.drug?.tabletsPerStrip || batch.tabletsPerStrip || batch.conversionFactor || batch.conversion || 1;
    if (batch.drug?.unitConfigurations) {
        const config = batch.drug.unitConfigurations.find(
            (c: any) => c.parentUnit === displayUnit && c.childUnit === baseUnit
        );
        if (config) conversionFactor = Number(config.conversion) || 10;
    } else if (batch.unitConfigurations) {
        const config = batch.unitConfigurations.find(
            (c: any) => c.parentUnit === displayUnit && c.childUnit === baseUnit
        );
        if (config) conversionFactor = Number(config.conversion) || 10;
    }

    if (!showUnit) {
        if (preferDisplayUnit && conversionFactor > 1) {
            return (baseQuantity / conversionFactor).toFixed(2).replace(/\.00$/, '');
        }
        return baseQuantity.toString();
    }

    const formattedBaseUnit = formatUnitName(baseUnit);
    const formattedDisplayUnit = formatUnitName(displayUnit);

    // Case: Multi-unit conversion exists
    if (conversionFactor > 1) {
        const displayQty = Math.floor(baseQuantity / conversionFactor);
        const remainingBaseQty = Math.round(baseQuantity % conversionFactor);

        const displayLabel = displayQty === 1 ? formattedDisplayUnit : `${formattedDisplayUnit}s`;
        const baseLabel = remainingBaseQty === 1 ? formattedBaseUnit : `${formattedBaseUnit}s`;

        // If forceBoth or mixed, show both
        if (forceBoth || showBothUnits || remainingBaseQty > 0) {
            return `${displayQty} ${displayLabel}, ${remainingBaseQty} ${baseLabel}`;
        }

        // Otherwise show just display unit
        return `${displayQty} ${displayLabel}`;
    }

    // Default: Show base unit
    const unitLabel = baseQuantity === 1 ? formattedBaseUnit : `${formattedBaseUnit}s`;
    return `${baseQuantity} ${unitLabel}`;
}

/**
 * Renders stock quantity as a React fragment with styled (small) unit labels.
 */
export function renderStockQuantity(
    batch: any,
    options: FormatOptions & { className?: string; unitClassName?: string } = {}
) {
    const {
        className = "font-medium text-gray-900",
        unitClassName = "text-[10px] sm:text-xs text-gray-400 font-normal ml-0.5 uppercase tracking-tight",
        forceBoth = true
    } = options;

    const baseQuantity = batch.baseUnitQuantity ?? batch.quantityInStock ?? batch.totalStock ?? 0;
    const baseUnit = batch.drug?.baseUnit || batch.baseUnit || (batch.drug?.form && batch.drug.form !== 'Tablet' ? batch.drug.form : 'Tablet');
    const displayUnit = batch.drug?.displayUnit || batch.displayUnit || batch.unit || baseUnit;

    // Get conversion factor - support multiple structures
    // Default to 1 if no conversion factor found (consistent with SmartQuantityInput)
    let conversionFactor = batch.drug?.tabletsPerStrip || batch.tabletsPerStrip || batch.conversionFactor || batch.conversion || 1;
    if (batch.drug?.unitConfigurations) {
        const config = batch.drug.unitConfigurations.find(
            (c: any) => c.parentUnit === displayUnit && c.childUnit === baseUnit
        );
        if (config) conversionFactor = Number(config.conversion) || 10;
    } else if (batch.unitConfigurations) {
        const config = batch.unitConfigurations.find(
            (c: any) => c.parentUnit === displayUnit && c.childUnit === baseUnit
        );
        if (config) conversionFactor = Number(config.conversion) || 10;
    }

    const formattedBaseUnit = formatUnitName(baseUnit);
    const formattedDisplayUnit = formatUnitName(displayUnit);

    if (conversionFactor > 1) {
        const displayQty = Math.floor(baseQuantity / conversionFactor);
        const remainingBaseQty = Math.round(baseQuantity % conversionFactor);

        const displayLabel = displayQty === 1 ? formattedDisplayUnit : `${formattedDisplayUnit}s`;
        const baseLabel = remainingBaseQty === 1 ? formattedBaseUnit : `${formattedBaseUnit}s`;

        return (
            <div className={`inline-flex items-baseline flex-wrap gap-x-2 ${className}`}>
                <span className="flex items-baseline">
                    {displayQty}
                    <span className={unitClassName}>{displayLabel}</span>
                </span>
                {(forceBoth || remainingBaseQty > 0) && (
                    <span className="flex items-baseline">
                        {remainingBaseQty}
                        <span className={unitClassName}>{baseLabel}</span>
                    </span>
                )}
            </div>
        );
    }

    const unitLabel = baseQuantity === 1 ? formattedBaseUnit : `${formattedBaseUnit}s`;
    return (
        <span className={`inline-flex items-baseline ${className}`}>
            {baseQuantity}
            <span className={unitClassName}>{unitLabel}</span>
        </span>
    );
}

export function getStockStatus(batch: any): {
    status: 'OK' | 'LOW' | 'CRITICAL' | 'OUT';
    color: string;
} {
    const quantity = batch.baseUnitQuantity ?? batch.quantityInStock ?? batch.totalStock ?? 0;
    const threshold = batch.drug?.lowStockThresholdBase ?? batch.drug?.lowStockThreshold ?? 0;

    if (quantity === 0) {
        return { status: 'OUT', color: 'text-red-600' };
    }

    if (threshold > 0 && quantity <= threshold * 0.5) {
        return { status: 'CRITICAL', color: 'text-orange-600' };
    }

    if (threshold > 0 && quantity <= threshold) {
        return { status: 'LOW', color: 'text-yellow-600' };
    }

    return { status: 'OK', color: 'text-gray-700' };
}
