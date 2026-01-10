const Joi = require('joi');

/**
 * GRN Validation Schemas
 */

const createGRNSchema = Joi.object({
    poId: Joi.string().required(),
    receivedBy: Joi.string().optional()
});

const updateGRNItemSchema = Joi.object({
    receivedQty: Joi.number().integer().min(0).allow(null).optional(),
    freeQty: Joi.number().integer().min(0).allow(null).optional(),
    rejectedQty: Joi.number().integer().min(0).allow(null).optional(),
    batchNumber: Joi.string().max(50).allow('', null).optional(),
    expiryDate: Joi.date().allow(null, '').optional(),
    mrp: Joi.number().min(0).allow(null).optional(),
    unitPrice: Joi.number().min(0).allow(null).optional(),
    discountPercent: Joi.number().min(0).max(100).allow(null).optional(),
    discountType: Joi.string().valid('BEFORE_GST', 'AFTER_GST').allow(null).optional(),
    gstPercent: Joi.number().valid(0, 5, 12, 18, 28).allow(null).optional(),
    location: Joi.string().max(100).allow('', null).optional(),
    manufacturerBarcode: Joi.string().allow('', null).optional()
});

const splitBatchSchema = Joi.object({
    splitData: Joi.array().items(
        Joi.object({
            receivedQty: Joi.number().integer().min(0).required(),
            freeQty: Joi.number().integer().min(0).default(0),
            batchNumber: Joi.string().required(),
            expiryDate: Joi.date().required(),
            mrp: Joi.number().min(0).required(),
            unitPrice: Joi.number().min(0).required(),
            discountPercent: Joi.number().min(0).max(100).default(0),
            discountType: Joi.string().valid('BEFORE_GST', 'AFTER_GST').default('BEFORE_GST'),
            gstPercent: Joi.number().valid(0, 5, 12, 18, 28).required(),
            location: Joi.string().max(100).allow('', null).optional(),
            manufacturerBarcode: Joi.string().allow('', null).optional()
        })
    ).min(2).required()
});

const recordDiscrepancySchema = Joi.object({
    grnItemId: Joi.string().allow(null).optional(),
    reason: Joi.string().valid('SHORTAGE', 'OVERAGE', 'DAMAGED', 'EXPIRED', 'WRONG_ITEM', 'MISSING').required(),
    resolution: Joi.string().valid('BACKORDER', 'CANCELLED', 'DEBIT_NOTE', 'ACCEPTED').allow(null).optional(),
    description: Joi.string().required(),
    expectedQty: Joi.number().integer().min(0).allow(null).optional(),
    actualQty: Joi.number().integer().min(0).allow(null).optional(),
    discrepancyQty: Joi.number().integer().min(0).allow(null).optional(),
    debitNoteValue: Joi.number().min(0).allow(null).optional()
});

const completeGRNSchema = Joi.object({
    supplierInvoiceNo: Joi.string().max(50).optional(),
    supplierInvoiceDate: Joi.date().allow(null, '').optional(),
    notes: Joi.string().max(1000).optional(),
    targetStatus: Joi.string().valid('COMPLETED', 'IN_PROGRESS').optional() // Only valid GRN statuses
});

module.exports = {
    createGRNSchema,
    updateGRNItemSchema,
    splitBatchSchema,
    recordDiscrepancySchema,
    completeGRNSchema
};
