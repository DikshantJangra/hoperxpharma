"use client";

import React, { useState, useEffect } from 'react';
import { BiCheckShield } from 'react-icons/bi';
import { RiSecurePaymentFill } from 'react-icons/ri';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    const [showAnimation, setShowAnimation] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAnimation(false);
        }, 6000); // 6 seconds for the complete ping animation
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex items-center justify-center overflow-hidden p-6">
            {/* Main Card Container */}
            <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] duration-300">
                {/* Header with Logo and Brand */}
                <div className="flex flex-col items-center text-center pt-12 pb-8 px-12">
                    {/* Animated Logo */}
                    <div className="relative mb-6 flex justify-center items-center w-[98px] h-[98px]">
                        {/* Outer glow circle */}
                        <div className="absolute w-full h-full rounded-full bg-[#12B981]/15" />

                        {/* Animated ping rings */}
                        {showAnimation && (
                            <>
                                <span
                                    className="animate-ping absolute inline-flex h-[66px] w-[66px] rounded-full bg-[#12B981]/75"
                                    style={{ animationDuration: '3s', animationIterationCount: 2 }}
                                />
                                <span
                                    className="animate-ping absolute inline-flex h-[66px] w-[66px] rounded-full bg-[#12B981]/75"
                                    style={{ animationDuration: '3s', animationIterationCount: 2, animationDelay: '1.5s' }}
                                />
                            </>
                        )}

                        {/* Main logo circle */}
                        <div className="relative flex justify-center items-center font-bold text-white text-[26px] w-[66px] h-[66px] rounded-full bg-[#12B981]">
                            <span className="absolute" style={{ transform: 'translate(-6.5px, -1px)' }}>R</span>
                            <span className="absolute" style={{ transform: 'translate(6.5px, 1px)' }}>x</span>
                        </div>
                    </div>

                    {/* Brand Name */}
                    <h1 className="text-[32px] font-bold tracking-tighter mb-3">
                        <span className="text-[#A0A0A0]">Hope</span>
                        <span className="text-[#12B981] relative">
                            Rx
                            <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full" />
                            <span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full" />
                        </span>
                        <span className="text-[#A0A0A0]">Pharma</span>
                    </h1>
                </div>

                {/* Content Area */}
                <div className="px-12 pb-12">
                    {children}
                </div>

                {/* Security Badges Footer */}
                <div className="mt-6 mb-8 flex justify-center items-center gap-2 px-12">
                    <div className="relative group flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2 text-xs">
                        <BiCheckShield size={15} className="text-[#12B981]" />
                        <span>HIPAA Compliant</span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-80 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                            HIPAA-secured. No compromises on your privacy
                        </div>
                    </div>
                    <div className="relative group flex items-center gap-1.5 bg-black/5 text-black/80 rounded-lg px-3 py-2 text-xs">
                        <RiSecurePaymentFill size={15} className="text-[#12B981]" />
                        <span>256-bit SSL Secured</span>
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-80 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
                            256-bit SSL — tough security, zero compromise.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
