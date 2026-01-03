'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import ProviderSelection from './ProviderSelection';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

interface EmailConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Provider = 'GMAIL' | 'ZOHO' | 'OUTLOOK' | 'YAHOO';
type Step = 'select-provider' | 'connecting' | 'success' | 'error';

export default function EmailConfigModal({ isOpen, onClose, onSuccess }: EmailConfigModalProps) {
    const [step, setStep] = useState<Step>('select-provider');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('select-provider');
                setSelectedProvider(null);
                setError(null);
                setConnectedEmail(null);
            }, 300);
        }
    }, [isOpen]);

    // Check URL params for OAuth callback result
    useEffect(() => {
        if (isOpen) {
            const params = new URLSearchParams(window.location.search);
            const success = params.get('success');
            const email = params.get('email');
            const errorParam = params.get('error');

            if (success === 'gmail_connected' && email) {
                setConnectedEmail(decodeURIComponent(email));
                setStep('success');
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
            } else if (errorParam) {
                setError(decodeURIComponent(errorParam));
                setStep('error');
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, [isOpen]);

    const handleSelectProvider = async (provider: Provider) => {
        setSelectedProvider(provider);
        setError(null);

        if (provider === 'GMAIL') {
            // Start Gmail OAuth flow
            setStep('connecting');
            setIsLoading(true);

            try {
                const response = await fetch('/api/v1/email/gmail/auth-url', {
                    method: 'GET',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to start OAuth');
                }

                const data = await response.json();

                if (data.authUrl) {
                    // Redirect to Google OAuth
                    window.location.href = data.authUrl;
                } else {
                    throw new Error('No auth URL received');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to connect Gmail');
                setStep('error');
                setIsLoading(false);
            }
        } else {
            // Other providers coming soon - shouldn't reach here
            setError(`${provider} integration coming soon!`);
            setStep('error');
        }
    };

    const handleDone = () => {
        onSuccess();
        onClose();
    };

    const handleRetry = () => {
        setStep('select-provider');
        setError(null);
        setSelectedProvider(null);
    };

    // Don't render anything if not open
    if (!isOpen) return null;

    // Render as INLINE content that fills the space (no overlay/modal)
    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 px-8 py-4 border-b border-[#e2e8f0]">
                <button
                    onClick={onClose}
                    className="p-2 text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] rounded-lg transition-colors"
                >
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-[#111827]">Connect Email Account</h1>
                    <p className="text-sm text-[#6b7280]">Add a Gmail account to send emails</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {step === 'select-provider' && (
                    <ProviderSelection
                        onSelectProvider={handleSelectProvider}
                        onBack={onClose}
                    />
                )}

                {step === 'connecting' && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center px-8">
                            {/* Animated Google icon */}
                            <div className="w-20 h-20 bg-white border-2 border-[#e5e7eb] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <FcGoogle className="w-10 h-10" />
                            </div>

                            <h2 className="text-2xl font-semibold text-[#111827] mb-3">
                                Connecting to Google
                            </h2>
                            <p className="text-[#6b7280] mb-8">
                                You'll be redirected to sign in with your Google account
                            </p>

                            {/* Loading indicator - Google colors */}
                            <div className="flex items-center justify-center gap-1.5">
                                <div className="w-3 h-3 bg-[#4285f4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-[#ea4335] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-[#fbbc05] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                <div className="w-3 h-3 bg-[#34a853] rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center px-8 max-w-md">
                            <div className="w-20 h-20 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-8">
                                <FiCheckCircle className="w-10 h-10 text-[#059669]" />
                            </div>

                            <h2 className="text-2xl font-semibold text-[#111827] mb-3">
                                Gmail Connected
                            </h2>

                            <p className="text-[#6b7280] mb-1">
                                You can now send emails using
                            </p>
                            <p className="text-lg font-medium text-[#111827] mb-8">
                                {connectedEmail}
                            </p>

                            <div className="p-5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl mb-8 text-left">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <p className="text-sm text-[#6b7280]">
                                        <span className="font-medium text-[#111827]">Secure connection</span> —
                                        We can only send emails. We cannot read your inbox.
                                        All emails will appear in your Sent folder.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleDone}
                                className="w-full px-8 py-3.5 bg-[#111827] text-white font-medium rounded-xl hover:bg-[#1f2937] transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}

                {step === 'error' && (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center px-8 max-w-md">
                            <div className="w-20 h-20 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-8">
                                <FiAlertCircle className="w-10 h-10 text-[#dc2626]" />
                            </div>

                            <h2 className="text-2xl font-semibold text-[#111827] mb-3">
                                Connection Failed
                            </h2>

                            <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl mb-8">
                                <p className="text-sm text-[#dc2626]">
                                    {error || 'Something went wrong while connecting.'}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3.5 border border-[#e5e7eb] text-[#374151] font-medium rounded-xl hover:bg-[#f9fafb] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRetry}
                                    className="flex-1 px-6 py-3.5 bg-[#111827] text-white font-medium rounded-xl hover:bg-[#1f2937] transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
