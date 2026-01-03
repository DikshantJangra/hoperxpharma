'use client';

import { useAuthStore } from "@/lib/store/auth-store";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { FiCheck, FiShield, FiCreditCard } from "react-icons/fi";

export default function PlanAndBilling() {
    const { user } = useAuthStore();

    // In a real app, we would fetch current subscription details here
    const currentPlan = "Free Trial";
    const daysLeft = 14;

    return (
        <div className="space-y-6">
            {/* Current Plan Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Subscription Status</h2>
                        <p className="text-sm text-gray-500">Manage your billing and plan details</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Active
                    </span>
                </div>

                <div className="flex items-center gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 mb-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <FiClock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">Free Trial Active</p>
                        <p className="text-sm text-gray-600">Your trial expires in <span className="font-bold text-gray-900">{daysLeft} days</span>. Upgrade now to keep using Pro features.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Pro Plan Card */}
                    <div className="border border-emerald-200 rounded-xl p-6 bg-white shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            RECOMMENDED
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2">Pro Growth</h3>
                        <p className="text-sm text-gray-500 mb-4 h-10">Everything you need to automate and grow your pharmacy.</p>

                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-3xl font-bold text-gray-900">₹799</span>
                            <span className="text-gray-500">/mo</span>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">Billed Annually</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {[
                                "Unlimited Prescriptions",
                                "Advanced Inventory & Expiry",
                                "WhatsApp Integration",
                                "Smart GST Filing",
                                "Priority Phone Support"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                    <FiCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <PaymentButton
                            amount={799 * 12}
                            user={{
                                firstName: user?.firstName,
                                lastName: user?.lastName,
                                email: user?.email,
                                phoneNumber: user?.phoneNumber,
                                storeId: user?.storeUsers?.[0]?.storeId
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 py-6"
                        />

                        <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1">
                            <FiShield className="w-3 h-3" />
                            Secure payment via Razorpay
                        </p>
                    </div>

                    {/* Enterprise / Contact */}
                    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 flex flex-col justify-center text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Need Enterprise?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            For pharmacy chains requiring multi-store management, custom ERP integrations, and dedicated support.
                        </p>
                        <button
                            className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            onClick={() => window.location.href = 'mailto:sales@hoperxpharma.com'}
                        >
                            Contact Sales
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment History Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60 pointer-events-none">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Payment History</h2>
                    <button className="text-emerald-600 text-sm font-medium">Download All</button>
                </div>
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <FiCreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No payment history available yet.</p>
                </div>
            </div>
        </div>
    );
}

import { FiClock } from "react-icons/fi";
