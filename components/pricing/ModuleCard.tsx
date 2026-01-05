'use client';

import { FiPackage, FiShoppingBag, FiActivity, FiGrid, FiLock, FiCheck } from 'react-icons/fi';
import { BusinessModule, getModulePrice, formatPrice } from '@/lib/constants/pricing-constants';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    FiShoppingBag,
    FiPackage,
    FiActivity,
    FiGrid,
};

interface ModuleCardProps {
    module: BusinessModule;
    isActive?: boolean;
    isAddon?: boolean;
    showFeatures?: boolean;
    compact?: boolean;
    onClick?: () => void;
}

export function ModuleCard({
    module,
    isActive = false,
    isAddon = true,
    showFeatures = false,
    compact = false,
    onClick,
}: ModuleCardProps) {
    const Icon = iconMap[module.icon] || FiPackage;
    const isComingSoon = module.status === 'coming_soon';
    const price = getModulePrice(module, isAddon);

    const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string }> = {
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-200 hover:border-emerald-300',
            badge: 'bg-emerald-100 text-emerald-700',
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200 hover:border-blue-300',
            badge: 'bg-blue-100 text-blue-700',
        },
        purple: {
            bg: 'bg-purple-50',
            text: 'text-purple-600',
            border: 'border-purple-200 hover:border-purple-300',
            badge: 'bg-purple-100 text-purple-700',
        },
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-600',
            border: 'border-orange-200 hover:border-orange-300',
            badge: 'bg-orange-100 text-orange-700',
        },
    };

    const colors = colorClasses[module.color] || colorClasses.emerald;

    if (compact) {
        return (
            <div
                className={`relative p-4 rounded-xl border transition-all ${isActive
                        ? `${colors.border} ${colors.bg}`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${isComingSoon ? 'opacity-75' : ''} ${onClick ? 'cursor-pointer' : ''}`}
                onClick={onClick}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">{module.displayName}</h4>
                            {isComingSoon && (
                                <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    Soon
                                </span>
                            )}
                            {isActive && (
                                <span className={`text-[10px] font-medium ${colors.badge} px-1.5 py-0.5 rounded`}>
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{module.shortDescription}</p>
                    </div>
                    {!isComingSoon && (
                        <div className="text-right">
                            <span className="font-bold text-gray-900 text-sm">{formatPrice(price)}</span>
                            <span className="text-gray-400 text-xs">/mo</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className={`relative p-6 rounded-2xl border transition-all ${isActive
                    ? `${colors.border} shadow-md`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                } ${isComingSoon ? 'opacity-80' : ''} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Coming Soon Badge */}
            {isComingSoon && (
                <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <FiLock className="w-3 h-3" />
                        Coming Soon
                    </span>
                </div>
            )}

            {/* Active Badge */}
            {isActive && (
                <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${colors.badge} px-2.5 py-1 rounded-full`}>
                        <FiCheck className="w-3 h-3" />
                        Active
                    </span>
                </div>
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-gray-900 mb-1">{module.displayName}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{module.description}</p>

            {/* Price */}
            {!isComingSoon && (
                <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">{formatPrice(price)}</span>
                        <span className="text-gray-500 text-sm">/month</span>
                    </div>
                    {isAddon && 'addon' in module.price && (
                        <p className="text-xs text-gray-400 mt-1">
                            As add-on to Retail
                        </p>
                    )}
                </div>
            )}

            {/* Price Hint for Coming Soon */}
            {isComingSoon && (
                <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-semibold text-gray-400">From {formatPrice(price)}</span>
                        <span className="text-gray-400 text-sm">/mo</span>
                    </div>
                </div>
            )}

            {/* Features */}
            {showFeatures && module.features.length > 0 && (
                <ul className="space-y-2">
                    {module.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                            <FiCheck className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ModuleCard;
