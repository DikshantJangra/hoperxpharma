'use client';

import Link from 'next/link';
import { FiCheck, FiArrowRight, FiMessageCircle } from 'react-icons/fi';

const CTASection = () => {
    return (
        <section className="py-20 bg-gradient-to-br from-emerald-600 to-emerald-700 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E")`
                }}></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                    Start Managing Your Pharmacy
                    <br />
                    Better Today
                </h2>

                <p className="text-xl sm:text-2xl text-emerald-100 mb-10 max-w-3xl mx-auto">
                    Join 500+ pharmacies saving time and money with HopeRx Pharma
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                    <Link
                        href="/signup"
                        className="group bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        Start Free Trial
                        <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#demo"
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center"
                    >
                        Book 15-Min Demo
                    </Link>
                    <a
                        href="https://wa.me/919876543210"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        <FiMessageCircle className="text-green-400" />
                        WhatsApp Us
                    </a>
                </div>

                {/* Trust elements */}
                <div className="flex flex-wrap justify-center gap-6 text-sm text-emerald-100">
                    <span className="flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        No credit card required
                    </span>
                    <span className="flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        14-day free trial
                    </span>
                    <span className="flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        Setup in 10 minutes
                    </span>
                    <span className="flex items-center gap-2">
                        <FiCheck className="w-5 h-5" />
                        Cancel anytime
                    </span>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
