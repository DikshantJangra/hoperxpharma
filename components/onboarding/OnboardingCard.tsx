"use client";

import { ReactNode } from "react";

interface OnboardingCardProps {
    children: ReactNode;
    title: string;
    description: string;
    icon?: ReactNode;
}

export default function OnboardingCard({ children, title, description, icon }: OnboardingCardProps) {
    return (
        <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 relative overflow-hidden animate-fade-in-up">
            <div className="relative z-10">
                <div className="flex items-start gap-6 mb-8">
                    {icon && (
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-500 shadow-sm border border-emerald-100/50">
                            {icon}
                        </div>
                    )}
                    <div className="flex-1 pt-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                            {title}
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
                {children}
            </div>

            {/* Subtle decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />
        </div>
    );
}
