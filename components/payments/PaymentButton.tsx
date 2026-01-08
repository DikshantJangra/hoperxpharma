'use client';

import React, { useState } from 'react';
import { loadRazorpayScript, createRazorpayOptions } from '@/lib/razorpay';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { FiLoader } from 'react-icons/fi';
import { PaymentVerificationFlow } from '@/components/payments/verification';
import type { VerificationResult } from '@/lib/types/payment-verification.types';

interface PaymentButtonProps {
    amount: number;
    currency?: string;
    description?: string;
    planName?: string;
    user?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phoneNumber?: string;
        storeId?: string;
    };
    onSuccess?: (payment: any) => void;
    onError?: (error: any) => void;
    className?: string;
}

export function PaymentButton({
    amount,
    currency = 'INR',
    description = "Subscription",
    planName = "Subscription Payment",
    user,
    onSuccess,
    onError,
    className
}: PaymentButtonProps) {
    const [loading, setLoading] = useState(false);
    const [verificationData, setVerificationData] = useState<{
        paymentId: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
    } | null>(null);

    const handlePayment = async () => {
        setLoading(true);
        const res = await loadRazorpayScript();

        if (!res) {
            if (onError) onError(new Error('Razorpay SDK failed to load. Please check your internet connection.'));
            setLoading(false);
            return;
        }

        try {
            // 1. Create Order
            const orderPayload: any = {
                amount: amount,
                currency: currency,
                receipt: `receipt_${Date.now()}`
            };

            if (user?.storeId) {
                orderPayload.storeId = user.storeId;
            }

            const orderResponse = await apiClient.post('/payments/orders', orderPayload);
            const orderData = orderResponse.data.data;

            // 2. Open Checkout
            const options = createRazorpayOptions(orderData, user, async (response: any) => {
                // Razorpay success - now start verification flow
                setVerificationData({
                    paymentId: orderData.paymentId || orderData.id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                });
                setLoading(false);
            });

            // Open Razorpay modal
            const paymentObject = new (window as any).Razorpay(options);

            paymentObject.on('payment.failed', function (response: any) {
                console.error('[Payment] Razorpay payment failed:', response.error);
                if (onError) onError(response.error);
                setLoading(false);
            });

            paymentObject.open();
        } catch (error) {
            console.error('[Payment] Payment initiation failed:', error);
            if (onError) onError(error);
            setLoading(false);
        }
    };

    const handleVerificationComplete = (result: VerificationResult) => {
        setVerificationData(null);

        if (result.success) {
            if (onSuccess) onSuccess(result.paymentData);
        } else {
            if (onError) onError(result.error);
        }
    };

    const handleVerificationCancel = () => {
        setVerificationData(null);
    };

    return (
        <>
            <Button onClick={handlePayment} disabled={loading} className={className}>
                {loading && <FiLoader className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Processing...' : 'Pay Now'}
            </Button>

            {/* Verification Flow Modal */}
            {verificationData && (
                <PaymentVerificationFlow
                    paymentId={verificationData.paymentId}
                    razorpayOrderId={verificationData.razorpayOrderId}
                    razorpayPaymentId={verificationData.razorpayPaymentId}
                    razorpaySignature={verificationData.razorpaySignature}
                    planName={planName}
                    amount={amount}
                    currency={currency}
                    onComplete={handleVerificationComplete}
                    onCancel={handleVerificationCancel}
                    displayMode="modal"
                />
            )}
        </>
    );
}
