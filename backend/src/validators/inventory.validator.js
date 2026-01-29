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
    // Extended fields for richer medicine data
    saltLinks: z.array(z.object({
        saltId: z.string().optional(), // Optional to allow resolution by name
        name: z.string(),
        strengthValue: z.union([z.string(), z.number()]).optional(),
        strengthUnit: z.string().optional(),
        order: z.number().int()
    })).optional(),
    ocrMetadata: z.any().optional(),
    stripImageUrl: z.string().optional(),
    baseUnit: z.string().optional(),
    displayUnit: z.string().optional(),
    // Allow batchDetails to be passed during drug creation for atomic operations
    batchDetails: z.any().optional()
});

/**
 * Inventory batch creation schema
 */
const batchCreateSchema = z.object({
    storeId: z.string().cuid(),
    drugId: z.string(),
    batchNumber: z.string().min(1, 'Batch number is required'),
    expiryDate: z.string(), // Allow various date formats, service will convert
    quantityInStock: z.number().int().nonnegative('Quantity cannot be negative'),
    mrp: z.number().nonnegative('MRP cannot be negative'),
    purchasePrice: z.number().nonnegative('Purchase price cannot be negative'),
    supplierId: z.string().cuid().optional(),
    supplier: z.string().optional(), // Allow name for resolution
    location: z.string().optional(),
    receivedUnit: z.string().optional(),
    tabletsPerStrip: z.number().int().positive().optional(),
    baseUnitQuantity: z.number().optional(),
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
    drugId: z.string().optional(),
    // Allow single value or array for filters
    stockStatus: z.union([z.string(), z.array(z.string())]).optional(),
    expiryWindow: z.union([z.string(), z.array(z.string())]).optional(),
    storage: z.union([z.string(), z.array(z.string())]).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
}).passthrough();

module.exports = {
    drugSchema,
    batchCreateSchema,
    batchUpdateSchema,
    stockAdjustmentSchema,
    inventoryQuerySchema,
};
