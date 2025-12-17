'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiCheck, FiArrowRight } from 'react-icons/fi';
import { FadeIn, FadeInStagger, FadeInItem } from '@/components/landing/animations/FadeIn';

const Hero = () => {
    return (
        <section className="relative pt-32 pb-32 overflow-hidden">
            {/* Animated Mesh Gradient Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse delay-2000" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeInStagger className="text-center max-w-5xl mx-auto">
                    <FadeInItem>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-8 shadow-sm hover:shadow-md transition-shadow cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Trusted by 500+ Pharmacies across India
                        </div>
                    </FadeInItem>

                    <FadeInItem>
                        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1]">
                            Manage Your Entire Pharmacy in <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                                One Powerful Dashboard
                            </span>
                        </h1>
                    </FadeInItem>

                    <FadeInItem>
                        <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                            Billing. Inventory. Prescriptions. GST. WhatsApp. All automated.
                            <br />
                            <span className="font-medium text-slate-900">Stop losing money to expiry and start growing today.</span>
                        </p>
                    </FadeInItem>

                    <FadeInItem>
                        <div className="flex flex-col sm:flex-row justify-center gap-5 mb-16">
                            <Link
                                href="/signup"
                                className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-2"
                            >
                                Start Free Trial
                                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/demo"
                                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:border-slate-300 flex items-center justify-center"
                            >
                                Book a Demo
                            </Link>
                        </div>
                    </FadeInItem>

                    <FadeInItem>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 mb-20">
                            <div className="flex items-center gap-2">
                                <FiCheck className="text-emerald-500 text-lg" />
                                <span>DPDPA Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheck className="text-emerald-500 text-lg" />
                                <span>99.9% Uptime</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheck className="text-emerald-500 text-lg" />
                                <span>No Credit Card Required</span>
                            </div>
                        </div>
                    </FadeInItem>
                </FadeInStagger>

                {/* Dashboard Preview - Real Screenshot with Premium Glassmorphism */}
                <FadeIn delay={0.4} direction="up">
                    <div className="relative mx-auto max-w-6xl group">
                        <div className="relative rounded-2xl overflow-hidden border border-white/40 shadow-2xl bg-white/40 backdrop-blur-xl p-3 transition-transform duration-700 hover:scale-[1.01]">
                            {/* Browser-like header */}
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/20">
                                <div className="flex gap-2 ml-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400/80 shadow-inner"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/80 shadow-inner"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400/80 shadow-inner"></div>
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/50 text-xs font-medium text-slate-500 border border-white/20 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        hoperxpharma.com/dashboard
                                    </div>
                                </div>
                            </div>

                            {/* Real Dashboard Screenshot */}
                            <div className="relative rounded-lg overflow-hidden shadow-inner border border-slate-200/50">
                                <Image
                                    src="/screenshots/dashboard.png"
                                    alt="HopeRx Pharma Dashboard"
                                    width={1200}
                                    height={800}
                                    className="w-full h-auto"
                                    priority
                                />
                                {/* Screen reflection effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Decorative glow behind dashboard */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-purple-500/30 rounded-[2rem] blur-3xl -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

export default Hero;
