"use client";

import { FiActivity, FiClock, FiDollarSign, FiShield, FiTrendingUp } from 'react-icons/fi';

interface PatientInsights {
    identity: {
        lifecycleStage: string;
        manualTrustLevel?: string;
        systemTrust?: string;
        systemTrustScore: number;
        trustFactors?: any;
        profileStrength: number;
        profileDescription?: string;
        profileTier?: string;
        profileDetails?: string;
    };
    relationship: {
        visitCount: number;
        firstVisitAt?: string;
        lastVisitAt?: string;
        purchaseFrequency?: number;
        visitInterval?: number;
        totalSpent?: number;
        avgBillRange?: string;
    };
    paymentBehavior?: {
        onTimeRate?: number;
        overdueCount: number;
        creditSalesCount: number;
    };
    creditUsage?: {
        creditEnabled: boolean;
        currentBalance: number;
        creditLimit: number;
    };
    riskAssessment?: {
        riskLevel: string;
        reasons: Array<{
            code: string;
            label: string;
            detail: string;
        }>;
    };
}

interface PatientInsightsPanelProps {
    insights: PatientInsights;
    onViewGrowthTrust: () => void;
    onViewPurchaseBehavior: () => void;
}

export default function PatientInsightsPanel({ insights, onViewGrowthTrust, onViewPurchaseBehavior }: PatientInsightsPanelProps) {
    const { identity, relationship, paymentBehavior, creditUsage, riskAssessment } = insights;

    const getTrustExplanation = (trust: string) => {
        switch (trust) {
            case 'EXCEPTIONAL': return "Premium relationship. Immediate credit priority.";
            case 'HIGH': return "Reliable history with on-time payments.";
            case 'GOOD': return "Established relationship, stable patterns.";
            case 'MODERATE': return "Building history. Exercise standard due diligence.";
            case 'LOW': return "New or irregular relationship. Limited data.";
            default: return "Analyzing store relationship data...";
        }
    };

    return (
        <div className="space-y-6">
            {/* Above the Fold - Growth & Trust */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-full blur-3xl -mr-16 -mt-16 z-0" />

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Growth & Trust</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-3xl font-black text-gray-900 tracking-tighter">{identity.systemTrustScore || '---'}</span>
                            <div className="h-8 w-[1px] bg-gray-100" />
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Trust Score</p>
                                <p className={`text-xs font-black ${identity.systemTrust === 'EXCEPTIONAL' ? 'text-teal-600' : 'text-blue-600'}`}>
                                    {identity.systemTrust}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onViewGrowthTrust}
                        className="p-2.5 bg-gray-50 rounded-2xl hover:bg-teal-600 hover:text-white transition-all group-hover:scale-110 shadow-sm border border-gray-100"
                        title="View Trust Engine"
                    >
                        <FiShield size={18} />
                    </button>
                </div>

                {/* Trust & Profile Strength */}
                <div className="relative z-10 space-y-4">
                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FiShield className="text-teal-600 w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">System Assessment</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed mb-3">{getTrustExplanation(identity.systemTrust || 'LOW')}</p>
                        <div className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${(identity.systemTrustScore || 0) > 700 ? 'bg-teal-500' :
                                    (identity.systemTrustScore || 0) > 500 ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}
                                style={{ width: `${((identity.systemTrustScore || 300) - 300) / 600 * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50/20 rounded-2xl p-4 border border-blue-50">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <FiActivity className="text-blue-600 w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profile Performance</span>
                            </div>
                            <span className="text-xs font-black text-blue-700">{identity.profileStrength || 0}%</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 mb-0.5">{identity.profileTier || "Verified Patron"}</p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mb-3 opacity-70">{identity.profileDescription}</p>
                        <div className="h-1.5 bg-blue-100/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${identity.profileStrength || 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Ledger Quick View */}
                {creditUsage && (
                    <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Store Balance</p>
                            <p className={`text-sm font-black mt-0.5 ${creditUsage.currentBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ₹{Number(creditUsage.currentBalance).toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Available Credit</p>
                            <p className="text-sm font-black text-teal-600 mt-0.5">
                                ₹{(creditUsage.creditLimit - creditUsage.currentBalance).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Expandable Sections */}
            <div className="space-y-4">
                {/* Purchase Behavior */}
                <details className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm lg:open" open>
                    <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-bold text-sm text-gray-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FiTrendingUp className="text-teal-600" size={16} />
                            Purchase Behavior
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); onViewPurchaseBehavior(); }}
                            className="p-1 px-2.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-blue-100 transition-colors"
                        >
                            History Graph
                        </button>
                    </summary>
                    <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/10">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div>
                                <dt className="text-[10px] font-bold text-gray-400 uppercase">Lifetime Value</dt>
                                <dd className="text-lg font-black text-gray-900 tracking-tight mt-0.5">₹{Number(relationship.totalSpent || 0).toLocaleString('en-IN')}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold text-gray-400 uppercase">Avg Bill</dt>
                                <dd className="text-sm font-bold text-gray-700 mt-1">{relationship.avgBillRange || '—'}</dd>
                            </div>
                            <div className="col-span-2 p-4 bg-white rounded-3xl border border-gray-50 shadow-sm relative overflow-hidden group/card">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-full blur-2xl -mr-8 -mt-8" />
                                <dt className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 relative">
                                    <FiClock className="text-blue-500" /> Visit Consistency
                                </dt>
                                <dd className="text-sm font-black text-slate-800 mt-1 relative">
                                    {relationship.visitInterval
                                        ? `Avg. every ${relationship.visitInterval} days`
                                        : relationship.visitCount > 0 ? 'Occasional visitor' : 'Initial Visit Only'}
                                </dd>
                                <p className="text-[10px] font-bold text-teal-600 mt-1 relative">Frequency Stable</p>
                            </div>
                        </div>
                    </div>
                </details>

                {/* Credit Snapshot */}
                {creditUsage && creditUsage.creditEnabled && (
                    <details className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 font-bold text-sm text-gray-900 flex items-center gap-2">
                            <FiDollarSign className="text-blue-600" size={16} />
                            Credit Performance
                        </summary>
                        <div className="px-6 py-5 border-t border-gray-50 bg-gray-50/10">
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase">On-Time Pay</dt>
                                    <dd className="text-lg font-black text-gray-900 mt-0.5">
                                        {paymentBehavior?.onTimeRate ? `${Math.round(paymentBehavior.onTimeRate * 100)}%` : '100%'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] font-bold text-gray-400 uppercase text-amber-600">Late Payments</dt>
                                    <dd className={`text-lg font-black mt-0.5 ${paymentBehavior?.overdueCount ? 'text-red-600' : 'text-gray-900'}`}>
                                        {paymentBehavior?.overdueCount || 0}
                                    </dd>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Credit Utilization</span>
                                        <span className="text-xs font-black text-gray-900">
                                            {((creditUsage.currentBalance / creditUsage.creditLimit) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${(creditUsage.currentBalance / creditUsage.creditLimit) > 0.8
                                                ? 'bg-red-500'
                                                : (creditUsage.currentBalance / creditUsage.creditLimit) > 0.5
                                                    ? 'bg-amber-500'
                                                    : 'bg-teal-500'
                                                }`}
                                            style={{ width: `${Math.min((creditUsage.currentBalance / creditUsage.creditLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                )}
            </div>
        </div>
    );
}
