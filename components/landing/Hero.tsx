import Link from 'next/link';
import Image from 'next/image';

const Hero = () => {
    return (
        <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
                        Turn Your Pharmacy into a <span className="text-emerald-600">Profit Engine</span>.
                    </h1>
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Stop losing money to expired stock and DIR fees. HopeRxPharma automates your inventory, simplifies compliance, and modernizes your workflow—all in the cloud.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
                        <Link
                            href="/signup"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-500/30 hover:scale-105"
                        >
                            Start Your 14-Day Free Trial
                        </Link>
                        <Link
                            href="/demo"
                            className="bg-white hover:bg-gray-50 text-slate-700 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg"
                        >
                            Book a Demo
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-6 text-sm text-slate-500 font-medium mb-16">
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            HIPAA & DPDPA Compliant
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Trusted by 50+ Pharmacies
                        </span>
                        <span className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            99.9% Uptime
                        </span>
                    </div>
                </div>

                {/* Dashboard Mockup Placeholder */}
                <div className="relative mx-auto max-w-5xl">
                    <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-2 aspect-[16/9] flex items-center justify-center overflow-hidden">
                        {/* In a real app, this would be an Image component */}
                        <div className="text-center">
                            <p className="text-slate-400 text-lg mb-2">Dashboard Preview</p>
                            <div className="w-full h-full bg-slate-800/50 rounded-lg flex items-center justify-center">
                                <span className="text-slate-600">Verification Queue & Profitability Widget</span>
                            </div>
                        </div>
                        {/* 
             <Image 
               src="/dashboard-mockup.png" 
               alt="HopeRxPharma Dashboard" 
               width={1200} 
               height={675} 
               className="rounded-lg"
             /> 
             */}
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl -z-10"></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
