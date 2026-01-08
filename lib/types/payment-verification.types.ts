/**
 * Payment Verification Types
 * Backend-truth-first type system for payment verification flow
 */

// ============================================================================
// Backend Payment States (Source of Truth)
// ============================================================================

export type PaymentStatus =
    | 'CREATED'
    | 'INITIATED'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'FAILED'
    | 'EXPIRED'
    | 'DISPUTED'
    | 'REFUNDED';

export type VerificationStatus =
    | 'VERIFYING'           // Initial verification (0-30s)
    | 'DELAYED'             // Verification taking longer (>30s)
    | 'CONFIRMED'           // Payment verified successfully
    | 'ACTIVATING'          // Payment confirmed, subscription provisioning
    | 'FAILED'              // Verification failed
    | 'TIMEOUT';            // Verification timed out

// ============================================================================
// Core Types
// ============================================================================

export interface PaymentData {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    planName?: string;
    planId?: string;
    storeId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface VerificationState {
    status: VerificationStatus;
    paymentData: PaymentData | null;
    elapsed: number;
    error?: VerificationError;
}

export interface VerificationError {
    code: string;
    message: string;
    userMessage: string;
    canRetry: boolean;
}

export interface VerificationResult {
    success: boolean;
    status: PaymentStatus;
    paymentData: PaymentData | null;
    error?: VerificationError;
}

// ============================================================================
// Verification Flow Events
// ============================================================================

export type VerificationEvent =
    | { type: 'VERIFICATION_STARTED'; paymentId: string }
    | { type: 'STATE_CHANGED'; state: VerificationState }
    | { type: 'VERIFICATION_DELAYED'; elapsed: number }
    | { type: 'VERIFICATION_COMPLETED'; result: VerificationResult }
    | { type: 'VERIFICATION_FAILED'; error: VerificationError }
    | { type: 'VERIFICATION_TIMEOUT'; elapsed: number };

export type VerificationEventHandler = (event: VerificationEvent) => void;

// ============================================================================
// Component Props
// ============================================================================

export interface PaymentVerificationFlowProps {
    /** Payment ID from backend */
    paymentId: string;

    /** Razorpay order ID */
    razorpayOrderId: string;

    /** Razorpay payment ID */
    razorpayPaymentId: string;

    /** Razorpay signature */
    razorpaySignature: string;

    /** Plan name for display */
    planName: string;

    /** Payment amount in paise */
    amount: number;

    /** Currency code */
    currency?: string;

    /** Callback when verification completes */
    onComplete: (result: VerificationResult) => void;

    /** Callback when user cancels */
    onCancel?: () => void;

    /** Display mode */
    displayMode?: 'modal' | 'fullscreen';

    /** Custom class name */
    className?: string;
}

export interface VerificationStepProps {
    /** Current payment data */
    paymentData: PaymentData | null;

    /** Elapsed time in milliseconds */
    elapsed: number;

    /** Reference ID to display */
    referenceId: string;

    /** Whether user is premium */
    isPremium?: boolean;

    /** Action handlers */
    onContinue?: () => void;
    onRetry?: () => void;
    onContactSupport?: () => void;
    onViewHistory?: () => void;
    onDownloadReceipt?: () => void;
}

export interface PaymentStatusBadgeProps {
    status: PaymentStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export interface PaymentReferenceProps {
    referenceId: string;
    label?: string;
    copyable?: boolean;
    className?: string;
}

// ============================================================================
// Service Configuration
// ============================================================================

export interface VerificationConfig {
    /** Maximum polling attempts */
    maxAttempts?: number;

    /** Polling interval in milliseconds */
    intervalMs?: number;

    /** Threshold for showing delayed state (ms) */
    delayedThreshold?: number;

    /** Enable debug logging */
    debug?: boolean;
}

export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
    maxAttempts: 20,
    intervalMs: 2000,
    delayedThreshold: 30000,
    debug: false,
};

// ============================================================================
// API Response Types
// ============================================================================

export interface CreateOrderResponse {
    paymentId: string;
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    planName?: string;
    keyId: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    paymentId: string;
    status: PaymentStatus;
    message: string;
}

export interface PaymentStatusResponse {
    paymentId: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    createdAt: string;
    updatedAt: string;
}
