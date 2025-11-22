'use client';

import { FiArrowRight, FiTrendingUp, FiZap, FiTarget, FiClock } from 'react-icons/fi';

const Transformation = () => {
    const transformations = [
        {
            icon: FiTarget,
            from: "Chaos",
            to: "Clarity",
            description: "One unified view of everything",
            gradient: "from-emerald-500 to-teal-500"
        },
        {
            icon: FiZap,
            from: "Manual",
            to: "Automation",
            description: "AI handles repetitive work",
            gradient: "from-blue-500 to-indigo-500"
        },
        {
            icon: FiTrendingUp,
            from: "Stock Loss",
            to: "Smart Forecasting",
            description: "Never run out, never over-stock",
            gradient: "from-purple-500 to-pink-500"
        },
        {
            icon: FiClock,
            from: "8 Hours",
            to: "1 Click",
            description: "GST reports in seconds",
            gradient: "from-amber-500 to-orange-500"
        }
    ];

    return (
        <section className="py-20 bg-gradient-to-b from-white to-emerald-50/30">
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
                                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100"
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Before/After */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-red-500 line-through">{item.from}</span>
                                        <FiArrowRight className="text-slate-400" />
                                        <span className="text-sm font-bold text-emerald-600">{item.to}</span>
                                    </div>
                                    <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"></div>
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
