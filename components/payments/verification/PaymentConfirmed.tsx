'use client';

import { FiCheck, FiDownload } from 'react-icons/fi';
import { PaymentReference } from './PaymentReference';
import type { VerificationStepProps } from '@/lib/types/payment-verification.types';

export function PaymentConfirmed({
    paymentData,
    referenceId,
    onContinue,
    onDownloadReceipt,
    isPremium = false,
}: VerificationStepProps) {
    const formatCurrency = (paise: number) => {
        const rupees = paise / 100;
        return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
            {/* Calm Check Icon */}
            <div className="mb-8">
                <div className={`w-20 h-20 rounded-full ${isPremium ? 'bg-emerald-100' : 'bg-emerald-50'} flex items-center justify-center border-4 border-emerald-200`}>
                    <FiCheck className="w-10 h-10 text-emerald-600" strokeWidth={3} />
                </div>
            </div>

            {/* Primary Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Payment confirmed
            </h2>

            {/* Transaction Facts */}
            <div className={`${isPremium ? 'bg-white/80 backdrop-blur-xl border-white/20' : 'bg-gray-50'} border border-gray-200 rounded-2xl p-6 mb-6 min-w-[320px]`}>
                <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(paymentData?.amount || 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                        {paymentData?.planName || 'Subscription Payment'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {paymentData?.createdAt ? formatDateTime(paymentData.createdAt) : ''}
                    </div>
                </div>
            </div>

            {/* Reference ID */}
            <PaymentReference referenceId={referenceId} className="mb-6" />

            {/* Confirmation */}
            <div className="flex items-center gap-2 mb-8 text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full">
                <FiCheck className="w-4 h-4" />
                <span className="text-sm font-medium">All access activated</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                {onContinue && (
                    <button
                        onClick={onContinue}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${isPremium
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                    >
                        Continue to Dashboard
                    </button>
                )}
                {onDownloadReceipt && (
                    <button
                        onClick={onDownloadReceipt}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-gray-300 rounded-xl font-medium text-gray-700 transition-colors"
                    >
                        <FiDownload className="w-4 h-4" />
                        View Receipt
                    </button>
                )}
            </div>
        </div>
    );
}
