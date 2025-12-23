'use client';

import { FiMail, FiSettings } from 'react-icons/fi';
import { SiGmail } from 'react-icons/si';

interface ProviderSelectionProps {
    onSelectProvider: (provider: 'GMAIL' | 'ZOHO' | 'OUTLOOK' | 'OTHER') => void;
    onBack: () => void;
}

const providers = [
    {
        id: 'GMAIL' as const,
        name: 'Gmail',
        icon: SiGmail,
        color: 'from-[#EA4335] to-[#FBBC05]',
        description: 'Most common for individuals',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
    },
    {
        id: 'ZOHO' as const,
        name: 'Zoho Mail',
        icon: FiMail, color: 'from-[#C8161D] to-[#E54C3C]',
        description: 'Popular for businesses',
        smtpHost: 'smtp.zoho.in',
        smtpPort: 587,
    },
    {
        id: 'OUTLOOK' as const,
        name: 'Outlook / Office 365',
        icon: FiMail,
        color: 'from-[#0078D4] to-[#0063B1]',
        description: 'Microsoft email services',
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
    },
    {
        id: 'OTHER' as const,
        name: 'Other Email',
        icon: FiSettings,
        color: 'from-[#64748b] to-[#475569]',
        description: 'Custom SMTP configuration',
        smtpHost: '',
        smtpPort: 587,
    },
];

export default function ProviderSelection({ onSelectProvider, onBack }: ProviderSelectionProps) {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="text-sm text-[#64748b] hover:text-[#0f172a] flex items-center gap-2 mb-6 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Header */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-[#0f172a] mb-3">
                    Which email do you use?
                </h2>
                <p className="text-[#64748b]">
                    Select your email provider to get started
                </p>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => {
                    const Icon = provider.icon;
                    return (
                        <button
                            key={provider.id}
                            onClick={() => onSelectProvider(provider.id)}
                            className="group relative p-6 bg-white border-2 border-[#e2e8f0] rounded-xl hover:border-[#10b981] hover:shadow-lg transition-all duration-200 text-left"
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-200`}></div>

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-14 h-14 mb-4 bg-gradient-to-br ${provider.color} rounded-xl flex items-center justify-center shadow-md`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Provider Name */}
                                <h3 className="text-lg font-semibold text-[#0f172a] mb-1">
                                    {provider.name}
                                </h3>

                                {/* Description */}
                                <p className="text-sm text-[#64748b]">
                                    {provider.description}
                                </p>

                                {/* Arrow Icon */}
                                <div className="absolute top-6 right-6 text-[#cbd5e1] group-hover:text-[#10b981] transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-[#d1fae5] border border-[#a7f3d0] rounded-lg">
                <p className="text-sm text-[#065f46] flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                        <strong>Don't worry!</strong> We'll guide you through the setup process step-by-step.
                        No technical knowledge required.
                    </span>
                </p>
            </div>
        </div>
    );
}

// Export provider config for use in configuration component
export { providers };
