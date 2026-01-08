'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import { paymentVerificationService } from '@/lib/services/payment-verification.service';
import type {
    PaymentVerificationFlowProps,
    VerificationState,
    VerificationResult,
} from '@/lib/types/payment-verification.types';

import { VerifyingPayment } from './VerifyingPayment';
import { VerificationDelayed } from './VerificationDelayed';
import { PaymentConfirmed } from './PaymentConfirmed';
import { ActivatingAccess } from './ActivatingAccess';
import { VerificationFailed } from './VerificationFailed';
import { VerificationTimeout } from './VerificationTimeout';
import { FiX } from 'react-icons/fi';

export function PaymentVerificationFlow({
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    planName,
    amount,
    currency = 'INR',
    onComplete,
    onCancel,
    displayMode = 'fullscreen',
    className = '',
}: PaymentVerificationFlowProps) {
    const { isPremium } = usePremiumTheme();
    const [state, setState] = useState<VerificationState>({
        status: 'VERIFYING',
        paymentData: null,
        elapsed: 0,
    });
    const [isVerifying, setIsVerifying] = useState(true);

    // Start verification on mount
    useEffect(() => {
        startVerification();
    }, []);

    const startVerification = useCallback(async () => {
        setIsVerifying(true);

        // Subscribe to verification events
        const unsubscribe = paymentVerificationService.on((event) => {
            if (event.type === 'STATE_CHANGED') {
                setState(event.state);
            }
        });

        try {
            // Start verification process
            const result = await paymentVerificationService.verifyPayment({
                paymentId,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            });

            // Handle completion
            handleVerificationComplete(result);
        } catch (error: any) {
            console.error('[PaymentVerificationFlow] Verification error:', error);
            setState({
                status: 'FAILED',
                paymentData: null,
                elapsed: 0,
                error: {
                    code: error?.code || 'UNKNOWN_ERROR',
                    message: error?.message || error?.toString() || 'Verification failed',
                    userMessage: error?.userMessage || 'Payment couldn\'t be confirmed',
                    canRetry: true,
                },
            });
        } finally {
            setIsVerifying(false);
            unsubscribe();
        }
    }, [paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature]);

    const handleVerificationComplete = (result: VerificationResult) => {
        if (result.success) {
            setState({
                status: 'CONFIRMED',
                paymentData: result.paymentData,
                elapsed: 0,
            });
        } else if (result.error?.code === 'VERIFICATION_TIMEOUT') {
            setState({
                status: 'TIMEOUT',
                paymentData: result.paymentData,
                elapsed: 0,
                error: result.error,
            });
        } else {
            setState({
                status: 'FAILED',
                paymentData: result.paymentData,
                elapsed: 0,
                error: result.error,
            });
        }
    };

    const handleRetry = () => {
        startVerification();
    };

    const handleContinue = async () => {
        if (state.paymentData) {
            onComplete({
                success: true,
                status: state.paymentData.status,
                paymentData: state.paymentData,
            });
        }
    };

    const handleContactSupport = () => {
        // Open support modal or navigate to support page
        window.open('mailto:support@hoperxpharma.com', '_blank');
    };

    const handleViewHistory = () => {
        // Navigate to payment history or close and let user check
        onComplete({
            success: false,
            status: 'PROCESSING',
            paymentData: null,
        });
    };

    const handleDownloadReceipt = () => {
        // TODO: Implement receipt download
        console.log('Download receipt for payment:', state.paymentData?.id);
    };

    // Get reference ID for display
    const referenceId = razorpayOrderId || razorpayPaymentId || paymentId;

    // Render appropriate component based on state
    const renderContent = () => {
        const commonProps = {
            paymentData: state.paymentData,
            referenceId,
            elapsed: state.elapsed,
            isPremium,
        };

        switch (state.status) {
            case 'VERIFYING':
                return <VerifyingPayment {...commonProps} />;

            case 'DELAYED':
                return <VerificationDelayed {...commonProps} />;

            case 'CONFIRMED':
                return (
                    <PaymentConfirmed
                        {...commonProps}
                        onContinue={handleContinue}
                        onDownloadReceipt={handleDownloadReceipt}
                    />
                );

            case 'ACTIVATING':
                return <ActivatingAccess {...commonProps} />;

            case 'FAILED':
                return (
                    <VerificationFailed
                        {...commonProps}
                        onRetry={state.error?.canRetry ? handleRetry : undefined}
                        onContactSupport={handleContactSupport}
                    />
                );

            case 'TIMEOUT':
                return (
                    <VerificationTimeout
                        {...commonProps}
                        onViewHistory={handleViewHistory}
                    />
                );

            default:
                return <VerifyingPayment {...commonProps} />;
        }
    };

    // Container styles based on display mode
    const containerClasses = displayMode === 'modal'
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
        : 'min-h-screen bg-gradient-to-br from-gray-50 to-white';

    const contentClasses = displayMode === 'modal'
        ? `${isPremium ? 'bg-white/90 backdrop-blur-xl border-white/20' : 'bg-white'} rounded-3xl shadow-2xl border max-w-2xl w-full mx-4 relative`
        : 'w-full';

    return (
        <div className={`${containerClasses} ${className}`}>
            <div className={contentClasses}>
                {/* Close button (only in modal mode) */}
                {displayMode === 'modal' && onCancel && state.status !== 'VERIFYING' && state.status !== 'DELAYED' && (
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                )}

                {/* Content */}
                {renderContent()}
            </div>
        </div>
    );
}
