'use client';

import { useState } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { whatsappApi } from '@/lib/api/whatsapp';

interface PhoneVerificationModalProps {
    storeId: string;
    phoneNumber: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PhoneVerificationModal({
    storeId,
    phoneNumber,
    onClose,
    onSuccess,
}: PhoneVerificationModalProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await whatsappApi.verifyPhone(storeId, code);
            setSuccess(true);
            setTimeout(() => onSuccess(), 1500);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (value: string) => {
        // Only allow digits
        const digits = value.replace(/\D/g, '').slice(0, 6);
        setCode(digits);
        setError('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Verify Phone Number
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!success ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    We sent a 6-digit code to:
                                </p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {phoneNumber}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    placeholder="000000"
                                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                </div>
                            )}

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                                    <strong>Note:</strong> If this number is currently used on a personal WhatsApp account,
                                    you'll need to remove that account from the phone or use a different number.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || code.length !== 6}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                >
                                    {loading ? 'Verifying...' : 'Verify Code'}
                                </button>
                            </div>

                            <button
                                onClick={() => {/* TODO: Implement resend */ }}
                                disabled={loading}
                                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400"
                            >
                                Resend code
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Phone Verified!
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your WhatsApp is now active.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
