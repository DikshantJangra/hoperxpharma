/**
 * Payment Verification Service
 * Backend-truth-first verification orchestration
 * 
 * Core principle: Every UI state is driven by backend truth.
 * No optimistic updates. No client-side state invention.
 */

import { apiClient } from '@/lib/api/client';
import type {
    VerificationConfig,
    VerificationState,
    VerificationResult,
    VerificationEventHandler,
    PaymentData,
    PaymentStatus,
    VerificationError,
} from '@/lib/types/payment-verification.types';

const DEFAULT_VERIFICATION_CONFIG: Required<VerificationConfig> = {
    maxAttempts: 20,
    intervalMs: 2000,
    delayedThreshold: 30000,
    debug: false,
};

export class PaymentVerificationService {
    private config: Required<VerificationConfig>;
    private eventHandlers: Set<VerificationEventHandler> = new Set();

    constructor(config: VerificationConfig = {}) {
        this.config = {
            ...DEFAULT_VERIFICATION_CONFIG,
            ...config,
        } as Required<VerificationConfig>;
    }

    /**
     * Subscribe to verification events
     */
    public on(handler: VerificationEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => this.eventHandlers.delete(handler);
    }

    /**
     * Emit event to all subscribers
     */
    private emit(event: any): void {
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error('[PaymentVerification] Event handler error:', error);
            }
        });
    }

    /**
     * Start verification flow
     */
    public async verifyPayment(params: {
        paymentId: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<VerificationResult> {
        this.log('Starting verification', params);

        this.emit({
            type: 'VERIFICATION_STARTED',
            paymentId: params.paymentId,
        });

        try {
            // Step 1: Submit signature verification to backend
            await this.submitSignature(params);

            // Step 2: Poll for final status
            const result = await this.pollPaymentStatus(params.paymentId);

            this.emit({
                type: 'VERIFICATION_COMPLETED',
                result,
            });

            return result;
        } catch (error: any) {
            const verificationError = this.createError(error);

            this.emit({
                type: 'VERIFICATION_FAILED',
                error: verificationError,
            });

            return {
                success: false,
                status: 'FAILED',
                paymentData: null,
                error: verificationError,
            };
        }
    }

    /**
     * Submit signature to backend for verification
     */
    private async submitSignature(params: {
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    }): Promise<void> {
        this.log('Submitting signature for verification');

        const response = await apiClient.post('/payments/verify', {
            razorpay_order_id: params.razorpayOrderId,
            razorpay_payment_id: params.razorpayPaymentId,
            razorpay_signature: params.razorpaySignature,
        });

        this.log('Signature verification response:', response.data);
    }

    /**
     * Poll payment status until terminal state
     */
    private async pollPaymentStatus(paymentId: string): Promise<VerificationResult> {
        const startTime = Date.now();
        let delayedEmitted = false;

        for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
            // Wait before polling (except first attempt)
            if (attempt > 0) {
                await this.sleep(this.config.intervalMs);
            }

            const elapsed = Date.now() - startTime;

            try {
                // Fetch current status from backend
                const response = await apiClient.get(`/payments/${paymentId}/status`);
                const paymentData = response.data.data as PaymentData;
                const status = paymentData.status;

                this.log(`Poll attempt ${attempt + 1}: Status=${status}, Elapsed=${elapsed}ms`);

                // Emit appropriate state
                const verificationStatus = this.mapToVerificationStatus(status, elapsed);

                const state: VerificationState = {
                    status: verificationStatus,
                    paymentData,
                    elapsed,
                };

                this.emit({
                    type: 'STATE_CHANGED',
                    state,
                });

                // Emit delayed notification if threshold exceeded
                if (!delayedEmitted && elapsed > this.config.delayedThreshold && status === 'PROCESSING') {
                    this.emit({
                        type: 'VERIFICATION_DELAYED',
                        elapsed,
                    });
                    delayedEmitted = true;
                }

                // Check for terminal states
                if (status === 'SUCCESS') {
                    return {
                        success: true,
                        status,
                        paymentData,
                    };
                }

                if (status === 'FAILED' || status === 'EXPIRED') {
                    return {
                        success: false,
                        status,
                        paymentData,
                        error: {
                            code: 'VERIFICATION_FAILED',
                            message: `Payment verification failed with status: ${status}`,
                            userMessage: 'Payment couldn\'t be confirmed',
                            canRetry: true,
                        },
                    };
                }

                // Continue polling for non-terminal states
            } catch (error) {
                this.log('Polling error:', error);
                // Continue polling on error (network issues, etc.)
            }
        }

        // Timeout - max attempts reached
        this.log('Verification timeout - max attempts reached');

        this.emit({
            type: 'VERIFICATION_TIMEOUT',
            elapsed: Date.now() - startTime,
        });

        return {
            success: false,
            status: 'PROCESSING', // Still processing, not failed
            paymentData: null,
            error: {
                code: 'VERIFICATION_TIMEOUT',
                message: 'Payment verification timeout - please check payment history',
                userMessage: 'Verification is taking longer than usual',
                canRetry: false,
            },
        };
    }

    /**
     * Map backend status to verification status
     */
    private mapToVerificationStatus(
        backendStatus: PaymentStatus,
        elapsed: number
    ): VerificationState['status'] {
        switch (backendStatus) {
            case 'SUCCESS':
                return 'CONFIRMED';
            case 'FAILED':
            case 'EXPIRED':
                return 'FAILED';
            case 'PROCESSING':
                return elapsed > this.config.delayedThreshold ? 'DELAYED' : 'VERIFYING';
            default:
                return 'VERIFYING';
        }
    }

    /**
     * Create user-facing error from exception
     */
    private createError(error: any): VerificationError {
        // Network errors
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return {
                code: 'NETWORK_ERROR',
                message: error.message,
                userMessage: 'Network connection issue. Please check your internet connection.',
                canRetry: true,
            };
        }

        // API errors
        if (error.response?.data?.message) {
            return {
                code: error.response.data.code || 'API_ERROR',
                message: error.response.data.message,
                userMessage: error.response.data.message,
                canRetry: false,
            };
        }

        // Generic error
        return {
            code: 'UNKNOWN_ERROR',
            message: error.message || 'Unknown error',
            userMessage: 'Payment couldn\'t be confirmed',
            canRetry: true,
        };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debug logging
     */
    private log(...args: any[]): void {
        if (this.config.debug) {
            console.log('[PaymentVerification]', ...args);
        }
    }
}

// Singleton instance
export const paymentVerificationService = new PaymentVerificationService({
    debug: process.env.NODE_ENV === 'development',
});
