'use client';

import { FiCheck, FiStar, FiZap } from 'react-icons/fi';
import { ComboBundle, getVerticalById, formatPrice, BUSINESS_VERTICALS } from '@/lib/constants/pricing-constants';

interface ComboBundleCardProps {
    bundle: ComboBundle;
    isComingSoon?: boolean;
    onClick?: () => void;
}

export function ComboBundleCard({
    bundle,
    isComingSoon = true,
    onClick,
}: ComboBundleCardProps) {
    const verticals = bundle.verticals
        .map(getVerticalById)
        .filter(Boolean);

    return (
        <div
            className={`relative p-5 rounded-xl border transition-all ${bundle.popular
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
                : 'border-gray-200 bg-white hover:border-gray-300'
                } ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Popular Badge */}
            {bundle.popular && (
                <div className="absolute -top-2.5 left-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                        <FiStar className="w-2.5 h-2.5" />
                        POPULAR
                    </span>
                </div>
            )}

            {/* Coming Soon Badge */}
            {isComingSoon && (
                <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        Coming Soon
                    </span>
                </div>
            )}

            {/* Module Icons */}
            <div className="flex items-center gap-1 mb-3">
                {verticals.map((vertical, idx) => (
                    <div
                        key={vertical!.id}
                        className={`w-8 h-8 rounded-lg ${vertical!.bgColor} flex items-center justify-center ${idx > 0 ? '-ml-2' : ''
                            }`}
                        style={{ zIndex: verticals.length - idx }}
                    >
                        <span className="text-xs font-bold" style={{ color: `var(--${vertical!.color}-600)` }}>
                            {vertical!.displayName.charAt(0)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Bundle Name */}
            <h4 className="font-semibold text-gray-900 text-sm mb-1">{bundle.name}</h4>

            {/* Pricing */}
            <div className="mb-2">
                <span className="text-xl font-bold text-gray-900">{bundle.pricing.display}</span>
            </div>

            {/* Savings */}
            {bundle.pricing.savings && (
                <div className="flex items-center gap-1.5">
                    <FiZap className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">
                        {bundle.pricing.savings}
                    </span>
                </div>
            )}
        </div>
    );
}

interface ComboBundleSectionProps {
    bundles: ComboBundle[];
    showTitle?: boolean;
}

export function ComboBundleSection({ bundles, showTitle = true }: ComboBundleSectionProps) {
    return (
        <div className="space-y-4">
            {showTitle && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Growth Combos</h3>
                        <p className="text-xs text-gray-500">
                            Save more with bundled subscriptions
                        </p>
                    </div>
                    <span className="text-xs font-medium bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100">
                        Multi-module billing rolling out
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {bundles.map((bundle) => (
                    <ComboBundleCard
                        key={bundle.id}
                        bundle={bundle}
                        isComingSoon={true}
                    />
                ))}
            </div>
        </div>
    );
}

export default ComboBundleCard;
