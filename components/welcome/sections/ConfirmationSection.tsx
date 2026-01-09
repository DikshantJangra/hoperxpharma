'use client';

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaFileInvoiceDollar, FaCalendarAlt, FaClock, FaCreditCard } from 'react-icons/fa';
import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses } from '@/lib/animations/welcomeAnimations';

const STATUSES = [
    "OPTIMIZING_DATABASE_INDEXES...",
    "ALLOCATING_SECURE_STORAGE...",
    "CONFIGURING_USER_PERMISSIONS...",
    "SYNCING_MASTER_DATA...",
    "FINALIZING_SETUP..."
];

/**
 * Section 2: Confirmation
 * Purpose: Remove doubt, state facts
 * Duration: 6s
 */
export function ConfirmationSection({
    isActive,
    onComplete,
    subscriptionData
}: WelcomeSectionProps) {
    const [statusIndex, setStatusIndex] = useState(0);

    useEffect(() => {
        if (isActive) {
            // Status cycler
            const statusInterval = setInterval(() => {
                setStatusIndex((prev: number) => (prev + 1) % STATUSES.length);
            }, 1500);

            // Completion timer (6s)
            const timer = setTimeout(() => {
                clearInterval(statusInterval);
                onComplete();
            }, 6000);

            return () => {
                clearTimeout(timer);
                clearInterval(statusInterval);
            };
        }
    }, [isActive, onComplete]); // Removed 'statuses' from dependencies

    if (!isActive) return null;

    const planDisplay = subscriptionData?.planName || 'Premium';
    const billingCycle = subscriptionData?.billingCycle === 'yearly' ? 'ANNUAL' : 'MONTHLY';
    const timestamp = new Date().toISOString().split('T')[0];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono selection:bg-emerald-500/30">
            {/* Main Heading with animated payment icons */}
            <div className="relative mb-12">
                <FaCreditCard className="absolute -left-16 top-1/2 -translate-y-1/2 text-4xl text-emerald-500 opacity-20 animate-[slideInFromLeft_1s_ease-out]" />
                <FaCheckCircle className="absolute -right-16 top-1/2 -translate-y-1/2 text-4xl text-emerald-500 opacity-20 animate-[slideInFromRight_1s_ease-out]" />
                <h1
                    className={`text-2xl md:text-5xl font-bold text-white uppercase tracking-tight flex items-center gap-4 ${getAnimationClass(animationClasses.fadeInUp)}`}
                    style={{ animationDelay: '100ms' }}
                >
                    <FaCheckCircle className="text-emerald-500 animate-[bounce_1s_ease-in-out_2]" /> PAYMENT_VERIFIED<span className="animate-pulse text-emerald-500">_</span>
                </h1>
            </div>

            {/* Data Block - FULL EMERALD DESIGN */}
            <div className="bg-emerald-600 border border-emerald-500 p-8 md:p-12 rounded-lg max-w-xl w-full relative overflow-hidden group shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                {/* Decorative scanning line (Custom color for emerald bg) */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 animate-scan" />

                {/* Corner Accents - White now */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-white/50" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-white/50" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-white/50" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-white/50" />

                <div className="space-y-8 text-sm md:text-lg font-mono text-white">
                    <div
                        className={`flex justify-between items-center border-b border-white/20 pb-4 border-dashed ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '300ms' }}
                    >
                        <div className="flex items-center gap-3 text-emerald-100/90">
                            <FaCheckCircle className="text-xl" />
                            <span>TX_STATUS</span>
                        </div>
                        <span className="font-bold tracking-wider bg-white text-emerald-700 px-3 py-1 rounded-sm shadow-sm">CONFIRMED</span>
                    </div>

                    <div
                        className={`flex flex-col border-b border-white/20 pb-4 border-dashed ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '600ms' }}
                    >
                        <div className="flex items-center gap-3 text-emerald-100/90 mb-2">
                            <FaFileInvoiceDollar className="text-xl" />
                            <span className="text-xs">PLAN_TYPE</span>
                        </div>
                        <span className="text-white font-bold text-xl md:text-2xl break-words w-full tracking-tight">{planDisplay.toUpperCase()}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div
                            className={`flex flex-col gap-1 ${getAnimationClass(animationClasses.fadeInUp)}`}
                            style={{ animationDelay: '900ms' }}
                        >
                            <span className="flex items-center gap-2 text-emerald-100/90 text-xs">
                                <FaCalendarAlt /> BILLING
                            </span>
                            <span className="text-white font-bold text-lg">{billingCycle}</span>
                        </div>

                        <div
                            className={`flex flex-col gap-1 text-right ${getAnimationClass(animationClasses.fadeInUp)}`}
                            style={{ animationDelay: '1200ms' }}
                        >
                            <span className="flex items-center justify-end gap-2 text-emerald-100/90 text-xs">
                                TIMESTAMP <FaClock />
                            </span>
                            <span className="text-white font-mono">{timestamp}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic Status Lines */}
            <div
                className={`mt-12 w-full max-w-lg text-emerald-500/90 text-xs md:text-sm font-mono ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '1800ms' }}
            >
                <div className="flex items-center gap-2 mb-2 h-6">
                    <span className="animate-spin text-emerald-500">⟳</span>
                    <span key={statusIndex} className="animate-pulse">{STATUSES[statusIndex]}</span>
                </div>
                <div className="h-1 bg-neutral-800 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[progress_6s_linear_forwards]" style={{ width: '100%' }} />
                </div>
            </div>

            <div
                className={`mt-4 text-neutral-700 text-[10px] uppercase tracking-widest ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '2000ms' }}
            >
                REF: {subscriptionData?.id}
            </div>
        </div>
    );
}
