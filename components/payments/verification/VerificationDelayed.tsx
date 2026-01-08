'use client';

import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function VerificationDelayed({
    referenceId,
    isPremium = false,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            {/* Slower Animation */}
            <div className="mb-8">
                <div className="relative w-20 h-20">
                    {/* Extra slow wave animation */}
                    <div className={`absolute inset-0 rounded-full border-4 border-blue-200 animate-ping opacity-60 ${isPremium ? 'border-blue-300' : ''}`} style={{ animationDuration: '3s' }}></div>
                    <div className={`absolute inset-0 rounded-full border-4 ${isPremium ? 'border-blue-400 bg-blue-50' : 'border-blue-300 bg-blue-50'}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Verification in progress
            </h2>

            {/* Secondary Reassurance */}
            <div className="text-center space-y-2 mb-8 max-w-md">
                <p className="text-gray-700">Still confirming — everything looks fine so far.</p>
                <p className="text-sm text-gray-500">
                    Some verifications take a little longer. You don't need to do anything.
                </p>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} className="mb-6" />

            {/* Permission to leave */}
            <p className="text-xs text-gray-400 text-center max-w-sm">
                We'll notify you when done. Feel free to continue using the app.
            </p>
        </div>
    );
}
