'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FadeIn } from '@/components/landing/animations/FadeIn';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';

const ROICalculator = () => {
    const [monthlyRevenue, setMonthlyRevenue] = useState(500000);
    const [expiryLossPercent, setExpiryLossPercent] = useState(5);

    const expiryLoss = (monthlyRevenue * expiryLossPercent) / 100;
    const hopeRxSavings = expiryLoss * 0.8; // Assume 80% reduction
    const annualSavings = hopeRxSavings * 12;

    return (
        <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            See How Much You're <span className="text-red-400">Losing</span> (And Could Be Saving)
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            Most pharmacies lose 5-10% of revenue to expired stock and pilferage.
                            HopeRx Pharma helps you recover that money instantly.
                        </p>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Monthly Revenue (₹)
                                </label>
                                <input
                                    type="range"
                                    min="100000"
                                    max="2000000"
                                    step="10000"
                                    value={monthlyRevenue}
                                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="mt-2 text-2xl font-bold text-white">
                                    ₹{monthlyRevenue.toLocaleString('en-IN')}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Estimated Expiry & Loss %
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="15"
                                    step="0.5"
                                    value={expiryLossPercent}
                                    onChange={(e) => setExpiryLossPercent(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <div className="mt-2 text-2xl font-bold text-white">
                                    {expiryLossPercent}%
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />

                            <div className="text-center mb-8">
                                <div className="text-sm text-slate-400 mb-1">Potential Annual Savings</div>
                                <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                                    ₹{annualSavings.toLocaleString('en-IN')}
                                </div>
                                <div className="text-sm text-emerald-400 mt-2 flex items-center justify-center gap-1">
                                    <FiTrendingUp />
                                    That's pure profit added to your bottom line
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-xs text-slate-400 mb-1">Monthly Loss Recovered</div>
                                    <div className="text-xl font-bold text-white">₹{hopeRxSavings.toLocaleString('en-IN')}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-xs text-slate-400 mb-1">Cost of HopeRx Pharma (Pro)</div>
                                    <div className="text-xl font-bold text-white">₹999</div>
                                </div>
                            </div>

                            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
                                <p className="text-emerald-200 text-sm">
                                    ROI: <span className="font-bold text-white">{(hopeRxSavings / 999).toFixed(1)}x</span> return on investment in the first month alone.
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
};

export default ROICalculator;
