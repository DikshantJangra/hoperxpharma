'use client';

import { FiX } from 'react-icons/fi';

const PainPoints = () => {
    const pains = [
        "Struggling with stockouts and expiry loss?",
        "Employees making billing mistakes?",
        "Too many WhatsApp orders to track manually?",
        "GST work eating up your Sundays?",
        "Prescriptions not verified properly?",
        "No visibility into supplier performance?"
    ];

    return (
        <section className="py-20 bg-slate-900 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Pain Bullets */}
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">
                            Running a pharmacy shouldn't feel like{' '}
                            <span className="text-red-400">fighting fires</span>
                        </h2>

                        <div className="space-y-4">
                            {pains.map((pain, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                >
                                    <FiX className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-lg text-slate-200">{pain}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Financial Impact */}
                    <div className="text-center md:text-left">
                        <div className="bg-gradient-to-br from-red-500/20 to-amber-500/20 rounded-2xl p-8 border border-red-500/30 backdrop-blur-sm">
                            <div className="text-sm font-semibold text-red-300 mb-2 uppercase tracking-wide">
                                Average Monthly Loss
                            </div>
                            <div className="text-6xl sm:text-7xl font-bold text-white mb-4">
                                ₹30,000
                                <span className="text-4xl text-red-300">-</span>
                                ₹80,000
                            </div>
                            <p className="text-lg text-slate-300 mb-6">
                                Due to inefficiencies in inventory, billing, and compliance management
                            </p>

                            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                                <div className="text-sm text-slate-300 mb-2">Common causes:</div>
                                <ul className="text-sm text-slate-200 space-y-1">
                                    <li>• Expired stock write-offs</li>
                                    <li>• Billing errors & discrepancies</li>
                                    <li>• Time wasted on manual processes</li>
                                    <li>• Missed sales due to stock-outs</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-2xl font-bold text-emerald-400">
                                HopeRx Pharma fixes that. See how →
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PainPoints;
