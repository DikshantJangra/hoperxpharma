'use client';

import { useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { whatsappApi } from '@/lib/api/whatsapp';

interface ManualSetupModalProps {
    storeId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ManualSetupModal({ storeId, onClose, onSuccess }: ManualSetupModalProps) {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleConnect = async () => {
        if (!token.trim()) {
            setError('Please enter a system user token');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await whatsappApi.manualSetup(storeId, token.trim());
            setSuccess(true);
            setTimeout(() => onSuccess(), 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to connect');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Manual Setup (Advanced)
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
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                    <strong>For advanced users only.</strong> Use this if you prefer to generate a System User token
                                    in Facebook Business Manager and paste it here. This is a fallback for admins who manage tokens themselves.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Instructions:</h3>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                        <li>
                                            Go to{' '}
                                            <a
                                                href="https://business.facebook.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Facebook Business Manager
                                            </a>
                                        </li>
                                        <li>Navigate to Business Settings → System Users</li>
                                        <li>Create a new system user or select existing</li>
                                        <li>
                                            Assign permissions:
                                            <ul className="list-disc list-inside ml-6 mt-1">
                                                <li className="text-xs">manage_pages</li>
                                                <li className="text-xs">whatsapp_business_management</li>
                                                <li className="text-xs">whatsapp_business_messaging</li>
                                            </ul>
                                        </li>
                                        <li>Generate a long-lived token and copy it below</li>
                                    </ol>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        System User Token
                                    </label>
                                    <textarea
                                        value={token}
                                        onChange={(e) => {
                                            setToken(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Paste your long-lived system user token here..."
                                        rows={4}
                                        className="w-full px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <FaExclamationCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-red-900 dark:text-red-200 mb-1">
                                            Connection Failed
                                        </h4>
                                        <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConnect}
                                    disabled={loading || !token.trim()}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                                >
                                    {loading ? 'Connecting...' : 'Connect Token'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                We'll validate your token and subscribe the webhook automatically.
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FaCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Successfully Connected!
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Your WhatsApp is now configured.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
