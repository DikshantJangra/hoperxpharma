'use client';

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { userApi } from "@/lib/api/user";
import { PaymentButton } from "@/components/payments/PaymentButton";
import {
    FiCheck, FiShield, FiClock, FiPlus, FiLock,
    FiTrendingUp, FiUsers, FiZap
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";
import {
    BUSINESS_VERTICALS,
    COMBO_BUNDLES,
    formatPrice,
    getVerticalPrice,
} from "@/lib/constants/pricing-constants";
import { ComboBundleSection } from "@/components/pricing/ComboBundle";

export default function PlanAndBilling() {
    const { user } = useAuthStore();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const data = await userApi.getPrimaryStore();
                setStore(data);
            } catch (err) {
                console.error("Failed to load store", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, []);

    // Get subscription data
    const subscription = store?.subscription;
    const isPaid = subscription?.status === 'ACTIVE';
    const isTrial = subscription?.status === 'TRIAL' || !subscription?.status;
    const isExpired = subscription?.status === 'EXPIRED';

    // Calculate days remaining
    const expiryDate = subscription?.trialEndsAt
        ? new Date(subscription.trialEndsAt)
        : subscription?.currentPeriodEnd
            ? new Date(subscription.currentPeriodEnd)
            : null;
    const daysLeft = expiryDate
        ? Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Get active verticals from subscription (new schema) or fallback
    const activeVerticalIds = subscription?.activeVerticals?.length > 0
        ? subscription.activeVerticals
        : ['retail']; // Default fallback

    // Map active vertical IDs to full vertical objects
    const activeVerticals = activeVerticalIds
        .map((id: string) => {
            const key = id.toUpperCase();
            return BUSINESS_VERTICALS[key];
        })
        .filter(Boolean);

    // Available verticals (not yet subscribed)
    const availableVerticals = Object.values(BUSINESS_VERTICALS)
        .filter(v => !activeVerticalIds.includes(v.id.toLowerCase()));

    // Billing info
    const billingCycle = subscription?.billingCycle || 'monthly';
    const monthlyAmount = subscription?.monthlyAmount || 0;

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-100 rounded-3xl"></div>
            <div className="h-64 bg-gray-100 rounded-3xl"></div>
            <div className="h-48 bg-gray-100 rounded-3xl"></div>
        </div>;
    }

    return (
        <div className="space-y-8">

            {/* 1. Status Banner - Different for Trial vs Paid */}
            {isPaid ? (
                /* Paid User Banner */
                <div className="bg-white rounded-3xl shadow-sm border-2 border-emerald-200 p-6 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 border border-emerald-100">
                            <FiCheck className="w-7 h-7" />
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Subscription Active</h2>
                                    <p className="text-gray-500 text-sm">
                                        {activeVerticals.map((v: any) => v.displayName).join(' + ')} • {billingCycle === 'yearly' ? 'Annual' : 'Monthly'} billing
                                    </p>
                                </div>
                                <div className="mt-2 md:mt-0 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100 inline-flex items-center gap-1">
                                    <FiCheck className="w-4 h-4" />
                                    {daysLeft > 0 ? `${daysLeft} Days Left` : 'Active'}
                                </div>
                            </div>
                            {monthlyAmount > 0 && (
                                <p className="text-sm text-gray-600">
                                    Next billing: <span className="font-semibold">{formatPrice(monthlyAmount)}</span> on {expiryDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />
                </div>
            ) : (
                /* Trial/Expired User Banner */
                <div className={`bg-white rounded-3xl shadow-sm border ${isExpired ? 'border-red-200' : 'border-gray-200'} p-6 relative overflow-hidden`}>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl ${isExpired ? 'bg-red-50 text-red-500 border-red-100' : 'bg-amber-50 text-amber-500 border-amber-100'} flex items-center justify-center flex-shrink-0 border`}>
                            <FiClock className="w-7 h-7" />
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                                        {isExpired ? 'Trial Expired' : 'Free Trial Active'}
                                    </h2>
                                    <p className="text-gray-500 text-sm">
                                        {isExpired ? 'Upgrade to continue using HopeRx' : 'Experience the full power of HopeRx Retail.'}
                                    </p>
                                </div>
                                <div className={`mt-2 md:mt-0 px-3 py-1.5 ${isExpired ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'} rounded-full text-sm font-bold border inline-block`}>
                                    {isExpired ? 'Expired' : `${daysLeft} Days Remaining`}
                                </div>
                            </div>
                            {!isExpired && (
                                <div className="mt-3 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${Math.max(5, 100 - (daysLeft / 14) * 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${isExpired ? 'from-red-50/50' : 'from-amber-50/50'} to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60`} />
                </div>
            )}

            {/* 2. Active Business Modules */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Your Active Business Modules</h3>
                        <p className="text-xs text-gray-500">Modules currently running your operations</p>
                    </div>
                    <span className="text-xs text-gray-400">{activeVerticals.length} active</span>
                </div>

                {/* Active Modules */}
                {activeVerticals.map((vertical: typeof BUSINESS_VERTICALS.RETAIL) => {
                    const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
                        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
                        blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
                        purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
                        orange: { bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
                    };
                    const colors = colorClasses[vertical.color] || colorClasses.emerald;

                    return (
                        <div key={vertical.id} className={`bg-white rounded-2xl shadow-sm border-2 ${isPaid ? 'border-emerald-200' : 'border-amber-200'} p-6 relative overflow-hidden`}>
                            <div className="absolute top-4 right-4">
                                <span className={`inline-flex items-center gap-1 text-xs font-bold ${isPaid ? 'bg-emerald-100 text-emerald-700' : colors.badge} px-2 py-1 rounded-full`}>
                                    <FiCheck className="w-3 h-3" />
                                    {isPaid ? 'Active' : 'Active Trial'}
                                </span>
                            </div>

                            <div className="flex items-start gap-5">
                                <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 border ${vertical.borderColor}`}>
                                    <FaCrown className={`w-6 h-6 ${colors.text}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">{vertical.displayName}</h4>
                                    <p className="text-sm text-gray-500 mb-4">{vertical.description}</p>

                                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <span className="text-xs text-gray-500 block mb-1">
                                                {isPaid ? 'Your Plan' : 'Standalone Price'}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {isPaid && monthlyAmount > 0
                                                    ? formatPrice(monthlyAmount)
                                                    : formatPrice(getVerticalPrice(vertical, false, false))
                                                }
                                                <span className="text-sm font-normal text-gray-400">
                                                    /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <span className="text-xs text-gray-500 block mb-1">
                                                {isPaid ? 'Renews In' : 'Trial Ends'}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">{daysLeft} days</span>
                                        </div>
                                    </div>

                                    {/* Only show payment button for trial users */}
                                    {!isPaid && (
                                        <>
                                            <PaymentButton
                                                amount={getVerticalPrice(vertical, false, true)}
                                                user={{
                                                    firstName: user?.firstName,
                                                    lastName: user?.lastName,
                                                    email: user?.email,
                                                    phoneNumber: user?.phoneNumber,
                                                    storeId: store?.id || user?.storeUsers?.[0]?.storeId
                                                }}
                                                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                            />
                                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                                                <FiShield className="w-3.5 h-3.5" />
                                                Secured by Razorpay • Annual billing saves ₹1,200
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. Available Business Modules */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-900">Available Business Modules</h3>
                        <p className="text-xs text-gray-500">Expand your operations with additional verticals</p>
                    </div>
                    <span className="text-xs font-medium bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100">
                        Coming Soon
                    </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    {availableVerticals.map((vertical) => {
                        const colorClasses: Record<string, { bg: string; text: string }> = {
                            blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
                            purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
                            orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
                        };
                        const colors = colorClasses[vertical.color] || { bg: 'bg-gray-50', text: 'text-gray-600' };

                        const price = getVerticalPrice(vertical, false, false);
                        const isCustomPricing = vertical.pricing.model === 'custom' || vertical.pricing.model === 'usage';

                        return (
                            <div
                                key={vertical.id}
                                className="relative bg-white rounded-2xl border border-gray-200 p-6 opacity-75 hover:opacity-100 transition-all hover:border-gray-300"
                            >
                                {/* Coming Soon Badge */}
                                <div className="absolute top-4 right-4">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                        <FiLock className="w-2.5 h-2.5" />
                                        Soon
                                    </span>
                                </div>

                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 border ${vertical.borderColor}`}>
                                    <div className={`w-6 h-6 ${colors.text}`}>
                                        {/* Icon placeholder */}
                                        <FaCrown className="w-full h-full" />
                                    </div>
                                </div>

                                {/* Content */}
                                <h4 className="font-bold text-gray-900 mb-1">{vertical.displayName}</h4>
                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{vertical.tagline}</p>

                                {/* Pricing */}
                                <div className="mb-3">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-gray-400">{formatPrice(price)}</span>
                                        <span className="text-xs text-gray-400">/mo</span>
                                    </div>
                                    {isCustomPricing && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {vertical.pricing.display}
                                        </div>
                                    )}
                                </div>

                                {/* Add Button (disabled) */}
                                <button
                                    disabled
                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-400 text-sm font-medium cursor-not-allowed"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Module
                                </button>

                                {vertical.canBeStandalone && (
                                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                                        Works standalone or combined
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Smart Combos */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900">Based on Your Setup</h3>
                    <p className="text-xs text-gray-500">
                        Popular combinations for businesses like yours
                    </p>
                </div>
                <ComboBundleSection bundles={COMBO_BUNDLES.slice(0, 3)} showTitle={false} />
            </div>

            {/* 5. Value Props */}
            <div className="grid md:grid-cols-3 gap-4">
                {[
                    {
                        icon: <FiTrendingUp className="w-5 h-5 text-blue-600" />,
                        bg: "bg-blue-50",
                        title: "Insights",
                        desc: "Track daily sales & profit margins"
                    },
                    {
                        icon: <FiUsers className="w-5 h-5 text-purple-600" />,
                        bg: "bg-purple-50",
                        title: "Loyalty",
                        desc: "Retain customers with points & rewards"
                    },
                    {
                        icon: <FiZap className="w-5 h-5 text-orange-600" />,
                        bg: "bg-orange-50",
                        title: "Speed",
                        desc: "Process billing 3x faster"
                    }
                ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                        <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            {item.icon}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                            <p className="text-gray-500 text-xs">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 6. Billing History */}
            <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Billing History</h3>
                </div>
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-gray-400 text-sm">No payment history available yet.</p>
                </div>
            </div>

        </div>
    );
}
