'use client';

import { FiClock, FiList } from 'react-icons/fi';
import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function VerificationTimeout({
    referenceId,
    onViewHistory,
    isPremium = false,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            {/* Patient Icon */}
            <div className="mb-8">
                <div className={`w-20 h-20 rounded-full ${isPremium ? 'bg-blue-100' : 'bg-blue-50'} flex items-center justify-center border-4 border-blue-200`}>
                    <FiClock className="w-10 h-10 text-blue-600" strokeWidth={2.5} />
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Verification is taking longer than usual
            </h2>

            {/* Secondary Reassurance */}
            <div className="text-center space-y-3 mb-8 max-w-md">
                <p className="text-gray-700">This happens occasionally.</p>
                <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                        We'll notify you when it's resolved.
                    </p>
                    <p className="text-sm text-gray-600 font-medium bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5">
                        You won't be charged twice.
                    </p>
                </div>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} className="mb-8" />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <button
                    onClick={() => window.location.reload()}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${isPremium
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    Check Status Later
                </button>
                {onViewHistory && (
                    <button
                        onClick={onViewHistory}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-colors"
                    >
                        <FiList className="w-4 h-4" />
                        View Payment History
                    </button>
                )}
            </div>
        </div>
    );
}
