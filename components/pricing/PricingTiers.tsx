'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiZap, FiStar } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import { PaymentButton } from '@/components/payments/PaymentButton';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth-store';

interface PricingTier {
    tier: 'PROFESSIONAL' | 'ENTERPRISE';
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    features: string[];
    popular?: boolean;
}

const RETAIL_TIERS: PricingTier[] = [
    {
        tier: 'PROFESSIONAL',
        name: 'Professional',
        monthlyPrice: 999,
        yearlyPrice: 7999,
        description: 'Complete solution for retail pharmacies',
        features: [
            'POS & Billing',
            'Inventory Management',
            'CRM & Patient Management',
            'Advanced Analytics',
            'Loyalty Program',
            'SMS Notifications',
            'Unlimited Patients',
            '5GB Storage',
        ],
        popular: true,
    },
    {
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        monthlyPrice: 1999,
        yearlyPrice: 15999,
        description: 'Premium features with AI & multi-store',
        features: [
            'Everything in Professional',
            'AI-Powered Insights',
            'Multi-Store Management',
            'API Access',
            'Priority Support',
            '10GB Storage',
        ],
    },
];

interface PricingTiersProps {
    vertical: 'retail' | 'wholesale' | 'hospital';
    storeId: string;
    onPaymentSuccess?: () => void;
}

export function PricingTiers({ vertical = 'retail', storeId, onPaymentSuccess }: PricingTiersProps) {
    const { user } = useAuthStore();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await apiClient.get('/subscriptions/plans');
            setPlans(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const tiers = RETAIL_TIERS; // Can extend for other verticals

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getSavings = (monthly: number, yearly: number) => {
        const yearlyCost = monthly * 12;
        const savings = yearlyCost - yearly;
        return Math.round(savings);
    };

    const findMatchingPlan = (tier: string) => {
        const tierName = tier.toLowerCase();
        const cycle = billingCycle;
        return plans.find(p => 
            p.name?.toLowerCase().includes(vertical) &&
            p.name?.toLowerCase().includes(tierName) &&
            p.billingCycle === cycle
        );
    };

    if (loading) {
        return (
            <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-96" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Monthly
                </span>
                <button
                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                        billingCycle === 'yearly' ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                >
                    <span
                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                            billingCycle === 'yearly' ? 'translate-x-7' : ''
                        }`}
                    />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Yearly
                </span>
                {billingCycle === 'yearly' && (
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Save up to ₹4,000
                    </span>
                )}
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {tiers.map((tier) => {
                    const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
                    const savings = getSavings(tier.monthlyPrice, tier.yearlyPrice);
                    const matchingPlan = findMatchingPlan(tier.tier);

                    return (
                        <div
                            key={tier.tier}
                            className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                                tier.popular
                                    ? 'border-emerald-500 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        <FiStar className="w-3 h-3" />
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                                tier.tier === 'PROFESSIONAL' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-purple-50 text-purple-600'
                            }`}>
                                {tier.tier === 'PROFESSIONAL' ? <FiStar className="w-6 h-6" /> :
                                 <FaCrown className="w-6 h-6" />}
                            </div>

                            {/* Header */}
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{tier.description}</p>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">
                                        {formatPrice(price)}
                                    </span>
                                    <span className="text-gray-500 text-sm">
                                        /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                                    </span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <p className="text-xs text-emerald-600 font-medium mt-1">
                                        Save {formatPrice(savings)} per year
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-6">
                                {tier.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                        <FiCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            {matchingPlan ? (
                                <PaymentButton
                                    planId={matchingPlan.id}
                                    storeId={storeId}
                                    amount={price}
                                    planName={matchingPlan.displayName || `${tier.name} Plan`}
                                    user={{
                                        firstName: user?.firstName,
                                        lastName: user?.lastName,
                                        email: user?.email,
                                        phoneNumber: user?.phoneNumber,
                                    }}
                                    onSuccess={() => {
                                        console.log('Payment successful');
                                        onPaymentSuccess?.();
                                    }}
                                    onError={(error) => {
                                        console.error('Payment error:', error);
                                    }}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                                        tier.popular
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                    }`}
                                />
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-not-allowed"
                                >
                                    Coming Soon
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <FiCheck className="w-4 h-4 text-emerald-600" />
                    14-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                    <FiCheck className="w-4 h-4 text-emerald-600" />
                    No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                    <FiCheck className="w-4 h-4 text-emerald-600" />
                    Cancel anytime
                </span>
            </div>
        </div>
    );
}
