'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiHelpCircle, FiArrowRight, FiShield, FiZap, FiTarget, FiLayers, FiDollarSign, FiFileText, FiUsers, FiLock } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/landing/animations/FadeIn';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { PaymentButton } from '@/components/payments/PaymentButton';
import { VerticalCard } from '@/components/pricing/VerticalCard';
import {
    BUSINESS_VERTICALS,
    FREE_TIER,
    COMBO_BUNDLES,
    formatPrice,
} from '@/lib/constants/pricing-constants';

const Pricing = () => {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();

    const retailVertical = BUSINESS_VERTICALS.RETAIL;

    const handleCTA = (verticalName: string) => {
        if (verticalName === 'Retail') {
            router.push('/signup');
        } else {
            // TODO: Implement early access form
            console.log(`Early access request for ${verticalName}`);
        }
    };

    return (
        <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* SECTION 1: HERO */}
                <FadeIn className="text-center mb-20">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                        One Platform. Every Way<br />Healthcare Operates.
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Retail pharmacies, wholesalers, and hospitals — run independently or together, without switching systems.
                    </p>

                    {/* Value Props */}
                    <div className="flex flex-wrap justify-center gap-6 mb-10">
                        {[
                            { icon: FiCheck, text: 'No forced bundles' },
                            { icon: FiShield, text: 'No data silos' },
                            { icon: FiZap, text: 'Grows with your business' },
                        ].map((prop, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                <prop.icon className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-medium text-slate-700">{prop.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => router.push('/signup')}
                            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all hover:scale-105"
                        >
                            Start Free
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl border-2 border-slate-200 transition-all"
                        >
                            See How It Works
                        </button>
                    </div>
                    <p className="mt-6 text-sm font-medium text-slate-500">
                        Start Free. Upgrade When Ready.
                    </p>
                </FadeIn>

                {/* SECTION 2: WHO IT'S FOR (TOP) */}
                <FadeIn delay={0.2} className="mb-12">
                    <div className="text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                            Built for Every Healthcare Business Model
                        </h2>
                    </div>
                </FadeIn>

                {/* SECTION 3: HOW IT WORKS (BELOW) */}
                <FadeIn delay={0.3} id="how-it-works" className="mb-16">
                    <div className="text-center mb-12">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">
                            Modular by Design. Powerful by Choice.
                        </h3>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Build your perfect healthcare platform, one module at a time.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            {
                                icon: FiTarget,
                                title: 'Choose Your Starting Point',
                                desc: 'Pick the module that fits your business today',
                            },
                            {
                                icon: FiLayers,
                                title: 'Add What You Need',
                                desc: 'Expand with new modules as you grow',
                            },
                            {
                                icon: FiDollarSign,
                                title: 'Pay for What You Use',
                                desc: 'No forced bundles, no wasted features',
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all h-full">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200">
                                        <item.icon className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <div className="text-sm font-bold text-emerald-600 mb-2">STEP {idx + 1}</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="text-slate-600">{item.desc}</p>
                                </div>
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200" />
                                )}
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* SECTION 4: VERTICAL CARDS - WIDER LAYOUT */}
                <FadeIn delay={0.4} className="mb-20">
                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        <VerticalCard
                            vertical={BUSINESS_VERTICALS.RETAIL}
                            microContext="Independent pharmacies managing prescriptions, inventory, and customer loyalty"
                            onCTA={() => handleCTA('Retail')}
                        />
                        <VerticalCard
                            vertical={BUSINESS_VERTICALS.WHOLESALE}
                            microContext="Distributors handling bulk orders, credit terms, and B2B workflows"
                            onCTA={() => handleCTA('Wholesale')}
                        />
                        <VerticalCard
                            vertical={BUSINESS_VERTICALS.HOSPITAL}
                            microContext="Hospitals managing OPD, IPD, and pharmacy workflows at scale"
                            onCTA={() => handleCTA('Hospital')}
                        />
                        <VerticalCard
                            vertical={BUSINESS_VERTICALS.MULTICHAIN}
                            microContext="Pharmacy chains needing centralized control across multiple locations"
                            onCTA={() => handleCTA('Multichain')}
                        />
                    </div>
                </FadeIn>

                {/* SECTION 5: FREE TIER */}
                <FadeIn delay={0.5} className="mb-20">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Start Free. Upgrade When Ready.
                        </h3>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            No credit card required. No time limit. Just start building.
                        </p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="relative bg-white rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                Perfect for Getting Started
                            </div>

                            <div className="text-center mb-8 mt-4">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{FREE_TIER.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{FREE_TIER.description}</p>
                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                    <span className="text-lg font-bold text-slate-900">₹</span>
                                    <span className="text-5xl font-bold text-slate-900">0</span>
                                </div>
                                <p className="text-sm text-slate-500">Forever. No credit card needed.</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 mb-3">Included</h4>
                                    <ul className="space-y-3">
                                        {FREE_TIER.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                                                <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-400 mb-3">Upgrade for</h4>
                                    <ul className="space-y-3">
                                        {FREE_TIER.notIncluded.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-400">
                                                <FiX className="w-5 h-5 text-slate-300 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
                                <p className="text-sm text-emerald-700 font-medium text-center">
                                    ✓ Works with Retail, Wholesale, or Hospital modules
                                </p>
                            </div>

                            <button
                                onClick={() => router.push('/signup')}
                                className="w-full py-4 rounded-xl font-bold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40"
                            >
                                Start Free — No Credit Card
                            </button>
                        </div>
                    </div>
                </FadeIn>

                {/* SECTION 6: COMBINATIONS */}
                <FadeIn delay={0.6} className="mb-20">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">
                            Popular Combinations
                        </h3>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Most healthcare businesses don't fit into one box. That's why combinations are priced smarter.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        {COMBO_BUNDLES.map((combo) => (
                            <div
                                key={combo.id}
                                className={`relative p-6 rounded-2xl border transition-all ${combo.popular
                                    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                    }`}
                            >
                                {combo.popular && (
                                    <div className="absolute -top-2.5 left-4">
                                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                                            POPULAR
                                        </span>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h4 className="font-bold text-gray-900 mb-1">{combo.name}</h4>
                                    <p className="text-xs text-gray-500 mb-3">{combo.description}</p>
                                </div>

                                <div className="text-xl font-bold text-gray-900 mb-2">
                                    {combo.pricing.display}
                                </div>

                                {combo.pricing.savings && (
                                    <div className="flex items-center gap-1.5 mb-4">
                                        <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-600">
                                            {combo.pricing.savings}
                                        </span>
                                    </div>
                                )}

                                <div className="text-xs text-gray-400">
                                    {combo.verticals.map(v => BUSINESS_VERTICALS[v.toUpperCase()]?.displayName).join(' + ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </FadeIn>

                {/* SECTION 7: TRUST STRIP */}
                <FadeIn delay={0.7} className="mb-20">
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                            {[
                                { icon: FiFileText, title: 'Designed for Indian GST workflows', desc: 'Built-in compliance' },
                                { icon: FiLock, title: 'Secure & compliant', desc: 'Your data is safe' },
                                { icon: FiUsers, title: 'Built with pharmacists & operators', desc: 'Real-world tested' },
                            ].map((item, idx) => (
                                <div key={idx} className="text-center">
                                    <div className="text-3xl mb-2 flex justify-center">
                                        <item.icon className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadeIn>

                {/* SECTION 8: CUSTOM/ENTERPRISE */}
                <FadeIn delay={0.8} className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-tr-full pointer-events-none" />

                        <div className="relative z-10 text-center">
                            <h3 className="text-2xl md:text-3xl font-bold mb-4">
                                Need Something Custom?
                            </h3>
                            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                                Running a unique healthcare business? We can adapt. Custom integrations,
                                specialized workflows, and dedicated support available.
                            </p>

                            <div className="flex flex-wrap justify-center gap-4 mb-8">
                                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                    <FiCheck className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm">Custom Integrations</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                    <FiCheck className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm">Dedicated Support</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                                    <FiCheck className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm">SLA Guarantees</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.location.href = 'mailto:sales@hoperxpharma.com'}
                                className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                            >
                                Talk to Sales
                                <FiArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </FadeIn>

                {/* Help */}
                <FadeIn delay={0.9} className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                        <FiHelpCircle />
                        <span className="text-sm">Need help choosing? <a href="mailto:support@hoperxpharma.com" className="text-emerald-600 font-medium hover:underline">Chat with us</a></span>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Pricing;
