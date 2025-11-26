/**
 * PO Calculation Engine
 * Pure calculation functions for real-time PO totals
 * No API calls, instant calculations
 */

export interface POLine {
    lineId: string;
    drugId: string;
    qty: number;
    pricePerUnit: number;
    discountPercent: number;
    gstPercent: number;
}

export interface TaxBreakdown {
    gstPercent: number;
    taxable: number;
    tax: number;
}

export interface CalculationResult {
    subtotal: number;
    taxBreakdown: TaxBreakdown[];
    total: number;
}

export class POCalculationEngine {
    /**
     * Calculate line total (after discount, before tax)
     */
    static calculateLine(line: POLine): number {
        const baseAmount = line.qty * line.pricePerUnit;
        const afterDiscount = baseAmount * (1 - line.discountPercent / 100);
        return afterDiscount;
    }

    /**
     * Calculate tax breakdown grouped by GST rate
     */
    static calculateTaxBreakdown(lines: POLine[]): TaxBreakdown[] {
        const taxMap = new Map<number, { taxable: number; tax: number }>();

        lines.forEach(line => {
            const taxable = this.calculateLine(line);
            const tax = taxable * (line.gstPercent / 100);

            if (taxMap.has(line.gstPercent)) {
                const existing = taxMap.get(line.gstPercent)!;
                taxMap.set(line.gstPercent, {
                    taxable: existing.taxable + taxable,
                    tax: existing.tax + tax
                });
            } else {
                taxMap.set(line.gstPercent, { taxable, tax });
            }
        });

        return Array.from(taxMap.entries()).map(([gstPercent, values]) => ({
            gstPercent,
            taxable: Math.round(values.taxable * 100) / 100,
            tax: Math.round(values.tax * 100) / 100
        }));
    }

    /**
     * Calculate complete PO totals
     */
    static calculateTotals(lines: POLine[]): CalculationResult {
        if (!lines || lines.length === 0) {
            return {
                subtotal: 0,
                taxBreakdown: [],
                total: 0
            };
        }

        const subtotal = lines.reduce((sum, line) => sum + this.calculateLine(line), 0);
        const taxBreakdown = this.calculateTaxBreakdown(lines);
        const totalTax = taxBreakdown.reduce((sum, t) => sum + t.tax, 0);
        const total = subtotal + totalTax;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            taxBreakdown,
            total: Math.round(total * 100) / 100
        };
    }

    /**
     * Validate line item calculations
     */
    static validateLine(line: POLine, expectedTotal: number): boolean {
        const calculated = this.calculateLine(line);
        const diff = Math.abs(calculated - expectedTotal);
        return diff < 0.01; // Allow 1 cent rounding difference
    }
}
