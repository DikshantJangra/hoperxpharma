'use client';

import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { whatsappApi } from '@/lib/api/whatsapp';

interface ConnectModalProps {
    storeId: string;
    onClose: () => void;
    onSuccess: () => void;
    onSwitchToManual: () => void;
}

export default function ConnectModal({ storeId, onClose, onSuccess, onSwitchToManual }: ConnectModalProps) {
    const [step, setStep] = useState<'intro' | 'connecting' | 'finalizing' | 'success' | 'error'>('intro');
    const [error, setError] = useState('');

    const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

    const handleConnect = async () => {
        if (!FACEBOOK_APP_ID) {
            setStep('error');
            setError('Facebook App ID is not configured');
            return;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Connect WhatsApp
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                            <FaTimes className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>

                    {step === 'intro' && (
                        <div className="space-y-4">
                            {!FACEBOOK_APP_ID ? (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                        <FaExclamationCircle />
                                        Configuration Missing
                                    </h3>
                                    <p className="text-sm text-amber-800 mb-3">
                                        The Facebook App ID is not configured. Please use Manual Setup instead.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={onSwitchToManual}
                                            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Go to Manual Setup
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h3 className="font-medium text-blue-900 mb-2">
                                            Connect in 3 Easy Steps
                                        </h3>
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                            <li>Log in with Facebook (opens in popup)</li>
                                            <li>Choose your business and phone number</li>
                                            <li>Verify phone via SMS or voice OTP</li>
                                        </ol>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConnect}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                                        >
                                            Continue with Facebook
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'connecting' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Waiting for Facebook...
                            </h3>
                            <p className="text-sm text-gray-600">
                                Complete the steps in the Facebook popup window.
                            </p>
                        </div>
                    )}

                    {step === 'finalizing' && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Verifying your account
                            </h3>
                            <p className="text-sm text-gray-600">
                                Almost done — verifying the account and registering your phone.
                            </p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8">
                            <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                WhatsApp Connected!
                            </h3>
                            <p className="text-sm text-gray-600">
                                Your staff can now view and reply to WhatsApp messages.
                            </p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <FaExclamationCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-900 mb-1">
                                        Connection Failed
                                    </h3>
                                    <p className="text-sm text-red-800">
                                        {error}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
