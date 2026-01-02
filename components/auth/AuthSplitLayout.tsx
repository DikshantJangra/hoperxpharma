"use client";

import React from 'react';

interface AuthSplitLayoutProps {
    children: React.ReactNode;
    mode: 'login' | 'signup';
}

export function AuthSplitLayout({ children, mode }: AuthSplitLayoutProps) {
    const isLogin = mode === 'login';

    return (
        <div className="min-h-screen w-full flex">
            {/* LEFT PANEL - Clean light gradient */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">

                {/* Subtle emerald accent */}
                <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">

                    {/* Logo */}
                    <div className="mb-12">
                        <div className="relative flex justify-center items-center w-24 h-24">
                            <div className="absolute w-full h-full rounded-full bg-emerald-500/10"></div>
                            <div className="relative flex justify-center items-center font-bold text-white text-3xl w-16 h-16 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
                                <span className="absolute" style={{ transform: 'translate(-7px, -1px)' }}>R</span>
                                <span className="absolute" style={{ transform: 'translate(7px, 1px)' }}>x</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Message */}
                    <div className="text-center space-y-6 max-w-md">
                        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                            {isLogin ? 'Welcome back' : 'Get started'}
                        </h1>

                        <p className="text-lg text-gray-600">
                            {isLogin
                                ? "Modern pharmacy management made simple"
                                : "Join 500+ pharmacies growing with HopeRx"
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Clean white */}
            <div className="flex-1 flex items-center justify-center p-6 bg-white">

                {/* Content */}
                <div className="w-full max-w-md">
                    {/* Logo for Mobile */}
                    <div className="lg:hidden flex flex-col items-center text-center mb-8">
                        <div className="relative mb-4 flex justify-center items-center w-24 h-24">
                            <div className="absolute w-full h-full rounded-full bg-emerald-500/10"></div>
                            <div className="relative flex justify-center items-center font-bold text-white text-3xl w-16 h-16 rounded-full bg-emerald-500">
                                <span className="absolute" style={{ transform: 'translate(-7px, -1px)' }}>R</span>
                                <span className="absolute" style={{ transform: 'translate(7px, 1px)' }}>x</span>
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight">
                            <span className="text-gray-600">Hope</span>
                            <span className="text-emerald-500 relative">
                                Rx
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>
                            </span>
                            <span className="text-gray-600">Pharma</span>
                        </h1>
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </div>
        </div>
    );
}
