"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiLink, FiCheckCircle, FiMessageSquare } from "react-icons/fi";
import { MdWhatsapp, MdEmail } from "react-icons/md";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step8Page() {
    const { state, updateIntegrations, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [emailExpanded, setEmailExpanded] = useState(false);
    const [emailConfig, setEmailConfig] = useState({
        provider: 'gmail',
        email: '',
        password: '', // App Password
        host: 'smtp.gmail.com',
        port: '587'
    });
    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

    useEffect(() => {
        setCurrentStep(8);
    }, [setCurrentStep]);

    // Sync from context
    useEffect(() => {
        const email = state.data.integrations.email;
        if (email?.connected) {
            setEmailConfig(prev => {
                const next = {
                    ...prev,
                    provider: email.provider || 'gmail',
                    // Note: we can't sync sensitive passwords back from context if they aren't stored there, 
                    // but we can sync the connected state.
                };
                if (JSON.stringify(prev) === JSON.stringify(next)) {
                    return prev;
                }
                return next;
            });
        }
    }, [state.data.integrations]);

    const handleNext = () => {
        markStepComplete(8);
        router.push("/onboarding/step-9");
    };

    const handleBack = () => {
        router.push("/onboarding/step-7");
    };

    const handleConnectEmail = () => {
        setIsVerifyingEmail(true);
        // Simulate verification API call
        setTimeout(() => {
            updateIntegrations({
                email: {
                    connected: true,
                    provider: emailConfig.provider
                }
            });
            setIsVerifyingEmail(false);
            setEmailExpanded(false);
        }, 1500);
    };

    return (
        <OnboardingCard
            title="Integrations"
            description="Connect your communication and payment channels"
            icon={<FiLink size={28} />}
        >
            <div className="space-y-4">
                {/* Email Integration (Active) */}
                <div className={`p-5 border rounded-xl transition-all duration-300 group bg-white ${state.data.integrations.email?.connected
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-gray-200 hover:border-emerald-200 hover:shadow-lg"
                    }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${state.data.integrations.email?.connected ? "bg-emerald-100" : "bg-blue-50"
                                }`}>
                                <MdEmail className={`w-6 h-6 ${state.data.integrations.email?.connected ? "text-emerald-600" : "text-blue-600"
                                    }`} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    Email Integration
                                    {state.data.integrations.email?.connected && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Connected</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">Connect Gmail or SMTP for invoicing</p>
                            </div>
                        </div>
                        {!state.data.integrations.email?.connected ? (
                            <button
                                onClick={() => setEmailExpanded(!emailExpanded)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                {emailExpanded ? "Cancel" : "Connect"}
                            </button>
                        ) : (
                            <button
                                onClick={() => updateIntegrations({ email: { connected: false, provider: '' } })}
                                className="text-sm text-red-500 hover:text-red-600 font-medium px-4 py-2"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>

                    {/* Email Config Form */}
                    {emailExpanded && !state.data.integrations.email?.connected && (
                        <div className="mt-5 pt-5 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Provider</label>
                                    <select
                                        value={emailConfig.provider}
                                        onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-all font-medium"
                                    >
                                        <option value="gmail">Gmail (Recommended)</option>
                                        <option value="outlook" disabled className="text-gray-400">Outlook / Office 365 (Coming Soon)</option>
                                        <option value="smtp" disabled className="text-gray-400">Custom SMTP (Coming Soon)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={emailConfig.email}
                                        onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
                                        placeholder="pharmacy@gmail.com"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">
                                        {emailConfig.provider === 'gmail' ? 'App Password' : 'Password'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={emailConfig.password}
                                            onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {emailConfig.provider === 'gmail' && (
                                <div className="mb-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
                                    <div className="flex gap-2.5">
                                        <div className="mt-0.5">
                                            <FiLink className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-sm text-blue-900">
                                            <p className="font-semibold mb-1">How to get a Gmail App Password used in place of your actual password:</p>
                                            <ol className="list-decimal ml-4 space-y-1 text-blue-800 text-xs">
                                                <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600 transition-colors">Google Account Security</a> settings.</li>
                                                <li>Enable <strong>2-Step Verification</strong> if not already on.</li>
                                                <li>Go directly to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-600 transition-colors">App Passwords</a>.</li>
                                                <li>Create a new app password (name it "HopeRx") and paste it above.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleConnectEmail}
                                    disabled={isVerifyingEmail || !emailConfig.email || !emailConfig.password}
                                    className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-medium text-sm hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isVerifyingEmail ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Verifying...
                                        </>
                                    ) : (
                                        <>Connect Email</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* WhatsApp Integration (Coming Soon / Placeholder) */}
                <div className="p-5 border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group bg-white opacity-70 hover:opacity-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                                <MdWhatsapp className="w-7 h-7 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">WhatsApp Business</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Send billing updates via WhatsApp</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full uppercase tracking-wide">
                            Coming Soon
                        </span>
                    </div>
                </div>

                {/* SMS Integration (Coming Soon) */}
                <div className="p-5 border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group bg-white opacity-70 hover:opacity-100">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                                <FiMessageSquare className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">SMS Notifications</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Twilio / Kaleyra integration</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full uppercase tracking-wide">
                            Coming Soon
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="pt-4 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        Continue to Data Import
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
