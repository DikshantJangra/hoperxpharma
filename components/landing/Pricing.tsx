import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';

const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Choose the plan that fits your pharmacy's stage of growth.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative w-16 h-8 bg-emerald-100 rounded-full p-1 transition-colors duration-300 focus:outline-none"
                        >
                            <div
                                className={`w-6 h-6 bg-emerald-500 rounded-full shadow-md transform transition-transform duration-300 ${isYearly ? 'translate-x-8' : 'translate-x-0'
                                    }`}
                            ></div>
                        </button>
                        <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
                            Yearly <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full ml-1">Save 20%</span>
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {/* Starter Plan */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-emerald-200 transition-colors">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                        <p className="text-slate-500 text-sm mb-6">For new pharmacies getting started.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-slate-900">{isYearly ? '₹7,999' : '₹9,999'}</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <button className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors mb-8 border border-slate-200">
                            Start Free Trial
                        </button>
                        <ul className="space-y-4">
                            {['Core Billing', 'Inventory Tracking', 'Compliance Reports', 'Basic Support'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                                    <FaCheck className="text-emerald-500 flex-shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Professional Plan - Highlighted */}
                    <div className="bg-white p-8 rounded-2xl border-2 border-emerald-500 shadow-2xl relative transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Professional</h3>
                        <p className="text-slate-500 text-sm mb-6">For growing pharmacies maximizing profit.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-slate-900">{isYearly ? '₹11,999' : '₹14,999'}</span>
                            <span className="text-slate-500">/mo</span>
                        </div>
                        <button className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors mb-8 shadow-lg shadow-emerald-500/30">
                            Start Free Trial
                        </button>
                        <ul className="space-y-4">
                            {['Everything in Starter', 'AI Forecasting', 'OCR Scanning', 'WhatsApp Reminders', 'DIR/GST Analytics', 'Priority Support'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 text-sm font-medium">
                                    <FaCheck className="text-emerald-500 flex-shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-emerald-200 transition-colors">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                        <p className="text-slate-500 text-sm mb-6">For multi-store chains.</p>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-slate-900">Custom</span>
                        </div>
                        <button className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors mb-8">
                            Contact Sales
                        </button>
                        <ul className="space-y-4">
                            {['Multi-store Dashboard', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantees'].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                                    <FaCheck className="text-emerald-500 flex-shrink-0" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
