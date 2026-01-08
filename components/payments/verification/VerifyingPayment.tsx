'use client';

import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function VerifyingPayment({
    referenceId,
    isPremium = false,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            {/* Animation */}
            <div className="mb-8">
                <div className="relative w-20 h-20">
                    {/* Calm wave animation */}
                    <div className={`absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-75 ${isPremium ? 'border-emerald-300' : ''}`} style={{ animationDuration: '2s' }}></div>
                    <div className={`absolute inset-0 rounded-full border-4 ${isPremium ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-300 bg-emerald-50'}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Verifying your payment
            </h2>

            {/* Secondary Reassurance */}
            <div className="text-center space-y-2 mb-8 max-w-md">
                <p className="text-gray-700">We're confirming your payment.</p>
                <p className="text-sm text-gray-500">
                    This usually takes a few moments. Your payment details are safely received.
                </p>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} className="mb-6" />

            {/* Permission to leave */}
            <p className="text-xs text-gray-400 text-center max-w-sm">
                You can navigate away – we'll notify you when this completes.
            </p>
        </div>
    );
}
