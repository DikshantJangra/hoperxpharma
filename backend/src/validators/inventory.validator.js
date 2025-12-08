const { z } = require('zod');

/**
 * Drug creation/update schema
 */
const drugSchema = z.object({
    name: z.string().min(1, 'Drug name is required'),
    strength: z.string().optional(),
    form: z.string().optional(),
    manufacturer: z.string().optional(),
    hsnCode: z.string().optional(),
    gstRate: z.number().min(0).max(100),
    requiresPrescription: z.boolean().default(false),
    defaultUnit: z.string().optional(),
    lowStockThreshold: z.number().int().positive().optional(),
    description: z.string().optional(),
});

/**
 * Inventory batch creation schema
 */
const batchCreateSchema = z.object({
    storeId: z.string().cuid(),
    drugId: z.string().cuid(),
    batchNumber: z.string().min(1, 'Batch number is required'),
    expiryDate: z.string().datetime(),
    quantityInStock: z.number().int().positive('Quantity must be positive'),
    mrp: z.number().positive('MRP must be positive'),
    purchasePrice: z.number().positive('Purchase price must be positive'),
    supplierId: z.string().cuid().optional(),
    location: z.string().optional(),
});

/**
 * Batch update schema
 */
const batchUpdateSchema = z.object({
    quantityInStock: z.number().int().nonnegative().optional(),
    mrp: z.number().positive().optional(),
    location: z.string().optional(),
});

/**
 * Stock adjustment schema
 */
const stockAdjustmentSchema = z.object({
    batchId: z.string().cuid(),
    quantityAdjusted: z.number().int(),
    reason: z.string().min(1, 'Reason is required'),
    // userId is added by controller from req.user.id, not from request body
});

/**
 * Query parameters schema
 */
const inventoryQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    search: z.string().optional(),
    drugId: z.string().cuid().optional(),
    expiringInDays: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
});

module.exports = {
    drugSchema,
    batchCreateSchema,
    batchUpdateSchema,
    stockAdjustmentSchema,
    inventoryQuerySchema,
};
