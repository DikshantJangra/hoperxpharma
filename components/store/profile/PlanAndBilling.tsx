'use client';

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { userApi } from "@/lib/api/user";
import { PaymentButton } from "@/components/payments/PaymentButton";
import {
    FiCheck, FiShield, FiCreditCard, FiClock, FiStar, FiZap,
    FiTrendingUp, FiUsers, FiLayout, FiAward, FiArrowRight
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa";

export default function PlanAndBilling() {
    const { user } = useAuthStore();
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const data = await userApi.getPrimaryStore();
                setStore(data);
            } catch (err) {
                console.error("Failed to load store", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStore();
    }, []);

    // Calculate dynamic trial days
    const trialLength = 14;
    const createdAt = store?.createdAt ? new Date(store.createdAt) : new Date();
    const daysPassed = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, trialLength - daysPassed);
    const progress = ((trialLength - daysLeft) / trialLength) * 100;

    if (loading) {
        return <div className="animate-pulse space-y-8">
            <div className="h-48 bg-gray-100 rounded-3xl"></div>
            <div className="grid md:grid-cols-3 gap-8"><div className="h-96 bg-gray-100 rounded-3xl md:col-span-2"></div><div className="h-96 bg-gray-100 rounded-3xl"></div></div>
        </div>;
    }

    return (
        <div className="space-y-8">

            {/* 1. Status Card - Onboarding Style */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Icon Box */}
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-500 shadow-sm border border-amber-100">
                        <FiClock className="w-8 h-8" />
                    </div>

                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Free Trial Active</h2>
                                <p className="text-gray-500 text-sm">Experience the full power of HopeRx Pro.</p>
                            </div>
                            <div className="mt-2 md:mt-0 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100 inline-block">
                                {daysLeft} Days Remaining
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4 w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.max(5, 100 - (daysLeft / 14) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-50/50 to-transparent rounded-bl-full pointer-events-none -z-0 opacity-60" />
            </div>

            {/* 2. Pricing & Plans */}
            <div className="grid md:grid-cols-3 gap-8 items-start">

                {/* PRO PLAN (Occupies 2 columns) */}
                <div className="md:col-span-2 bg-white rounded-3xl shadow-xl border border-emerald-100 p-8 relative overflow-hidden group">
                    {/* Badge */}
                    <div className="absolute top-6 right-6">
                        <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wide">
                            Recommended
                        </span>
                    </div>

                    <div className="flex items-start gap-6 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm border border-emerald-100">
                            <FaCrown className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Pro Growth</h2>
                            <p className="text-gray-500 mt-1">Everything you need to automate & grow.</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 mb-8">
                        <div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">₹799</span>
                                <span className="text-gray-500 font-medium">/mo</span>
                            </div>
                            <p className="text-sm text-emerald-600 font-medium mb-6 bg-emerald-50 inline-block px-2 py-1 rounded">
                                Billed Annually (Save ₹2,400)
                            </p>

                            <PaymentButton
                                amount={799 * 12}
                                user={{
                                    firstName: user?.firstName,
                                    lastName: user?.lastName,
                                    email: user?.email,
                                    phoneNumber: user?.phoneNumber,
                                    storeId: store?.id || user?.storeUsers?.[0]?.storeId
                                }}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            />
                            <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                                <FiShield className="w-3.5 h-3.5" />
                                Secured by Razorpay
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="border-l border-gray-100 pl-0 md:pl-8">
                            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">What you get:</h4>
                            <ul className="space-y-3">
                                {[
                                    "Unlimited Prescriptions",
                                    "Advanced Inventory & Expiry",
                                    "WhatsApp & SMS Integration",
                                    "Smart GST Filing",
                                    "Priority Support"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <FiCheck className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ENTERPRISE PLAN */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col h-full hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-6 text-gray-600">
                        <FiLayout className="w-6 h-6" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
                    <p className="text-gray-500 text-sm mb-6">For multi-store chains requiring custom ERP integrations.</p>

                    <div className="mt-auto">
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                            <span className="block font-bold text-gray-900">Custom Pricing</span>
                        </div>
                        <button
                            className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                            onClick={() => window.location.href = 'mailto:sales@hoperxpharma.com'}
                        >
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Value Props Grid (Why Upgrade?) - Integrated style */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    {
                        icon: <FiTrendingUp className="w-5 h-5 text-blue-600" />,
                        bg: "bg-blue-50",
                        title: "Insights",
                        desc: "Track daily sales & profit margins"
                    },
                    {
                        icon: <FiUsers className="w-5 h-5 text-purple-600" />,
                        bg: "bg-purple-50",
                        title: "Loyalty",
                        desc: "Retain customers with points & rewards"
                    },
                    {
                        icon: <FiZap className="w-5 h-5 text-orange-600" />,
                        bg: "bg-orange-50",
                        title: "Speed",
                        desc: "Process billing 3x faster"
                    }
                ].map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-gray-300 transition-colors">
                        <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            {item.icon}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                            <p className="text-gray-500 text-xs">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. History */}
            <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900">Billing History</h3>
                </div>
                <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-gray-400 text-sm">No payment history available yet.</p>
                </div>
            </div>

        </div>
    );
}
