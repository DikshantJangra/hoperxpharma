'use client';

import { FiAlertCircle, FiRefreshCw, FiMail } from 'react-icons/fi';
import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function VerificationFailed({
    referenceId,
    onRetry,
    onContactSupport,
    isPremium = false,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            {/* Supportive Icon */}
            <div className="mb-8">
                <div className={`w-20 h-20 rounded-full ${isPremium ? 'bg-gray-100' : 'bg-gray-50'} flex items-center justify-center border-4 border-gray-200`}>
                    <FiAlertCircle className="w-10 h-10 text-gray-500" strokeWidth={2.5} />
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Payment couldn't be confirmed
            </h2>

            {/* Secondary Reassurance */}
            <div className="text-center space-y-2 mb-8 max-w-md">
                <p className="text-gray-700">We couldn't verify this payment.</p>
                <p className="text-sm text-gray-600 font-medium bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                    No charges will be applied. If money was debited, it will be reversed automatically.
                </p>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} className="mb-8" />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${isPremium
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                )}
                {onContactSupport && (
                    <button
                        onClick={onContactSupport}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-colors"
                    >
                        <FiMail className="w-4 h-4" />
                        Contact Support
                    </button>
                )}
            </div>
        </div>
    );
}
