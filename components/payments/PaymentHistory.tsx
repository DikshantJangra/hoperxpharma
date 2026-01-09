'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { FiCheck, FiX, FiClock, FiDownload } from 'react-icons/fi';

interface Payment {
    id: string;
    amount: number;
    amountPaise: number;
    currency: string;
    status: string;
    method: string | null;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    planName: string;
    planDisplayName: string;
    billingCycle: string;
    createdAt: string;
    completedAt: string | null;
}

interface PaymentHistoryProps {
    storeId: string;
}

export function PaymentHistory({ storeId }: PaymentHistoryProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, hasMore: false });

    useEffect(() => {
        fetchPayments();
    }, [storeId]);

    const fetchPayments = async () => {
        try {
            const response = await apiClient.get(`/subscriptions/payments?storeId=${storeId}&limit=20`);
            const data = response.data?.data || response.data;
            setPayments(data?.payments || []);
            setPagination(data?.pagination || { total: 0, hasMore: false });
        } catch (error: any) {
            console.error('[PaymentHistory] Failed to fetch payment history:', {
                error: error.message,
                storeId,
                timestamp: new Date().toISOString()
            });
            console.error(error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            SUCCESS: { icon: FiCheck, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Success' },
            PROCESSING: { icon: FiClock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Processing' },
            FAILED: { icon: FiX, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Failed' },
            INITIATED: { icon: FiClock, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Initiated' },
            EXPIRED: { icon: FiX, bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', label: 'Expired' },
        };
        const badge = badges[status as keyof typeof badges] || badges.INITIATED;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
            </span>
        );
    };

    const formatAmount = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownloadInvoice = async (paymentId: string) => {
        try {
            const response = await apiClient.post(`/subscriptions/payments/${paymentId}/invoice`, {}, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(response);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `INV-${paymentId.slice(0, 8).toUpperCase()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('[PaymentHistory] Invoice download failed:', {
                error: error.message,
                paymentId,
                timestamp: new Date().toISOString()
            });
            console.error('Failed to download invoice:', error);
            alert('Failed to download invoice. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
                ))}
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <p className="text-gray-400 text-sm">No payment history available yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {payments.map((payment) => (
                <div
                    key={payment.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900 truncate">
                                    {payment.planDisplayName}
                                </h4>
                                {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <span>{formatDate(payment.createdAt)}</span>
                                {payment.method && (
                                    <span className="capitalize">{payment.method}</span>
                                )}
                                <span className="capitalize">{payment.billingCycle}</span>
                            </div>
                            {payment.razorpayPaymentId && (
                                <div className="mt-2 text-xs text-gray-400 font-mono">
                                    ID: {payment.razorpayPaymentId}
                                </div>
                            )}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-gray-900">
                                {formatAmount(payment.amount, payment.currency)}
                            </div>
                            {payment.status === 'SUCCESS' && payment.completedAt && (
                                <button
                                    onClick={() => handleDownloadInvoice(payment.id)}
                                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:underline"
                                >
                                    <FiDownload className="w-3 h-3" />
                                    Invoice
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {pagination.hasMore && (
                <button
                    onClick={fetchPayments}
                    className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Load More
                </button>
            )}

            <div className="text-center text-xs text-gray-400 pt-2">
                Showing {payments.length} of {pagination.total} payments
            </div>
        </div>
    );
}
