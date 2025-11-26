const { z } = require('zod');

/**
 * Patient creation schema
 */
const patientCreateSchema = z.object({
    storeId: z.string().cuid(),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            // If it's just a date (YYYY-MM-DD), convert to ISO datetime
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                return new Date(val + 'T00:00:00.000Z').toISOString();
            }
            return val;
        }),
    gender: z.string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            // Normalize to proper case
            const normalized = val.toLowerCase();
            if (normalized === 'male') return 'Male';
            if (normalized === 'female') return 'Female';
            if (normalized === 'other') return 'Other';
            return val; // Return original if doesn't match
        })
        .pipe(z.enum(['Male', 'Female', 'Other']).optional()),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    email: z.string().email().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/, 'Invalid PIN code').optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    chronicConditions: z.array(z.string()).optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
});

/**
 * Patient update schema
 */
const patientUpdateSchema = z.object({
    firstName: z.string().min(1).optional(),
    middleName: z.string().optional(),
    lastName: z.string().min(1).optional(),
    dateOfBirth: z.string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            // If it's just a date (YYYY-MM-DD), convert to ISO datetime
            if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                return new Date(val + 'T00:00:00.000Z').toISOString();
            }
            return val;
        }),
    gender: z.string()
        .optional()
        .transform((val) => {
            if (!val) return undefined;
            // Normalize to proper case
            const normalized = val.toLowerCase();
            if (normalized === 'male') return 'Male';
            if (normalized === 'female') return 'Female';
            if (normalized === 'other') return 'Other';
            return val;
        })
        .pipe(z.enum(['Male', 'Female', 'Other']).optional()),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/).optional(),
    email: z.string().email().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pinCode: z.string().regex(/^\d{6}$/).optional(),
    bloodGroup: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    chronicConditions: z.array(z.string()).optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
});

/**
 * Consent creation schema
 */
const consentCreateSchema = z.object({
    patientId: z.string().cuid(),
    type: z.enum(['Data Processing', 'Marketing', 'WhatsApp']),
    status: z.enum(['Active', 'Withdrawn']).default('Active'),
    expiryDate: z.string().datetime().optional(),
    digitalSignatureUrl: z.string().url().optional(),
});

/**
 * Insurance creation schema
 */
const insuranceCreateSchema = z.object({
    patientId: z.string().cuid(),
    provider: z.string().min(1, 'Provider is required'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    groupNumber: z.string().optional(),
    validUntil: z.string().datetime(),
    status: z.enum(['active', 'inactive']).default('active'),
});

/**
 * Query parameters schema
 */
const patientQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
    search: z.string().optional(),
});

module.exports = {
    patientCreateSchema,
    patientUpdateSchema,
    consentCreateSchema,
    insuranceCreateSchema,
    patientQuerySchema,
};
