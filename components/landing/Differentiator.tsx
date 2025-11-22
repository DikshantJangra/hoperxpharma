'use client';

import { FiPackage, FiCheck, FiX } from 'react-icons/fi';

const Differentiator = () => {
    const comparisons = [
        { feature: "Prescription Workflow", competitor: false, hoperx: true, competitorText: "Basic", hoperxText: "Medical-grade" },
        { feature: "Drug Interactions", competitor: false, hoperx: true, competitorText: "None", hoperxText: "Real-time alerts" },
        { feature: "WhatsApp Integration", competitor: false, hoperx: true, competitorText: "Manual", hoperxText: "Fully automated" },
        { feature: "Batch-level Stock", competitor: false, hoperx: true, competitorText: "Limited", hoperxText: "Complete tracking" },
        { feature: "Supplier Analytics", competitor: false, hoperx: true, competitorText: "None", hoperxText: "Performance insights" },
        { feature: "Patient Adherence", competitor: false, hoperx: true, competitorText: "None", hoperxText: "Refill tracking" },
        { feature: "Modern UI", competitor: false, hoperx: true, competitorText: "Outdated", hoperxText: "Beautiful & fast" },
        { feature: "Mobile App", competitor: false, hoperx: true, competitorText: "Clunky", hoperxText: "Native & smooth" }
    ];

    return (
        <section className="py-20 bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                        Built For Pharmacists.{' '}
                        <span className="text-emerald-600">Not Just Billing.</span>
                    </h2>
                    <p className="text-xl text-slate-600">
                        Stop settling for billing software. Get pharmacy management software.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50">
                        <div className="p-4 text-sm font-semibold text-slate-700">Feature</div>
                        <div className="p-4 text-sm font-semibold text-slate-500 border-l border-slate-200">Marg/RedBook</div>
                        <div className="p-4 text-sm font-semibold text-emerald-700 border-l border-emerald-200 bg-emerald-50">
                            HopeRx Pharma
                        </div>
                    </div>

                    {comparisons.map((item, index) => (
                        <div
                            key={index}
                            className={`grid grid-cols-3 border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                        >
                            <div className="p-4 font-medium text-slate-900">
                                {item.feature}
                            </div>
                            <div className="p-4 border-l border-slate-200">
                                <div className="flex items-center gap-2">
                                    <FiX className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-slate-600">{item.competitorText}</span>
                                </div>
                            </div>
                            <div className="p-4 border-l border-emerald-200 bg-emerald-50/50">
                                <div className="flex items-center gap-2">
                                    <FiCheck className="w-5 h-5 text-emerald-600" />
                                    <span className="text-sm font-semibold text-emerald-700">{item.hoperxText}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <p className="text-2xl font-bold text-slate-900">
                        Stop settling for billing software.
                        <br />
                        <span className="text-emerald-600">Get pharmacy management software.</span>
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Differentiator;
