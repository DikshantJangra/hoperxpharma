const { z } = require('zod');

/**
 * Store creation schema
 */
const storeCreateSchema = z.object({
    name: z.string().min(1, 'Store name is required'),
    displayName: z.string().optional(),
    businessType: z.string().optional(),
    gstin: z.string().optional().nullable(),
    dlNumber: z.string().optional().nullable(),
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional().nullable(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pinCode: z.string().regex(/^\d{6}$/, 'Invalid PIN code'),
    landmark: z.string().optional().nullable(),
    phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit phone number'),
    email: z.string().email().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    storeLogo: z.string().optional().nullable(),
    is24x7: z.boolean().optional(),
    homeDelivery: z.boolean().optional(),
});

/**
 * Store update schema
 */
const storeUpdateSchema = storeCreateSchema.partial();

/**
 * License schema
 */
const licenseSchema = z.object({
    type: z.enum(['Drug License', 'FSSAI', 'GST', 'Other']),
    licenseNumber: z.string().min(1, 'License number is required'),
    issuedBy: z.string().min(1, 'Issuing authority is required'),
    issuedDate: z.string(),
    expiryDate: z.string(),
    documentUrl: z.string().optional().nullable(),
});

/**
 * Operating hours schema
 */
const operatingHoursSchema = z.object({
    dayOfWeek: z.union([z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']), z.number().min(0).max(6)]),
    openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
    isClosed: z.boolean().default(false),
    lunchStart: z.string().optional().nullable(),
    lunchEnd: z.string().optional().nullable(),
});

/**
 * Device schema
 */
const deviceSchema = z.object({
    name: z.string().min(1, 'Device name is required'),
    type: z.enum(['POS', 'Tablet', 'Mobile', 'Desktop']),
    deviceId: z.string().min(1, 'Device ID is required'),
    isActive: z.boolean().default(true),
});

/**
 * Complete onboarding schema
 */
const completeOnboardingSchema = z.object({
    store: storeCreateSchema,
    licenses: z.array(licenseSchema).optional(),
    operatingHours: z.array(operatingHoursSchema).optional(),
    suppliers: z.array(z.any()).optional(),
    users: z.array(z.any()).optional(),
});

module.exports = {
    storeCreateSchema,
    storeUpdateSchema,
    licenseSchema,
    operatingHoursSchema,
    deviceSchema,
    completeOnboardingSchema,
};
