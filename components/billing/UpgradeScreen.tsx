'use client';

import { FiLock, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { Feature, getUpgradeInfo } from '@/lib/constants/billing-states';
import { BUSINESS_VERTICALS } from '@/lib/constants/pricing-constants';

interface UpgradeScreenProps {
    /** The feature that is gated */
    feature: Feature;

    /** Full page layout or inline */
    fullPage?: boolean;
}

/**
 * UpgradeScreen - Shows when user tries to access a gated feature
 * 
 * Design: Calm, educational, non-punitive
 * Shows what they get, why they need it, and how to upgrade
 */
export function UpgradeScreen({ feature, fullPage = true }: UpgradeScreenProps) {
    const router = useRouter();
    const upgradeInfo = getUpgradeInfo(feature);

    // Get the first required module for display
    const primaryModule = upgradeInfo.requiredModules[0];
    const moduleData = primaryModule ? BUSINESS_VERTICALS[primaryModule] : null;

    const handleUpgrade = () => {
        router.push('/store/billing');
    };

    const handleViewPlans = () => {
        router.push('/store/billing');
    };

    const containerClasses = fullPage
        ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4'
        : 'p-8';

    return (
        <div className={containerClasses}>
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
                {/* Lock Icon */}
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6 mx-auto border border-slate-200">
                    <FiLock className="w-8 h-8 text-slate-600" />
                </div>

                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">
                        {upgradeInfo.reason}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-lg mx-auto">
                        {upgradeInfo.prompt}
                    </p>
                </div>

                {/* Required Plan Badge */}
                {moduleData && (
                    <div className="bg-emerald-50 rounded-xl p-4 mb-8 border border-emerald-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-emerald-600 mb-1">REQUIRED PLAN</p>
                                <p className="text-lg font-bold text-emerald-900">{moduleData.displayName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-900">{moduleData.pricing.display}</p>
                                {moduleData.pricing.unit && (
                                    <p className="text-sm text-emerald-600">{moduleData.pricing.unit}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Features You Get */}
                {moduleData && (
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">
                            What You Get
                        </h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            {moduleData.features.slice(0, 6).map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-700">{feat}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleUpgrade}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40"
                    >
                        Upgrade to {moduleData?.displayName || 'Pro'}
                        <FiArrowRight className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleViewPlans}
                        className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all"
                    >
                        View All Plans
                    </button>
                </div>

                {/* Footer Note */}
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                        Core operations like POS and billing always work. This upgrade unlocks advanced features.
                    </p>
                </div>
            </div>
        </div>
    );
}
