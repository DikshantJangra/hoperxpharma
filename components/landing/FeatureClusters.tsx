'use client';

import { FiTrendingUp, FiPackage, FiActivity, FiCheck, FiClock, FiShield, FiSmartphone, FiUsers, FiZap } from 'react-icons/fi';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/landing/animations/FadeIn';
import { motion } from 'framer-motion';

const FeatureClusters = () => {
    const clusters = [
        {
            title: "Run Operations Smoothly",
            description: "Automate the boring stuff so you can focus on patients.",
            icon: <FiZap className="w-6 h-6 text-amber-500" />,
            color: "amber",
            features: [
                { name: "Lightning Fast POS", desc: "Bill in 30 seconds or less" },
                { name: "Smart Prescriptions", desc: "Auto-verify interactions" },
                { name: "Batch Intelligence", desc: "Auto-pick nearest expiry" },
                { name: "Patient Profiles", desc: "Full history at a glance" }
            ]
        },
        {
            title: "Never Lose Money on Inventory",
            description: "Stop stockouts and expiry losses forever.",
            icon: <FiPackage className="w-6 h-6 text-blue-500" />,
            color: "blue",
            features: [
                { name: "Auto Stock Alerts", desc: "Know before you run out" },
                { name: "Supplier Management", desc: "Track best prices & returns" },
                { name: "Dead Stock Detection", desc: "Identify slow movers" },
                { name: "AI Forecasting", desc: "Predict demand accurately" }
            ]
        },
        {
            title: "Grow Your Business",
            description: "Turn one-time buyers into loyal customers.",
            icon: <FiTrendingUp className="w-6 h-6 text-emerald-500" />,
            color: "emerald",
            features: [
                { name: "WhatsApp Automation", desc: "Auto-send refill reminders" },
                { name: "Loyalty Program", desc: "Points & rewards system" },
                { name: "Smart Campaigns", desc: "Targeted offers via SMS" },
                { name: "Business Insights", desc: "Real-time profit analytics" }
            ]
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, string> = {
            amber: "bg-amber-50 text-amber-600 border-amber-100 group-hover:border-amber-200",
            blue: "bg-blue-50 text-blue-600 border-blue-100 group-hover:border-blue-200",
            emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:border-emerald-200"
        };
        return colors[color] || colors.emerald;
    };

    return (
        <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-blue-400/5 blur-[100px]" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-400/5 blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeIn className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                        Everything You Need to <span className="text-emerald-600">Win</span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Powerful features organized by the outcomes that matter most to you.
                    </p>
                </FadeIn>

                <div className="grid lg:grid-cols-3 gap-8">
                    {clusters.map((cluster, index) => (
                        <FadeIn delay={index * 0.1} key={index} className="h-full">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 h-full relative group overflow-hidden"
                            >
                                {/* Spotlight effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10">
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${getColorClasses(cluster.color)} transition-colors`}>
                                        {cluster.icon}
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                        {cluster.title}
                                    </h3>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        {cluster.description}
                                    </p>

                                    <ul className="space-y-4">
                                        {cluster.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3 group/item">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover/item:border-emerald-200 group-hover/item:bg-emerald-50 transition-colors">
                                                    <FiCheck className="w-3 h-3 text-emerald-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-900 block text-sm group-hover/item:text-emerald-700 transition-colors">
                                                        {feature.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {feature.desc}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureClusters;
