'use client';

import { FiStar, FiLock, FiCheck, FiLock, FiCloud, FiClock } from 'react-icons/fi';

const SocialProofSection = () => {
    const stats = [
        { number: "98%", label: "Accuracy", sublabel: "Never miss a pill count" },
        { number: "2.5X", label: "Faster", sublabel: "Billing at lightning speed" },
        { number: "40%", label: "Reduction", sublabel: "In stock loss and expiry" }
    ];

    const testimonials = [
        {
            name: "Rajesh Gupta",
            initials: "RG",
            color: "bg-blue-500",
            pharmacy: "Gupta Medicos, Delhi",
            quote: "I was using marg initially but shifted to HopeRx. Best decision. The mobile app is very fast and I can check my sales from home.",
            result: "Saved ₹2 Lakhs in 6 months"
        },
        {
            name: "Sneha Reddy",
            initials: "SR",
            color: "bg-purple-500",
            pharmacy: "Apollo Pharmacy Franchise, Hyderabad",
            quote: "Expiry management is superb. Earlier I used to throw medicines worth 10-15k every month. Now the system alerts me well in advance.",
            result: "Zero expiry loss since April"
        },
        {
            name: "Amit Patel",
            initials: "AP",
            color: "bg-emerald-500",
            pharmacy: "Shiv Shakti Medical, Ahmedabad",
            quote: "Billing is super fast. Even during peak evening hours, we clear the crowd quickly. My staff learned it in just 1 day.",
            result: "Billing time cut by 50%"
        }
    ];

    const badges = [
        { icon: FiLock, text: "Bank-Level Security", color: "text-blue-600" },
        { icon: FiLock, text: "DPDPA Compliant", color: "text-emerald-600" },
        { icon: FiCheck, text: "ISO Certified", color: "text-purple-600" },
        { icon: FiCloud, text: "WhatsApp Cloud API", color: "text-green-600" },
        { icon: FiClock, text: "24/7 Support", color: "text-orange-600" },
        { icon: FiLock, text: "GST Compliant", color: "text-indigo-600" },
        { icon: FiLock, text: "AES-256 Encryption", color: "text-red-600" },
        { icon: FiCloud, text: "Daily Auto Backups", color: "text-teal-600" },
        { icon: FiCheck, text: "99.9% Uptime SLA", color: "text-blue-600" },
        { icon: FiLock, text: "HIPAA Ready", color: "text-emerald-600" }
    ];

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-8 mb-20">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-5xl sm:text-6xl font-bold text-emerald-600 mb-2">
                                {stat.number}
                            </div>
                            <div className="text-xl font-semibold text-slate-900 mb-1">
                                {stat.label}
                            </div>
                            <div className="text-sm text-slate-600">
                                {stat.sublabel}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonials */}
                <div className="mb-16">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-4">
                        Trusted by Pharmacy Owners Across India
                    </h2>
                    <p className="text-xl text-slate-600 text-center mb-12">
                        Real results from real pharmacies
                    </p>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-slate-50 rounded-2xl p-6 hover:shadow-lg transition-shadow border border-slate-200"
                            >
                                {/* Stars */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <FiStar key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <blockquote className="text-slate-700 mb-4">
                                    "{testimonial.quote}"
                                </blockquote>

                                {/* Result */}
                                <div className="bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-lg px-3 py-2 inline-block mb-4">
                                    {testimonial.result}
                                </div>

                                {/* Author with Initials Avatar */}
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                                        {testimonial.initials}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{testimonial.name}</div>
                                        <div className="text-sm text-slate-600">{testimonial.pharmacy}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-slate-900">Trusted & Secure</h3>
                        <p className="text-slate-600 mt-2">Enterprise-grade security and compliance</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {badges.map((badge, index) => {
                            const Icon = badge.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white px-4 py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 flex items-center gap-2 hover:shadow-md transition-shadow"
                                >
                                    <Icon className={`w-4 h-4 ${badge.color} flex-shrink-0`} />
                                    <span className="text-xs">{badge.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
