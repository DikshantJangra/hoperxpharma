'use client';

import { FiLock, FiArrowRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface GatedFeatureCardProps {
    /** Feature name (e.g., "WhatsApp Bills") */
    featureName: string;

    /** Block reason */
    reason: string;

    /** Upgrade prompt text */
    upgradePrompt: string;

    /** Required modules to unlock */
    requiredModules: string[];

    /** Optional custom CTA text */
    ctaText?: string;

    /** Optional onClose callback */
    onClose?: () => void;
}

/**
 * GatedFeatureCard - Inline explanation when clicking a gated feature
 * 
 * Design principles:
 * - Inline, not modal (less disruptive)
 * - Educational, not punitive
 * - No urgency language
 * - Clear upgrade path
 */
export function GatedFeatureCard({
    featureName,
    reason,
    upgradePrompt,
    requiredModules,
    ctaText,
    onClose,
}: GatedFeatureCardProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        router.push('/profile');
    };

    // Format module names for display
    const moduleNames = requiredModules
        .map(m => {
            switch (m) {
                case 'RETAIL': return 'Retail';
                case 'WHOLESALE': return 'Wholesale';
                case 'HOSPITAL': return 'Hospital Operations';
                case 'MULTICHAIN': return 'Multichain';
                default: return m;
            }
        })
        .join(' or ');

    return (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-lg">
            {/* Lock icon */}
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 border border-slate-200">
                <FiLock className="w-6 h-6 text-slate-600" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 mb-2">
                {reason}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                {upgradePrompt}
            </p>

            {/* Required plan */}
            {requiredModules.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-1">REQUIRED PLAN</p>
                    <p className="text-sm font-bold text-slate-900">{moduleNames}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleUpgrade}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                    {ctaText || `Upgrade ${moduleNames} Plan`}
                    <FiArrowRight className="w-4 h-4" />
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * GatedFeatureModal - Modal version for more prominence
 */
export function GatedFeatureModal({
    isOpen,
    ...props
}: GatedFeatureCardProps & { isOpen: boolean }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <GatedFeatureCard {...props} />
            </div>
        </div>
    );
}
