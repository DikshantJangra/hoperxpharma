'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiClock, FiShield, FiTrendingUp, FiPackage, FiDollarSign, FiFileText, FiSmartphone, FiUsers, FiSearch, FiBell, FiBarChart2, FiRefreshCw, FiPrinter, FiDatabase, FiKey, FiCheckCircle, FiTruck, FiBook, FiSettings } from 'react-icons/fi';

const tips = [
    { icon: FiKey, text: "Use Ctrl+K to quickly search for any medicine in your inventory" },
    { icon: FiClock, text: "Automatic expiry alerts notify you 3 months before medicines expire" },
    { icon: FiZap, text: "Average billing time with HopeRx is just 28 seconds per transaction" },
    { icon: FiBell, text: "Enable WhatsApp notifications to send digital receipts instantly" },
    { icon: FiSmartphone, text: "Mobile app syncs in real-time - check sales from anywhere" },
    { icon: FiPackage, text: "Batch tracking helps identify slow-moving stock and optimize inventory" },
    { icon: FiDollarSign, text: "GST reports are auto-generated at month-end with zero manual work" },
    { icon: FiFileText, text: "Link prescriptions to sales for complete audit trails and compliance" },
    { icon: FiTrendingUp, text: "Dashboard shows live profit margins - know your earnings in real-time" },
    { icon: FiShield, text: "Bank-level encryption with AES-256 and automated daily backups" },
    { icon: FiBell, text: "Schedule automatic stock alerts when items run low" },
    { icon: FiPrinter, text: "Customize invoice templates with your pharmacy logo and footer" },
    { icon: FiUsers, text: "24/7 support team with average response time under 2 hours" },
    { icon: FiBarChart2, text: "Accept UPI, cards, and cash - all payment modes in one interface" },
    { icon: FiZap, text: "Keyboard shortcuts make billing 3x faster - check Help menu to learn" },
    { icon: FiDatabase, text: "Bulk import entire inventory from Excel in minutes" },
    { icon: FiRefreshCw, text: "Undo accidental sales with one click - complete transaction history" },
    { icon: FiTruck, text: "Generate purchase orders directly from low-stock alerts" },
    { icon: FiUsers, text: "Add staff members with role-based access control" },
    { icon: FiSearch, text: "Medicine database with 250K+ entries and intelligent auto-complete" },
    { icon: FiCheckCircle, text: "Regulatory compliance built-in - DPDPA, GST, and audit-ready reports" },
    { icon: FiBook, text: "Comprehensive video tutorials and onboarding sessions included" },
    { icon: FiSettings, text: "Multi-store support - manage multiple pharmacy locations from one account" },
    { icon: FiBarChart2, text: "Advanced analytics show best-selling products and seasonal trends" }
];

export function LoadingScreen() {
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Set random tip on mount (client-side only)
        setCurrentTipIndex(Math.floor(Math.random() * tips.length));
        setIsMounted(true);

        const interval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % tips.length);
        }, 7000); // Change tip every 7 seconds

        return () => clearInterval(interval);
    }, []);

    const CurrentIcon = tips[currentTipIndex].icon;

    if (!isMounted) return null; // Prevent server-client mismatch

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-emerald-50/30 to-white">
            <div className="flex flex-col items-center text-center px-4">
                {/* Animated Rx Logo */}
                <div className="relative mb-8 flex justify-center items-center w-[120px] h-[120px]">
                    <div className="absolute w-full h-full rounded-full bg-[#12B981]/15"></div>
                    {/* Infinite ping animations */}
                    <span
                        className="animate-ping absolute inline-flex h-[80px] w-[80px] rounded-full bg-[#12B981]/75"
                        style={{ animationDuration: '2s' }}
                    ></span>
                    <span
                        className="animate-ping absolute inline-flex h-[80px] w-[80px] rounded-full bg-[#12B981]/75"
                        style={{ animationDuration: '2s', animationDelay: '1s' }}
                    ></span>
                    <div className="relative flex justify-center items-center font-bold text-white text-[32px] w-[80px] h-[80px] rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                        <span className="absolute" style={{ transform: 'translate(-8px, -1px)' }}>R</span>
                        <span className="absolute" style={{ transform: 'translate(8px, 1px)' }}>X</span>
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="text-[36px] font-bold tracking-tighter mb-4">
                    <span className="text-[#A0A0A0]">Hope</span>
                    <span className="text-[#12B981] relative">
                        Rx
                        <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                        <span className="absolute -bottom-3 left-0 right-0 h-[3px] bg-[#12B981] rounded-full"></span>
                    </span>
                    <span className="text-[#A0A0A0]">Pharma</span>
                </h1>

                {/* Tagline */}
                <div className="max-w-md mb-6">
                    <p className="text-lg font-semibold text-slate-700 mb-2 animate-pulse">
                        Loading your pharmacy dashboard...
                    </p>
                    <p className="text-sm text-slate-500">
                        Streamline Operations • Maximize Profits • Minimize Errors
                    </p>
                </div>

                {/* Loading dots */}
                <div className="flex gap-2 mb-8">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>

                {/* Rotating Tips */}
                <div className="max-w-xl min-h-[60px] flex items-center justify-center">
                    <div
                        key={currentTipIndex}
                        className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-xl px-6 py-4 shadow-md animate-in fade-in duration-500 flex items-center gap-4"
                    >
                        <CurrentIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <p className="text-sm text-slate-700 font-medium text-left">
                            {tips[currentTipIndex].text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
