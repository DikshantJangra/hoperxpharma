'use client';

import { useState, useEffect } from 'react';
import { FiMail, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import ProviderSelection, { providers } from './ProviderSelection';

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

type Provider = 'GMAIL' | 'ZOHO' | 'OUTLOOK' | 'OTHER';
type Step = 'select-provider' | 'configure' | 'verify';

export default function EmailConfigModal({ isOpen, onClose, onSuccess }: EmailConfigModalProps) {
    const [step, setStep] = useState<Step>('select-provider');
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        useTLS: true,
    });

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep('select-provider');
                setSelectedProvider(null);
                setError(null);
                setSuccess(false);
                setFormData({
                    email: '',
                    smtpHost: '',
                    smtpPort: 587,
                    smtpUser: '',
                    smtpPassword: '',
                    useTLS: true,
                });
            }, 300);
        }
    }, [isOpen]);

    const handleSelectProvider = (provider: Provider) => {
        setSelectedProvider(provider);
        const providerConfig = providers.find(p => p.id === provider);

        if (providerConfig) {
            setFormData(prev => ({
                ...prev,
                smtpHost: providerConfig.smtpHost,
                smtpPort: providerConfig.smtpPort,
            }));
        }

        setStep('configure');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Configure email account
            const response = await fetch('/api/v1/email/configure', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    provider: selectedProvider,
                    smtpUser: formData.email, // Use email as SMTP user
                }),
            });

            if (!response.ok) {
                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to configure email');
                } else {
                    // Non-JSON response (likely HTML error page)
                    const textError = await response.text();
                    console.error('Server error:', textError);
                    throw new Error('Server error occurred. Please check your connection and try again.');
                }
            }

            setStep('verify');
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to configure email account');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestEmail = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/v1/email/send-test', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to send test email');
            }

            // Success! Close modal and refresh
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to send test email');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors z-10"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    {step === 'select-provider' && (
                        <ProviderSelection
                            onSelectProvider={handleSelectProvider}
                            onBack={onClose}
                        />
                    )}

                    {step === 'configure' && (
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-[#0f172a] mb-6">
                                Connect your {providers.find(p => p.id === selectedProvider)?.name}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email Address */}
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                        Your email address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@gmail.com"
                                        className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                    />
                                </div>

                                {/* Show SMTP fields for OTHER provider */}
                                {selectedProvider === 'OTHER' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                                    SMTP Host
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.smtpHost}
                                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                                    placeholder="smtp.example.com"
                                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                                    SMTP Port
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.smtpPort}
                                                    onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* App Password Input with Validation */}
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                        App Password {selectedProvider === 'GMAIL' && <span className="text-[#64748b] font-normal">(16 characters)</span>}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.smtpPassword}
                                        onChange={(e) => {
                                            // Auto-format Gmail app passwords (remove spaces for storage but allow input with spaces)
                                            const value = e.target.value;
                                            setFormData({ ...formData, smtpPassword: value });
                                        }}
                                        placeholder={selectedProvider === 'GMAIL' ? 'xxxx xxxx xxxx xxxx' : 'Enter your app password'}
                                        pattern={selectedProvider === 'GMAIL' ? '[a-zA-Z]{4}\\s?[a-zA-Z]{4}\\s?[a-zA-Z]{4}\\s?[a-zA-Z]{4}' : undefined}
                                        className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent font-mono text-base tracking-wider"
                                    />
                                    {selectedProvider === 'GMAIL' && (
                                        <p className="text-xs text-[#64748b] mt-1.5">
                                            Format: 4 groups of 4 letters (spaces optional)
                                        </p>
                                    )}
                                </div>

                                {/* Improved App Password Instructions Box */}
                                <div className="relative overflow-hidden rounded-xl border-2 border-[#fbbf24] bg-gradient-to-br from-[#fef3c7] to-[#fde68a]/30 shadow-sm">
                                    {/* Top accent bar */}
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"></div>

                                    <div className="p-5">
                                        {/* Header with icon */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 bg-[#fbbf24] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-[#92400e] mb-1">
                                                    App Password Required
                                                </h4>
                                                <p className="text-sm text-[#78350f] leading-relaxed">
                                                    {selectedProvider === 'GMAIL'
                                                        ? 'Gmail requires an App Password (not your regular password) for security.'
                                                        : selectedProvider === 'OUTLOOK'
                                                            ? 'Outlook requires an App Password for third-party apps.'
                                                            : 'Your email provider may require an App Password for SMTP access.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Collapsible instructions */}
                                        <details className="group">
                                            <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-[#92400e] hover:text-[#78350f] py-2 px-3 rounded-lg hover:bg-[#fde68a]/40 transition-colors">
                                                <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                                How to get an App Password
                                            </summary>

                                            <div className="mt-3 pl-3 border-l-2 border-[#fbbf24]/40 ml-5">
                                                {selectedProvider === 'GMAIL' ? (
                                                    <div className="space-y-3 text-sm text-[#78350f]">
                                                        <p className="font-medium text-[#92400e]">For Gmail (Google):</p>
                                                        <ol className="space-y-2.5 ml-1">
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">1.</span>
                                                                <div>
                                                                    Enable 2-Step Verification:{' '}
                                                                    <a
                                                                        href="https://myaccount.google.com/signinoptions/two-step-verification"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[#10b981] font-medium hover:text-[#059669] underline"
                                                                    >
                                                                        Click here
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                        </svg>
                                                                    </a>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">2.</span>
                                                                <div>
                                                                    Go to App Passwords:{' '}
                                                                    <a
                                                                        href="https://myaccount.google.com/apppasswords"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[#10b981] font-medium hover:text-[#059669] underline"
                                                                    >
                                                                        Click here
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                        </svg>
                                                                    </a>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">3.</span>
                                                                <span>Select app: <strong>"Mail"</strong></span>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">4.</span>
                                                                <span>Select device: <strong>"Other"</strong> → Type <strong>"HopeRx"</strong></span>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">5.</span>
                                                                <span>Click "Generate" → Copy the 16-character password</span>
                                                            </li>
                                                        </ol>
                                                    </div>
                                                ) : selectedProvider === 'OUTLOOK' ? (
                                                    <div className="space-y-3 text-sm text-[#78350f]">
                                                        <p className="font-medium text-[#92400e]">For Outlook/Office 365:</p>
                                                        <ol className="space-y-2.5 ml-1">
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">1.</span>
                                                                <div>
                                                                    Go to Microsoft Account Security:{' '}
                                                                    <a
                                                                        href="https://account.microsoft.com/security"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 text-[#10b981] font-medium hover:text-[#059669] underline"
                                                                    >
                                                                        Click here
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                        </svg>
                                                                    </a>
                                                                </div>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">2.</span>
                                                                <span>Click on "Advanced security options"</span>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">3.</span>
                                                                <span>Under "App passwords", click "Create a new app password"</span>
                                                            </li>
                                                            <li className="flex gap-2">
                                                                <span className="font-semibold text-[#92400e] w-5 flex-shrink-0">4.</span>
                                                                <span>Copy the generated password</span>
                                                            </li>
                                                        </ol>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-[#78350f]">
                                                        <p>Check your email provider's documentation for App Password setup.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </details>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg flex items-start gap-3">
                                        <FiAlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#dc2626]">{error}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep('select-provider')}
                                        className="px-6 py-2.5 border border-[#e2e8f0] text-[#64748b] font-medium rounded-lg hover:bg-[#f8fafc] transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-2.5 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading && (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {isLoading ? 'Connecting...' : 'Verify & Connect'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 'verify' && (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-[#d1fae5] rounded-full flex items-center justify-center mx-auto mb-6">
                                <FiCheckCircle className="w-8 h-8 text-[#10b981]" />
                            </div>

                            <h2 className="text-2xl font-bold text-[#0f172a] mb-3">
                                Email connected successfully!
                            </h2>

                            <p className="text-[#64748b] mb-6">
                                You can now send emails directly from HopeRx using<br />
                                <strong className="text-[#0f172a]">{formData.email}</strong>
                            </p>

                            <div className="p-4 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg mb-6 text-left">
                                <p className="text-sm text-[#0c4a6e] flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span className="text-xs">
                                        🔒 HopeRx can only <strong>send</strong> emails — we never read your inbox.
                                    </span>
                                </p>
                            </div>

                            {error && (
                                <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg flex items-start gap-3 mb-6">
                                    <FiAlertCircle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-[#dc2626] text-left">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleTestEmail}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-2.5 border border-[#e2e8f0] text-[#64748b] font-medium rounded-lg hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : 'Send a test email'}
                                </button>
                                <button
                                    onClick={() => {
                                        onSuccess();
                                        onClose();
                                    }}
                                    className="flex-1 px-6 py-2.5 bg-[#10b981] text-white font-medium rounded-lg hover:bg-[#059669] transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
