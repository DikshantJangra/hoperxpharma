'use client';

import { FiActivity, FiAlertCircle, FiClock, FiFileText, FiTrendingDown, FiUsers } from 'react-icons/fi';

const PainPoints = () => {
    const challenges = [
        {
            icon: FiTrendingDown,
            title: "Inventory Gaps",
            text: "Stockouts and unexpected expiries affecting margins?"
        },
        {
            icon: FiUsers,
            title: "Staff Efficiency",
            text: "Billing errors or slow checkout queues during peak hours?"
        },
        {
            icon: FiFileText,
            title: "Manual GST",
            text: "Spending weekends sorting reliable tax reports?"
        },
        {
            icon: FiActivity,
            title: "Process Gaps",
            text: "Missing visibility into daily supplier and sales metrics?"
        }
    ];

    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Context */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                            <FiAlertCircle className="w-4 h-4" />
                            <span>Operational Challenges</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            Don't Let Complexity <br />
                            <span className="text-blue-600">Slow You Down</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                            Managing a modern pharmacy involves hundreds of daily decisions.
                            Without the right tools, small inefficiencies can quietly compound into significant lost revenue.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {challenges.map((item, index) => (
                                <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-4 text-slate-600">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: The Opportunity Card */}
                    <div className="relative">
                        {/* Decorative background blob */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-3xl opacity-50 blur-2xl"></div>

                        <div className="relative bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-8 md:p-10 text-center">
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Potential Revenue Recovery
                                </div>
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <div className="text-5xl sm:text-6xl font-bold text-slate-900">
                                        ₹80k
                                    </div>
                                    <div className="text-left text-sm text-slate-500 leading-tight">
                                        <span className="block text-emerald-600 font-bold">per month</span>
                                        in savings
                                    </div>
                                </div>

                                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                                    By automating inventory and compliance, our partners typically recover
                                    significant value lost to expiration and manual errors.
                                </p>

                                <div className="space-y-3 bg-slate-50 p-6 rounded-xl text-left">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-700 font-medium">Reduce expired stock losses</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-700 font-medium">Eliminate billing discrepancies</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-700 font-medium">Save 30+ hours of manual work</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-4 text-center">
                                <p className="text-blue-200 font-medium text-sm">
                                    Scales with you from 1 to 100+ stores
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default PainPoints;
