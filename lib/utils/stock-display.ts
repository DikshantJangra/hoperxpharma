/**
 * Stock Display Utility
 * 
 * Simple helper to display stock quantities with proper units.
 * Falls back to showing raw quantities if unit data is not available.
 * This ensures compatibility even before the data migration runs.
 */

export function formatStockQuantity(
    batch: any,
    options: { showUnit?: boolean; showBothUnits?: boolean } = {}
): string {
    const { showUnit = true, showBothUnits = false } = options;

    // Use baseUnitQuantity if available, otherwise fall back to quantityInStock
    const quantity = batch.baseUnitQuantity ?? batch.quantityInStock ?? 0;

    // Get unit information if available
    const baseUnit = batch.drug?.baseUnit || batch.baseUnit || 'unit';
    const displayUnit = batch.drug?.displayUnit || batch.displayUnit || baseUnit;

    if (!showUnit) {
        return quantity.toString();
    }

    // Simple display: just show quantity with unit
    // (More advanced conversion can be added after migration)
    const unitLabel = quantity === 1 ? displayUnit : `${displayUnit}s`;

    return `${quantity} ${unitLabel}`;
}

export function getStockStatus(batch: any): {
    status: 'OK' | 'LOW' | 'CRITICAL' | 'OUT';
    color: string;
} {
    const quantity = batch.baseUnitQuantity ?? batch.quantityInStock ?? 0;
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
