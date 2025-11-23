const { z } = require('zod');

/**
 * Supplier creation schema
 */
const supplierCreateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum(['Distributor', 'Manufacturer', 'Wholesaler']),
    status: z.enum(['Active', 'Inactive']).default('Active'),
    gstin: z.string().optional(),
    dlNumber: z.string().optional(),
    pan: z.string().optional(),
    contactName: z.string().min(1, 'Contact name is required'),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    email: z.string().email().optional(),
    whatsapp: z.string().optional(),
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pinCode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
    paymentTerms: z.string().optional(),
    creditLimit: z.number().positive().optional(),
});

/**
 * Supplier update schema
 */
const supplierUpdateSchema = supplierCreateSchema.partial();

/**
 * PO item schema
 */
const poItemSchema = z.object({
    drugId: z.string().cuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discountPercent: z.number().min(0).max(100).default(0),
    gstPercent: z.number().min(0).max(100),
    lineTotal: z.number().positive(),
});

/**
 * Purchase order creation schema
 */
const poCreateSchema = z.object({
    storeId: z.string().cuid(),
    supplierId: z.string().cuid(),
    items: z.array(poItemSchema).min(1, 'At least one item is required'),
    expectedDeliveryDate: z.string().datetime().optional(),
    subtotal: z.number().positive(),
    taxAmount: z.number().min(0),
    total: z.number().positive(),
    paymentTerms: z.string().optional(),
    createdBy: z.string().cuid(),
});

/**
 * PO receipt item schema
 */
const receiptItemSchema = z.object({
    drugId: z.string().cuid(),
    quantityReceived: z.number().int().positive(),
    batchNumber: z.string().min(1),
    expiryDate: z.string().datetime(),
    mrp: z.number().positive(),
    purchasePrice: z.number().positive(),
});

/**
 * PO receipt creation schema
 */
const receiptCreateSchema = z.object({
    poId: z.string().cuid(),
    receivedBy: z.string().cuid(),
    notes: z.string().optional(),
    itemsReceived: z.array(receiptItemSchema).min(1, 'At least one item is required'),
});

/**
 * Query parameters schema
 */
const poQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED']).optional(),
    supplierId: z.string().cuid().optional(),
    search: z.string().optional(),
});

module.exports = {
    supplierCreateSchema,
    supplierUpdateSchema,
    poCreateSchema,
    receiptCreateSchema,
    poQuerySchema,
};
