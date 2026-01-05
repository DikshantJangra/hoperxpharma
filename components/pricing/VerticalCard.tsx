'use client';

import { FiPackage, FiShoppingBag, FiActivity, FiGrid, FiCheck, FiArrowRight } from 'react-icons/fi';
import { BusinessVertical } from '@/lib/constants/pricing-constants';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    FiShoppingBag,
    FiPackage,
    FiActivity,
    FiGrid,
};

interface VerticalCardProps {
    vertical: BusinessVertical;
    microContext?: string;
    onCTA?: () => void;
}

export function VerticalCard({
    vertical,
    microContext,
    onCTA,
}: VerticalCardProps) {
    const Icon = iconMap[vertical.icon] || FiPackage;
    const isComingSoon = vertical.status === 'coming_soon';
    const isActive = vertical.status === 'active';

    const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string; hover: string }> = {
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700',
            hover: 'hover:border-emerald-300 hover:shadow-lg',
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200',
            badge: 'bg-blue-100 text-blue-700',
            hover: 'hover:border-blue-300 hover:shadow-lg',
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-200',
            badge: 'bg-purple-100 text-purple-700',
            hover: 'hover:border-purple-300 hover:shadow-lg',
        },
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-200',
            badge: 'bg-orange-100 text-orange-700',
            hover: 'hover:border-orange-300 hover:shadow-lg',
        },
    };

    const colors = colorClasses[vertical.color] || colorClasses.emerald;

    return (
        <div
            className={`relative bg-white rounded-2xl border-2 transition-all ${isActive ? `${colors.border} shadow-md ${colors.hover}` : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                } p-8 flex flex-col h-full`}
            style={{ minHeight: '520px' }} // Strict height for alignment
        >
            {/* Status Badge - Fixed Position */}
            <div className="absolute top-6 right-6">
                {isActive && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${colors.badge} px-3 py-1.5 rounded-full`}>
                        <FiCheck className="w-3.5 h-3.5" />
                        Available
                    </span>
                )}
                {isComingSoon && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
                        Early Access
                    </span>
                )}
            </div>

            {/* Icon - Fixed Size & Position (8px grid) */}
            <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center mb-6 border ${colors.border}`}>
                <Icon className={`w-8 h-8 ${colors.text}`} />
            </div>

            {/* Title - Fixed Baseline (8px grid) */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{vertical.displayName}</h3>

            {/* Tagline - Fixed Height (8px grid) */}
            <p className={`text-sm font-medium ${colors.text} mb-4 h-5`}>{vertical.tagline}</p>

            {/* Micro Context - Fixed Height (8px grid) */}
            <p className="text-sm text-gray-600 mb-6 leading-relaxed h-16">{microContext}</p>

            {/* Pricing - Fixed Position & Typography (8px grid) */}
            <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                    {vertical.pricing.display}
                </div>
                {vertical.pricing.unit && (
                    <div className="text-sm text-gray-500">{vertical.pricing.unit}</div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mb-6"></div>

            {/* Features - Fixed Start Position (8px grid) */}
            <ul className="space-y-3 mb-8 flex-1">
                {vertical.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                        <FiCheck className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                        <span className="leading-relaxed">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* Bottom Section - Fixed Alignment */}
            <div className="mt-auto">
                {/* Subtle Note */}
                <p className="text-xs text-gray-400 text-center mb-4">
                    Works standalone or combined with other modules
                </p>

                {/* CTA - Fixed Height & Alignment (8px grid) */}
                <button
                    onClick={onCTA}
                    className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isActive
                            ? `${colors.bg} ${colors.text} border-2 ${colors.border} hover:bg-opacity-80`
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                >
                    {isActive ? vertical.cta.available : vertical.cta.earlyAccess}
                    <FiArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default VerticalCard;
