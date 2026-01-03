'use client';

import { FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

interface ProviderSelectionProps {
    onSelectProvider: (provider: 'GMAIL' | 'ZOHO' | 'OUTLOOK' | 'YAHOO') => void;
    onBack: () => void;
}

const providers = [
    {
        id: 'GMAIL' as const,
        name: 'Gmail',
        icon: FcGoogle,  // Google colored icon
        iconColor: undefined,
        bgColor: 'bg-white',
        borderColor: 'border-[#e5e7eb]',
        hoverBorder: 'hover:border-[#4285f4]',
        description: 'Connect with your Google account',
        available: true,
        recommended: true,
    },
    {
        id: 'OUTLOOK' as const,
        name: 'Outlook',
        icon: FiMail,
        iconColor: '#0078d4',
        bgColor: 'bg-white',
        borderColor: 'border-[#e5e7eb]',
        hoverBorder: 'hover:border-[#0078d4]',
        description: 'Microsoft Outlook & Office 365',
        available: false,
        recommended: false,
    },
    {
        id: 'YAHOO' as const,
        name: 'Yahoo Mail',
        icon: FiMail,
        iconColor: '#6001d2',
        bgColor: 'bg-white',
        borderColor: 'border-[#e5e7eb]',
        hoverBorder: 'hover:border-[#6001d2]',
        description: 'Yahoo Mail accounts',
        available: false,
        recommended: false,
    },
    {
        id: 'ZOHO' as const,
        name: 'Zoho Mail',
        icon: FiMail,
        iconColor: '#c8161d',
        bgColor: 'bg-white',
        borderColor: 'border-[#e5e7eb]',
        hoverBorder: 'hover:border-[#c8161d]',
        description: 'Zoho business email',
        available: false,
        recommended: false,
    },
];

export default function ProviderSelection({ onSelectProvider, onBack }: ProviderSelectionProps) {
    return (
        <div className="max-w-2xl mx-auto px-8 py-10">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="text-sm text-[#6b7280] hover:text-[#111827] flex items-center gap-2 mb-8 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Header */}
            <div className="text-center mb-10">
                <h2 className="text-2xl font-semibold text-[#111827] mb-2">
                    Connect Your Email
                </h2>
                <p className="text-[#6b7280] text-sm">
                    Choose your email provider to send emails from your own account
                </p>
            </div>

            {/* Provider Cards */}
            <div className="space-y-3">
                {providers.map((provider) => {
                    const Icon = provider.icon;
                    const isAvailable = provider.available;

                    return (
                        <button
                            key={provider.id}
                            onClick={() => isAvailable && onSelectProvider(provider.id)}
                            disabled={!isAvailable}
                            className={`group relative w-full p-4 ${provider.bgColor} border-2 ${provider.borderColor} rounded-xl text-left transition-all duration-200 ${isAvailable
                                ? `${provider.hoverBorder} hover:shadow-md cursor-pointer`
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAvailable ? 'bg-[#f9fafb]' : 'bg-[#f3f4f6]'
                                    }`}>
                                    <Icon
                                        className="w-7 h-7"
                                        style={provider.iconColor ? { color: provider.iconColor } : undefined}
                                    />
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-medium text-[#111827]">
                                            {provider.name}
                                        </h3>
                                        {provider.recommended && (
                                            <span className="text-xs font-medium text-[#059669] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                                                Recommended
                                            </span>
                                        )}
                                        {!isAvailable && (
                                            <span className="text-xs font-medium text-[#6b7280] bg-[#f3f4f6] px-2 py-0.5 rounded-full">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#6b7280] mt-0.5">
                                        {provider.description}
                                    </p>
                                </div>

                                {/* Arrow */}
                                {isAvailable && (
                                    <svg className="w-5 h-5 text-[#d1d5db] group-hover:text-[#4285f4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Security Note */}
            <div className="mt-8 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-[#111827]">Secure OAuth Connection</p>
                        <p className="text-sm text-[#6b7280] mt-0.5">
                            We use Google's official OAuth to connect. No passwords stored.
                            We can only send emails — we never access your inbox.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export provider config for use in configuration component
export { providers };
