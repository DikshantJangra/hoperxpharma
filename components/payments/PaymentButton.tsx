'use client';

import React, { useState } from 'react';
import { loadRazorpayScript, createRazorpayOptions } from '@/lib/razorpay';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { FiLoader } from 'react-icons/fi';

interface PaymentButtonProps {
    amount: number;
    currency?: string;
    description?: string;
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
    user,
    onSuccess,
    onError,
    className
}: PaymentButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        const res = await loadRazorpayScript();

        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            setLoading(false);
            if (onError) onError(new Error('Razorpay SDK failed to load'));
            return;
        }

        try {
            // 1. Create Order
            // storeId is passed in body as backend expects it (if not inferred from token)
            const orderPayload: any = {
                amount: amount,
                currency: currency,
                receipt: `receipt_${Date.now()}`
            };

            if (user?.storeId) {
                orderPayload.storeId = user.storeId;
            }

            const order = await apiClient.post('/payments/orders', orderPayload);

            // 2. Open Checkout
            const options = createRazorpayOptions(order, user, async (response: any) => {
                try {
                    // 3. Verify Payment
                    const verifyRes = await apiClient.post('/payments/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });

                    if (onSuccess) onSuccess(verifyRes);
                    else alert('Payment Successful!');

                } catch (err) {
                    console.error("Verification Error", err);
                    if (onError) onError(err);
                    else alert('Payment Verification Failed');
                }
            });

            // TS issue: window.Razorpay might not be defined. Cast window as any.
            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                console.error(response.error);
                if (onError) onError(response.error);
                else alert(response.error.description);
            });
            paymentObject.open();
        } catch (error) {
            console.error(error);
            if (onError) onError(error);
            else alert('Payment Initiation Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handlePayment} disabled={loading} className={className}>
            {loading && <FiLoader className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Processing...' : 'Pay Now'}
        </Button>
    );
}
