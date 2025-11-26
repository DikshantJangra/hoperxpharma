/**
 * CSV Parser for Bulk Add
 * Parses CSV input for bulk adding items to PO
 * Format: drugCode, qty, price (price optional)
 */

export interface BulkAddItem {
    drugId: string;
    qty: number;
    pricePerUnit?: number;
}

export interface ParseResult {
    items: BulkAddItem[];
    errors: string[];
}

/**
 * Parse CSV text for bulk-add
 * Supports formats:
 * - drugCode, qty
 * - drugCode, qty, price
 */
export function parseCSVForBulkAdd(csvText: string): ParseResult {
    const lines = csvText.trim().split('\n');
    const items: BulkAddItem[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) return;

        // Skip comment lines
        if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return;

        const parts = trimmedLine.split(',').map(s => s.trim());

        if (parts.length < 2) {
            errors.push(`Line ${lineNumber}: Invalid format (need at least drugCode and qty)`);
            return;
        }

        const [drugCode, qtyStr, priceStr] = parts;

        // Validate drug code
        if (!drugCode) {
            errors.push(`Line ${lineNumber}: Missing drug code`);
            return;
        }

        // Validate quantity
        const qty = Number(qtyStr);
        if (isNaN(qty) || qty <= 0) {
            errors.push(`Line ${lineNumber}: Invalid quantity "${qtyStr}"`);
            return;
        }

        // Parse price (optional)
        let pricePerUnit: number | undefined;
        if (priceStr) {
            const price = Number(priceStr);
            if (isNaN(price) || price < 0) {
                errors.push(`Line ${lineNumber}: Invalid price "${priceStr}"`);
                return;
            }
            pricePerUnit = price;
        }

        items.push({
            drugId: drugCode,
            qty,
            pricePerUnit
        });
    });

    return { items, errors };
}

/**
 * Generate example CSV for user reference
 */
export function generateExampleCSV(): string {
    return `# Bulk Add Format: drugCode, qty, price (price optional)
drug_123, 10, 45.50
drug_456, 5, 120.00
drug_789, 20`;
}

/**
 * Validate bulk add items before sending to API
 */
export function validateBulkAddItems(items: BulkAddItem[]): string[] {
    const errors: string[] = [];

    if (items.length === 0) {
        errors.push('No items to add');
        return errors;
    }

    if (items.length > 100) {
        errors.push('Too many items (max 100 per bulk add)');
    }

    items.forEach((item, index) => {
        if (!item.drugId) {
            errors.push(`Item ${index + 1}: Missing drug ID`);
        }
        if (!item.qty || item.qty <= 0) {
            errors.push(`Item ${index + 1}: Invalid quantity`);
        }
        if (item.pricePerUnit !== undefined && item.pricePerUnit < 0) {
            errors.push(`Item ${index + 1}: Invalid price`);
        }
    });

    return errors;
}
