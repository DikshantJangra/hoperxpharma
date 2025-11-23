const { z } = require('zod');

/**
 * Sale item schema
 */
const saleItemSchema = z.object({
    drugId: z.string().cuid(),
    batchId: z.string().cuid(),
    quantity: z.number().int().positive(),
    mrp: z.number().positive(),
    discount: z.number().min(0).default(0),
    gstRate: z.number().min(0).max(100),
    lineTotal: z.number().positive(),
});

/**
 * Payment split schema
 */
const paymentSplitSchema = z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'WALLET']),
    amount: z.number().positive(),
    cardLast4: z.string().optional(),
    cardBrand: z.string().optional(),
    cardAuthCode: z.string().optional(),
    upiTransactionId: z.string().optional(),
    upiVpa: z.string().optional(),
    walletProvider: z.string().optional(),
    walletTxnId: z.string().optional(),
});

/**
 * Sale creation schema
 */
const saleCreateSchema = z.object({
    storeId: z.string().cuid(),
    patientId: z.string().cuid().optional(),
    invoiceType: z.enum(['RECEIPT', 'GST_INVOICE', 'CREDIT_NOTE']).default('RECEIPT'),
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    paymentSplits: z.array(paymentSplitSchema).min(1, 'At least one payment method is required'),
    subtotal: z.number().positive(),
    discountAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0),
    roundOff: z.number().default(0),
    total: z.number().positive(),
    soldBy: z.string().cuid(),
});

/**
 * Query parameters schema
 */
const saleQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    patientId: z.string().cuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

module.exports = {
    saleCreateSchema,
    saleQuerySchema,
};
