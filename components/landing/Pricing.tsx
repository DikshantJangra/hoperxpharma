'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiHelpCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/landing/animations/FadeIn';

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            name: "Free Forever",
            price: "0",
            description: "Perfect for new pharmacies just getting started.",
            features: [
                "Up to 50 prescriptions/month",
                "Basic POS & Billing",
                "Manual GST Reports",
                "Email Support",
                "Single User"
            ],
            notIncluded: [
                "WhatsApp Integration",
                "Inventory Forecasting",
                "Priority Support"
            ],
            cta: "Start Free",
            popular: false
        },
        {
            name: "Pro Growth",
            price: isAnnual ? "799" : "999",
            originalPrice: isAnnual ? "999" : null,
            description: "Everything you need to automate and grow.",
            features: [
                "Unlimited Prescriptions",
                "Advanced Inventory & Expiry",
                "WhatsApp Integration",
                "Smart GST Filing",
                "Priority Phone Support",
                "3 Staff Accounts"
            ],
            notIncluded: [],
            cta: "Start 14-Day Trial",
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            description: "For chains and high-volume pharmacies.",
            features: [
                "Multi-store Management",
                "Custom Integrations (ERP)",
                "Dedicated Account Manager",
                "Custom Reporting",
                "Unlimited Users",
                "SLA Guarantee"
            ],
            notIncluded: [],
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeIn className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Cheaper than your monthly expiry loss. No hidden fees.
                    </p>

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-center gap-4 mb-12">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-16 h-8 rounded-full bg-emerald-100 p-1 transition-colors duration-300 focus:outline-none"
                        >
                            <motion.div
                                className="w-6 h-6 rounded-full bg-emerald-600 shadow-sm"
                                animate={{ x: isAnnual ? 32 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                            Annually <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full ml-1 border border-emerald-100">-20%</span>
                        </span>
                    </div>
                </FadeIn>

                <FadeInStagger className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <FadeInItem key={index}>
                            <div className={`relative bg-white rounded-2xl p-8 border ${plan.popular ? 'border-emerald-500 shadow-xl scale-105 z-10' : 'border-slate-200 shadow-sm hover:shadow-lg'} transition-all duration-300 h-full flex flex-col`}>
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                        Most Popular
                                    </div>
                                )}

                                {/* Shimmer Effect for Pro Plan */}
                                {plan.popular && (
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                                        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_2.5s_infinite]" />
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <p className="text-slate-500 text-sm mb-6 h-10">{plan.description}</p>
                                    <div className="flex items-baseline gap-1">
                                        {plan.price !== "Custom" && <span className="text-lg font-bold text-slate-900">₹</span>}
                                        <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                                        {plan.price !== "Custom" && <span className="text-slate-500">/mo</span>}
                                    </div>
                                    {plan.originalPrice && (
                                        <div className="text-sm text-slate-400 line-through mt-1">
                                            ₹{plan.originalPrice}/mo
                                        </div>
                                    )}
                                    {isAnnual && plan.price !== "Custom" && plan.price !== "0" && (
                                        <div className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 inline-block px-2 py-1 rounded">
                                            Billed ₹{(parseInt(plan.price) * 12).toLocaleString()} yearly
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 mb-8">
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                                                <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                                                <FiX className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02]'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200'
                                    }`}>
                                    {plan.cta}
                                </button>
                            </div>
                        </FadeInItem>
                    ))}
                </FadeInStagger>

                <FadeIn delay={0.4} className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        <FiHelpCircle />
                        <span className="text-sm">Need help choosing? <a href="#" className="text-emerald-600 font-medium hover:underline">Chat with us</a></span>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Pricing;
