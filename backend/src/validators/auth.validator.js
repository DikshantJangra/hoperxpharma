const { z } = require('zod');

/**
 * Signup validation schema
 */
const signupSchema = z.object({
    email: z.string().email('Invalid email format'),
    phoneNumber: z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number. Must be in format +91XXXXXXXXXX'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    role: z.enum(['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/**
 * Login validation schema
 */
const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Password reset request schema
 */
const passwordResetRequestSchema = z.object({
    email: z.string().email('Invalid email format'),
});

/**
 * Password reset schema
 */
const passwordResetSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

module.exports = {
    signupSchema,
    loginSchema,
    refreshTokenSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
};
