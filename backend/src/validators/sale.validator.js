const { z } = require('zod');

/**
 * Sale item schema with discount validation
 */
const saleItemSchema = z.object({
    drugId: z.string().min(1), // Allow non-CUID strings for legacy data
    batchId: z.string().min(1), // Allow non-CUID strings for legacy data
    quantity: z.number().int().positive(),
    mrp: z.number().positive(),
    discount: z.number().min(0).default(0),
    gstRate: z.number().min(0).max(100),
    lineTotal: z.number().positive(),
}).refine((item) => {
    // Validate discount doesn't exceed item total
    const itemTotal = item.mrp * item.quantity;
    if (item.discount > itemTotal) {
        return false;
    }
    return true;
}, {
    message: 'Item discount cannot exceed item total',
    path: ['discount']
});

/**
 * Payment split schema
 */
const paymentSplitSchema = z.object({
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'WALLET', 'CREDIT']),
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
 * Sale creation schema with comprehensive validation
 */
const saleCreateSchema = z.object({
    storeId: z.string().cuid().optional(), // Added by middleware
    patientId: z.string().cuid().optional().nullable(),
    invoiceType: z.enum(['RECEIPT', 'GST_INVOICE', 'CREDIT_NOTE', 'ESTIMATE']).default('RECEIPT'),
    items: z.array(saleItemSchema).min(1, 'At least one item is required'),
    paymentSplits: z.array(paymentSplitSchema).min(1, 'At least one payment method is required'),
    subtotal: z.number().positive(),
    discountAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0),
    roundOff: z.number()
        .min(-1)
        .max(1)
        .default(0)
        .refine(val => Math.abs(val) < 1, {
            message: 'Round-off should be less than ₹1'
        }),
    total: z.number().positive(),
    soldBy: z.string().cuid().optional(), // Added by middleware
    prescriptionId: z.string().optional().nullable(),
    invoiceNumber: z.string().optional(), // Allow manual override or auto-generated
    shouldCreateRefill: z.boolean().optional(),
}).refine((sale) => {
    // Validate overall discount doesn't exceed subtotal
    if (sale.discountAmount > sale.subtotal) {
        return false;
    }
    return true;
}, {
    message: 'Overall discount cannot exceed subtotal',
    path: ['discountAmount']
}).refine((sale) => {
    // Validate payment splits sum matches total (within 1 rupee tolerance for rounding)
    const paymentTotal = sale.paymentSplits.reduce((sum, p) => sum + p.amount, 0);
    const difference = Math.abs(paymentTotal - sale.total);
    if (difference > 1) {
        return false;
    }
    return true;
}, {
    message: 'Payment total must match sale total',
    path: ['paymentSplits']
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
