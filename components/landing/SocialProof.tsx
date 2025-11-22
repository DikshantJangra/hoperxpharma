'use client';

import { FiStar } from 'react-icons/fi';

const SocialProofSection = () => {
    const stats = [
        { number: "98%", label: "Accuracy", sublabel: "Never miss a pill count" },
        { number: "2.5X", label: "Faster", sublabel: "Billing at lightning speed" },
        { number: "40%", label: "Reduction", sublabel: "In stock loss and expiry" }
    ];

    const testimonials = [
        {
            name: "Rajesh Kumar",
            pharmacy: "Care Plus Pharmacy, Mumbai",
            image: "https://i.pravatar.cc/150?img=12",
            quote: "Stock accuracy went up 94%. No more manual counting or surprise shortages.",
            result: "₹18,000 saved monthly"
        },
        {
            name: "Priya Sharma",
            pharmacy: "HealthFirst Pharmacy, Delhi",
            image: "https://i.pravatar.cc/150?img=5",
            quote: "Expiry loss reduced by ₹15,000/month. The smart alerts are a game-changer.",
            result: "95% less waste"
        },
        {
            name: "Amit Patel",
            pharmacy: "MediCare Pharmacy, Bangalore",
            image: "https://i.pravatar.cc/150?img=33",
            quote: "GST filing takes 5 minutes now. It used to take my entire Sunday.",
            result: "30 hours saved/month"
        }
    ];

    const badges = [
        "🔒 Bank-Level Security",
        "✓ DPDPA Compliant",
        "✓ ISO Certified",
        "☁️ WhatsApp Cloud API",
        "⚡ 24/7 Support"
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

                                {/* Author */}
                                <div className="flex items-center gap-3">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full"
                                    />
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
                    </div>
                    <div className="flex flex-wrap justify-center gap-6">
                        {badges.map((badge, index) => (
                            <div
                                key={index}
                                className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700"
                            >
                                {badge}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
