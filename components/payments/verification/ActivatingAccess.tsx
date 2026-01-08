'use client';

import { FiLoader } from 'react-icons/fi';
import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function ActivatingAccess({
    referenceId,
    isPremium = false,
}: VerificationStepProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            {/* Transition Animation */}
            <div className="mb-8">
                <div className="relative w-20 h-20">
                    <div className={`absolute inset-0 rounded-full border-4 border-emerald-200 animate-spin ${isPremium ? 'border-t-emerald-500' : 'border-t-emerald-400'}`} style={{ animationDuration: '1.5s' }}></div>
                    <div className={`absolute inset-0 rounded-full bg-emerald-50 flex items-center justify-center`}>
                        <FiLoader className="w-10 h-10 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Finalizing your access
            </h2>

            {/* Secondary Reassurance */}
            <div className="text-center space-y-2 mb-8 max-w-md">
                <p className="text-gray-700">Payment confirmed. Activating your subscription.</p>
                <p className="text-sm text-gray-500">
                    This won't take long. You're all set.
                </p>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} />
        </div>
    );
}
