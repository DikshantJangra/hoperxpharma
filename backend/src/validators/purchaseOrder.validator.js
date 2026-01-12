const Joi = require('joi');

/**
 * Validation schemas for Purchase Orders
 */

const poLineItemSchema = Joi.object({
    lineId: Joi.string().optional(),
    drugId: Joi.string().required(),
    description: Joi.string().required(),
    packUnit: Joi.string().optional(),
    packSize: Joi.number().optional(),
    qty: Joi.number().min(1).required(),
    unit: Joi.string().optional(),
    pricePerUnit: Joi.number().min(0).required(),
    discountPercent: Joi.number().min(0).max(100).default(0),
    gstPercent: Joi.number().valid(0, 5, 12, 18, 28).required(),
    lineNet: Joi.number().min(0).optional(),
    lastPurchasePrice: Joi.number().optional(),
    suggestedQty: Joi.number().optional(),
    reorderReason: Joi.string().optional(),
    preferredBatch: Joi.string().optional(),
    notes: Joi.string().optional(),
    moq: Joi.number().optional()
});

const poCreateSchema = Joi.object({
    supplierId: Joi.string().required(),
    items: Joi.array().items(poLineItemSchema).min(1).required(),
    expectedDeliveryDate: Joi.date().optional(),
    paymentTerms: Joi.string().optional(),
    subtotal: Joi.number().min(0).required(),
    taxAmount: Joi.number().min(0).required(),
    total: Joi.number().min(0).required(),
    currency: Joi.string().default('INR'),
    notes: Joi.string().allow('', null).optional()
});

const poUpdateSchema = Joi.object({
    supplierId: Joi.string().optional(),
    items: Joi.array().items(poLineItemSchema).optional(),
    expectedDeliveryDate: Joi.date().optional(),
    paymentTerms: Joi.string().optional(),
    subtotal: Joi.number().min(0).optional(),
    taxAmount: Joi.number().min(0).optional(),
    total: Joi.number().min(0).optional(),
    status: Joi.string().valid('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED').optional(),
    notes: Joi.string().allow('', null).optional()
});

const poValidateSchema = Joi.object({
    supplier: Joi.object().optional(),
    supplierId: Joi.string().optional(),
    lines: Joi.array().items(poLineItemSchema).min(1).required(),
    subtotal: Joi.number().min(0).required(),
    total: Joi.number().min(0).required()
}).or('supplier', 'supplierId'); // At least one must be present

const supplierCreateSchema = Joi.object({
    name: Joi.string().required(),
    category: Joi.string().valid('Distributor', 'Manufacturer', 'Wholesaler').required(),
    status: Joi.string().valid('Active', 'Inactive').default('Active'),
    gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
    dlNumber: Joi.string().optional(),
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    contactName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    email: Joi.string().email().optional(),
    whatsapp: Joi.string().optional(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pinCode: Joi.string().required(),
    paymentTerms: Joi.string().optional(),
    creditLimit: Joi.number().optional()
});

const supplierUpdateSchema = Joi.object({
    name: Joi.string().optional(),
    category: Joi.string().valid('Distributor', 'Manufacturer', 'Wholesaler').optional(),
    status: Joi.string().valid('Active', 'Inactive').optional(),
    gstin: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
    dlNumber: Joi.string().optional(),
    pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
    contactName: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    email: Joi.string().email().optional(),
    whatsapp: Joi.string().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pinCode: Joi.string().optional(),
    paymentTerms: Joi.string().optional(),
    creditLimit: Joi.number().optional()
});

const receiptCreateSchema = Joi.object({
    poId: Joi.string().required(),
    notes: Joi.string().optional(),
    itemsReceived: Joi.array().items(
        Joi.object({
            drugId: Joi.string().required(),
            quantityReceived: Joi.number().min(1).required(),
            batchNumber: Joi.string().required(),
            expiryDate: Joi.date().required(),
            mrp: Joi.number().min(0).required(),
            purchasePrice: Joi.number().min(0).required()
        })
    ).min(1).required()
});

const poQuerySchema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    status: Joi.string().optional(), // Can be single or comma-separated values like "SENT,PARTIALLY_RECEIVED"
    supplierId: Joi.string().optional(),
    storeId: Joi.string().optional(),
    search: Joi.string().optional()
});

module.exports = {
    poCreateSchema,
    poUpdateSchema,
    poValidateSchema,
    supplierCreateSchema,
    supplierUpdateSchema,
    receiptCreateSchema,
    poQuerySchema
};
