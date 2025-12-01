'use client';

import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { whatsappApi } from '@/lib/api/whatsapp';

interface ConnectModalProps {
    storeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ConnectModal({ storeId, onClose, onSuccess }: ConnectModalProps) {
    const [step, setStep] = useState<'intro' | 'connecting' | 'finalizing' | 'success' | 'error'>('intro');
    const [error, setError] = useState('');

    const handleConnect = async () => {
        setStep('connecting');
        setError('');

        // In a real implementation, this would:
        // 1. Open Facebook SDK popup for OAuth
        // 2. Receive temporary token
        // 3. Call connect API
        // 4. Then finalize

        // For now, simulate with instructions
        setTimeout(async () => {
            try {
                // Simulated: In production, get tempToken from Facebook SDK
                // For now, we use a placeholder to allow the flow to proceed to validation
                const tempToken = 'PLACEHOLDER_TEMP_TOKEN_FOR_DEMO';
                await whatsappApi.connect(storeId, tempToken);

                setStep('finalizing');

                // Finalize setup - fetches WABA, subscribes webhook
                const result = await whatsappApi.finalize(storeId);

                if (result.status === 'ACTIVE') {
                    setStep('success');
                    setTimeout(() => onSuccess(), 2000);
                } else if (result.status === 'NEEDS_VERIFICATION') {
                    setStep('success');
                    setTimeout(() => onSuccess(), 2000);
                } else {
                    throw new Error(result.message || 'Setup incomplete');
                }
            } catch (err: any) {
                setError(err.message);
                setStep('error');
            }
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Connect WhatsApp
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Intro Step */}
                    {step === 'intro' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                                    Connect in 3 Easy Steps
                                </h3>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-300">
                                    <li>Log in with Facebook (opens in popup)</li>
                                    <li>Choose your business and phone number</li>
                                    <li>Verify phone via SMS or voice OTP</li>
                                </ol>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    This will let your pharmacy send and receive WhatsApp messages inside HopeRx.
                                    Only a store owner should connect the WhatsApp number.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Important:</strong> If the phone number is already used with a personal WhatsApp account,
                                    you'll need to remove that account first or use a different number.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConnect}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Start Connection
                                </button>
                            </div>

                            <button
                                onClick={() => {/* TODO: Open manual setup */ }}
                                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Use manual token instead
                            </button>
                        </div>
                    )}

                    {/* Connecting Step */}
                    {step === 'connecting' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Waiting for Facebook...
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Complete the steps in the Facebook popup window.
                            </p>
                        </div>
                    )}

                    {/* Finalizing Step */}
                    {step === 'finalizing' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Verifying your account
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Almost done — verifying the account and registering your phone.
                            </p>
                        </div>
                    )}

                    {/* Success Step */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                WhatsApp Connected!
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your staff can now view and reply to WhatsApp messages.
                            </p>
                        </div>
                    )}

                    {/* Error Step */}
                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <FaExclamationCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-900 dark:text-red-200 mb-1">
                                        Connection Failed
                                    </h3>
                                    <p className="text-sm text-red-800 dark:text-red-300">
                                        {error}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => setStep('intro')}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
