'use client';

import { FiArrowRight, FiTrendingUp, FiZap, FiTarget, FiClock } from 'react-icons/fi';

const Transformation = () => {
    const transformations = [
        {
            icon: FiTarget,
            from: "Chaos",
            to: "Clarity",
            description: "One unified view of everything",
            gradient: "from-emerald-500 to-teal-400"
        },
        {
            icon: FiZap,
            from: "Manual",
            to: "Automation",
            description: "AI handles repetitive work",
            gradient: "from-emerald-500 to-teal-400"
        },
        {
            icon: FiTrendingUp,
            from: "Stock Loss",
            to: "Smart Forecasting",
            description: "Never run out, never over-stock",
            gradient: "from-emerald-500 to-teal-400"
        },
        {
            icon: FiClock,
            from: "8 Hours",
            to: "1 Click",
            description: "GST reports in seconds",
            gradient: "from-emerald-500 to-teal-400"
        }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
                        Transform Your Pharmacy
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        See how HopeRx Pharma turns daily struggles into effortless workflows
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {transformations.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={index}
                                className="group bg-slate-50 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-200"
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>

                                {/* Before/After */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-slate-400 line-through decoration-slate-400/50">{item.from}</span>
                                        <FiArrowRight className="text-slate-300" />
                                        <span className="text-sm font-bold text-slate-900">{item.to}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-emerald-500 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-slate-600">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Transformation;
