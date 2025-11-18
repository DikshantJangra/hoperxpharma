import { PurchaseOrder, POLine, ValidationResult } from '@/types/po';

export function validatePO(po: PurchaseOrder): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!po.supplier) {
    errors.push('Supplier selection is required');
  }

  if (po.lines.length === 0) {
    errors.push('At least one line item is required');
  }

  if (!po.deliveryAddress.line1 || !po.deliveryAddress.city || !po.deliveryAddress.pin) {
    errors.push('Complete delivery address is required');
  }

  // Supplier validation
  if (po.supplier) {
    if (po.supplier.gstin && !isValidGSTIN(po.supplier.gstin)) {
      warnings.push('Supplier GSTIN format appears invalid');
    }
  }

  // Line item validation
  po.lines.forEach((line, index) => {
    validateLine(line, index + 1, errors, warnings);
  });

  // Expected delivery date validation
  if (po.expectedDeliveryDate) {
    const expectedDate = new Date(po.expectedDeliveryDate);
    const today = new Date();
    const minDate = new Date(today.getTime() + (po.supplier?.defaultLeadTimeDays || 0) * 24 * 60 * 60 * 1000);
    
    if (expectedDate < minDate) {
      warnings.push(`Expected delivery date is earlier than supplier lead time (${po.supplier?.defaultLeadTimeDays || 0} days)`);
    }
  }

  // Total validation
  if (po.total <= 0) {
    errors.push('PO total must be greater than zero');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateLine(line: POLine, lineNumber: number, errors: string[], warnings: string[]): void {
  const prefix = `Line ${lineNumber}:`;

  // Required fields
  if (!line.description.trim()) {
    errors.push(`${prefix} Product description is required`);
  }

  if (line.qty <= 0) {
    errors.push(`${prefix} Quantity must be greater than zero`);
  }

  if (line.pricePerUnit < 0) {
    errors.push(`${prefix} Price cannot be negative`);
  }

  if (line.gstPercent < 0 || line.gstPercent > 100) {
    errors.push(`${prefix} GST percentage must be between 0 and 100`);
  }

  if (line.discountPercent < 0 || line.discountPercent > 100) {
    errors.push(`${prefix} Discount percentage must be between 0 and 100`);
  }

  // Business rule validations
  if (line.moq && line.qty < line.moq) {
    warnings.push(`${prefix} Quantity (${line.qty}) is below supplier MOQ (${line.moq})`);
  }

  // Price deviation check
  if (line.lastPurchasePrice && line.pricePerUnit > 0) {
    const deviation = Math.abs(line.pricePerUnit - line.lastPurchasePrice) / line.lastPurchasePrice;
    if (deviation > 0.2) {
      warnings.push(`${prefix} Price differs from last purchase by ${Math.round(deviation * 100)}%`);
    }
  }

  // GST rate validation for pharmaceuticals
  const validGSTRates = [0, 5, 12, 18, 28];
  if (!validGSTRates.includes(line.gstPercent)) {
    warnings.push(`${prefix} Unusual GST rate (${line.gstPercent}%) for pharmaceutical products`);
  }
}

function isValidGSTIN(gstin: string): boolean {
  // Basic GSTIN format validation (15 characters, alphanumeric)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

export function calculateLineTotal(line: POLine): number {
  const baseAmount = line.qty * line.pricePerUnit;
  const discountAmount = baseAmount * (line.discountPercent / 100);
  return baseAmount - discountAmount;
}

export function calculateTaxBreakdown(lines: POLine[]) {
  const taxMap = new Map<number, { taxable: number; tax: number }>();
  
  lines.forEach(line => {
    const taxable = calculateLineTotal(line);
    const tax = (taxable * line.gstPercent) / 100;
    
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

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function generatePONumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `PO-${year}-${timestamp}`;
}