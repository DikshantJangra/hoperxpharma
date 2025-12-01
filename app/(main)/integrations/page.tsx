'use client';

import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa';
import { whatsappApi, WhatsAppConnection } from '@/lib/api/whatsapp';
import { useCurrentStore } from '@/hooks/useCurrentStore';

export default function IntegrationsPage() {
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppConnection | null>(null);
    const [loading, setLoading] = useState(true);

    const { storeId, loading: storeLoading } = useCurrentStore();

    useEffect(() => {
        if (storeId) {
            loadWhatsAppStatus();
        }
    }, [storeId]);

    const loadWhatsAppStatus = async () => {
        if (!storeId) return;

        try {
            const status = await whatsappApi.getStatus(storeId);
            setWhatsappStatus(status);
        } catch (error) {
            console.error('Failed to load WhatsApp status:', error);
            setWhatsappStatus({ connected: false, status: 'DISCONNECTED' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        if (!whatsappStatus) return null;

        switch (whatsappStatus.status) {
            case 'ACTIVE':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                        <FaCheckCircle className="w-4 h-4" />
                        Connected
                    </div>
                );
            case 'NEEDS_VERIFICATION':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium">
                        <FaExclamationCircle className="w-4 h-4" />
                        Verification Required
                    </div>
                );
            case 'ERROR':
            case 'NO_PHONE':
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                        <FaTimesCircle className="w-4 h-4" />
                        Needs Attention
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium">
                        <FaTimesCircle className="w-4 h-4" />
                        Not Connected
                    </div>
                );
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Integrations</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Connect external services to enhance your pharmacy operations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* WhatsApp Integration Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                    <FaWhatsapp className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        WhatsApp Business
                                    </h3>
                                    {getStatusBadge()}
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            Connect your pharmacy's WhatsApp to message patients directly from HopeRx.
                        </p>

                        {whatsappStatus?.connected && whatsappStatus.phoneNumber && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Number</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {whatsappStatus.phoneNumber}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {whatsappStatus?.connected ? (
                                <a
                                    href="/integrations/whatsapp"
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
                                >
                                    Manage
                                </a>
                            ) : (
                                <a
                                    href="/integrations/whatsapp"
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors text-center"
                                >
                                    Connect WhatsApp
                                </a>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Works best for store owners — connect once and staff can chat from Messages → WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Placeholder for future integrations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 opacity-50">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📧</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h3>
                                <span className="text-xs text-gray-500">Coming Soon</span>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Send automated emails for prescriptions, refills, and promotions.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 opacity-50">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS</h3>
                                <span className="text-xs text-gray-500">Coming Soon</span>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Reach patients via SMS for critical updates and reminders.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
