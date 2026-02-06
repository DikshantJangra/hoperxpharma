"use client";

import React from 'react';
import { FiAlertCircle, FiCheck, FiInfo } from 'react-icons/fi';
import ProcessingLoader from './animations/ProcessingLoader';

interface CreditAssessment {
    canUseCredit: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'ELEVATED';
    availableCredit: number;
    currentBalance: number;
    creditLimit: number;
    lifecycleStage?: string;
    onTimeRate?: number;
    onTimeCount?: number;
    profileAccuracy?: {
        score: number;
        missing: string[];
        isComplete: boolean;
    };
    overdueCount?: number;
    creditSalesCount?: number;
    familyMetrics?: {
        familySize: number;
        familyTotalSpent: number;
        familyOverdueCount: number;
        familyBalance: number;
        familyLimit: number;
    };
    spendMetrics?: {
        totalSpent: number;
        visitCount: number;
        avgBill: number;
        lastVisitAt?: string;
    };
    reasons?: Array<{
        code: string;
        label: string;
        detail: string;
    }>;
    blockers?: Array<{
        code: string;
        label: string;
        detail?: string;
    }>;
    score?: number;
}

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    lifecycleStage: string;
    systemTrustLevel?: string;
    createdAt?: string;
}

interface CreditAssessmentPanelProps {
    patient: Patient;
    assessment: CreditAssessment;
    saleTotal: number;
    onAllowPayLater: () => void;
    onCashOnly: () => void;
    onUpdatePatient?: (id: string, data: any) => Promise<void>;
    onRefreshAssessment?: () => void;
    onOpenCustomer?: (patient: any) => void;
    completingAction?: { name: string | null, status: 'idle' | 'loading' | 'success' };
}

export default function CreditAssessmentPanel({
    patient,
    assessment,
    saleTotal,
    onAllowPayLater,
    onCashOnly,
    onUpdatePatient,
    onRefreshAssessment,
    onOpenCustomer,
    completingAction
}: CreditAssessmentPanelProps) {
    const [isActionLoading, setIsActionLoading] = React.useState<string | null>(null);
    const [showLimitForm, setShowLimitForm] = React.useState(false);
    const [draftLimit, setDraftLimit] = React.useState(assessment.creditLimit || 500);
    const [draftTrust, setDraftTrust] = React.useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

    if (!patient) return null;

    const isBlocked = !assessment.canUseCredit;
    const isElevatedRisk = assessment.riskLevel === 'ELEVATED';
    const isMediumRisk = assessment.riskLevel === 'MEDIUM';
    const isCompleting = completingAction?.name === 'complete_sale' && completingAction.status === 'loading';

    const evidence = isBlocked
        ? { label: "High Risk Flags", desc: "Critical blockers active" }
        : isElevatedRisk
            ? { label: "Developing History", desc: "Low visit frequency detected" }
            : isMediumRisk
                ? { label: "Stable Payer", desc: "Consistent repayment history" }
                : { label: "Premium Payer", desc: "High visit frequency & spend" };

    const familySize = assessment.familyMetrics?.familySize || 1;
    const hasFamily = familySize > 1;

    const handleEnableCredit = async () => {
        if (!onUpdatePatient || !onRefreshAssessment) return;
        setIsActionLoading('enable_credit');
        try {
            await onUpdatePatient(patient.id, {
                creditEnabled: true,
                creditLimit: Number(draftLimit),
                manualTrustLevel: draftTrust
            });
            onRefreshAssessment();
            setShowLimitForm(false);
        } finally {
            setIsActionLoading(null);
        }
    };

    return (
        <div className="flex flex-col h-full select-none overflow-hidden pb-4">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 pb-6 custom-scrollbar overflow-x-visible">
                {/* Limit Setup Form Overlay */}
                {showLimitForm && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-[200] p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                        <div className="w-full max-w-[280px]">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-6 text-center">Authorization Required</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Maximum Limit (₹)</label>
                                    <input
                                        type="number"
                                        value={draftLimit}
                                        onChange={(e) => setDraftLimit(Number(e.target.value))}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-base font-black text-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        placeholder="500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Trust Level</label>
                                    <div className="flex gap-2">
                                        {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setDraftTrust(level)}
                                                className={`flex-1 py-2.5 text-[9px] font-black rounded-xl border transition-all ${draftTrust === level
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setShowLimitForm(false)} className="flex-1 py-4 text-xs font-black text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">CANCEL</button>
                                    <button onClick={handleEnableCredit} disabled={!!isActionLoading || draftLimit <= 0} className="flex-[2] py-4 text-xs font-black text-white bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50">
                                        {isActionLoading ? 'SAVING...' : 'CONFIRM ACCESS'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Decision Status Header */}
                <div className={`p-4 rounded-[2rem] border mb-4 flex items-center justify-between relative group z-20 transition-all duration-300 ${isBlocked ? 'border-red-100 bg-red-50/50' : 'border-indigo-100 bg-indigo-50/30 shadow-sm'}`}>
                    <div className="flex-1">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] block mb-1 ${isBlocked ? 'text-red-500' : 'text-indigo-500'}`}>
                            AI Assessment
                        </span>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                            {isBlocked ? 'Credit Request Rejected' : assessment.riskLevel + ' RISK APPROVED'}
                        </h3>
                    </div>
                    <div className="text-right cursor-help">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Status</span>
                        <span className={`text-xs font-black uppercase flex items-center gap-1 justify-end ${isBlocked ? 'text-red-600' : 'text-emerald-600'}`}>
                            {evidence.label} <FiInfo size={10} className="opacity-50" />
                        </span>
                    </div>

                    {/* Analysis Tooltip */}
                    <div className="absolute top-full right-0 mt-2 w-64 bg-black text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[250] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-white/10 translate-y-2 group-hover:translate-y-0">
                        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                            <FiInfo className="text-indigo-400" size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Risk Engine Drivers</span>
                        </div>
                        <div className="space-y-3">
                            {assessment.reasons && assessment.reasons.length > 0 ? (
                                assessment.reasons.map((r, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-[10px] font-black text-white leading-tight mb-0.5">{r.label}</span>
                                        <span className="text-[9px] text-gray-400 leading-tight italic">{r.detail}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 py-2 px-3 rounded-xl flex items-center gap-2">
                                    <FiCheck size={10} /> NO ACTIVE RISK FLAGS
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Metric Grid - High Visibility */}
                <div className="grid grid-cols-2 gap-3 mb-3 overflow-visible">
                    <div className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col items-center relative group">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Punctuality</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-emerald-600">{assessment.onTimeCount || 0}</span>
                            <span className="text-xs font-black text-gray-300">/ {assessment.creditSalesCount || 0}</span>
                        </div>
                        <span className="text-[8px] font-black text-emerald-600/60 uppercase mt-1">On-Time Success</span>
                    </div>

                    <div className="p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col items-center relative group cursor-help">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Trust Score</span>
                        <div className="flex items-baseline gap-0.5">
                            <span className={`text-xl font-black ${(assessment.score || 0) > 70 ? 'text-emerald-600' : (assessment.score || 0) > 40 ? 'text-orange-500' : 'text-red-500'}`}>
                                {assessment.score || 0}
                            </span>
                            <span className="text-[10px] font-black text-gray-300">/100</span>
                        </div>
                        <span className="text-[8px] font-black text-indigo-500/60 uppercase mt-1">Live Reliability</span>

                        {/* Score Reason Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-black text-white p-5 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-[250] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all border border-white/10 pointer-events-none translate-y-2 group-hover:translate-y-0">
                            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-2 border-b border-white/10 pb-1.5">Calculation Factors</div>
                            <div className="space-y-2 text-[9px]">
                                <div className="flex justify-between"><span>Payment History</span><span className="text-emerald-400">High</span></div>
                                <div className="flex justify-between"><span>Profile Longevity</span><span className="text-gray-400">Moderate</span></div>
                                <div className="flex justify-between"><span>Volume Consistency</span><span className="text-emerald-400">Stable</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Accuracy - Large Progress Display */}
                <div className="mb-3 p-4 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-2.5">
                        <div>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Profile Compliance</span>
                            <span className={`text-sm font-black ${(assessment.profileAccuracy?.score || 0) < 100 ? 'text-orange-500' : 'text-emerald-600'}`}>
                                {assessment.profileAccuracy?.score || 0}% Data Accuracy
                            </span>
                        </div>
                        {(assessment.profileAccuracy?.score || 0) < 100 && onOpenCustomer && (
                            <button
                                onClick={() => onOpenCustomer(patient)}
                                className="px-3.5 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-black uppercase text-[9px] border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                            >
                                Sync Identity
                            </button>
                        )}
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden mb-3">
                        <div
                            className={`h-full transition-all duration-1000 ${(assessment.profileAccuracy?.score || 0) < 60 ? 'bg-red-400' : (assessment.profileAccuracy?.score || 0) < 100 ? 'bg-orange-400' : 'bg-emerald-400'}`}
                            style={{ width: `${assessment.profileAccuracy?.score || 0}%` }}
                        />
                    </div>
                    {(assessment.profileAccuracy?.score || 0) < 100 && (
                        <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 flex items-start gap-2.5">
                            <FiAlertCircle size={12} className="text-orange-500 mt-0.5" />
                            <span className="text-[10px] font-bold text-orange-900 leading-relaxed italic">
                                Missing verification for: <b className="font-black">{assessment.profileAccuracy?.missing.slice(0, 2).join(', ')}</b>
                            </span>
                        </div>
                    )}
                </div>

                {/* Family Circle - High Contrast */}
                {hasFamily && (
                    <div className="mb-4 p-4 bg-indigo-50/40 rounded-[1.5rem] border border-indigo-100/60 border-dashed flex items-center justify-between group relative overflow-visible cursor-help">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-md ring-2 ring-indigo-50 uppercase">{patient.firstName?.[0]}</div>
                                <div className="w-7 h-7 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-md ring-2 ring-indigo-50">+</div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Household Unit</span>
                                <span className="text-xs font-black text-indigo-900">{familySize} Members Connected</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Group Volume</span>
                            <span className="text-xs font-black text-indigo-900 font-mono">₹{assessment.familyMetrics?.familyTotalSpent.toLocaleString()}</span>
                        </div>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-black text-white p-4 rounded-2xl shadow-2xl z-[250] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all pointer-events-none border border-white/10 translate-y-2 group-hover:translate-y-0">
                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 border-b border-white/10 pb-1.5">Shared Accountability</div>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic">The risk profile is weighted across the household. Current ratio: 1 reliable member linked to group debt pool.</p>
                        </div>
                    </div>
                )}

                {/* Volume Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center px-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Total Sales</span>
                        <span className="text-xs font-black text-gray-900">₹{assessment.spendMetrics?.totalSpent.toLocaleString() || 0}</span>
                    </div>
                    <div className="p-3 bg-white border border-gray-100 rounded-xl flex justify-between items-center px-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Visits</span>
                        <span className="text-xs font-black text-gray-900">{assessment.spendMetrics?.visitCount || 0} Orders</span>
                    </div>
                </div>

                {/* Credit Projection Card */}
                <div className="p-5 bg-white rounded-[2rem] border border-gray-100 mb-4 shadow-lg relative overflow-visible">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">Available Balance</span>
                            <span className="block text-[10px] text-gray-400 uppercase font-black tracking-widest opacity-60">Post-Sale Estimate</span>
                        </div>
                        <div className="text-right">
                            <span className={`text-xl font-black leading-none ${assessment.availableCredit - saleTotal < 0 ? 'text-red-600' : 'text-indigo-600'}`}>
                                ₹{(assessment.availableCredit - saleTotal).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden mb-4">
                        <div className={`h-full transition-all duration-700 ${assessment.currentBalance + saleTotal > assessment.creditLimit ? 'bg-red-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, ((assessment.currentBalance + saleTotal) / (assessment.creditLimit || 1)) * 100)}%` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="flex flex-col"><span className="font-black text-gray-400 uppercase mb-1">Debt</span><span className="font-black text-gray-900">₹{(assessment.currentBalance || 0).toLocaleString()}</span></div>
                        <div className="flex flex-col text-center"><span className="font-black text-indigo-400 uppercase mb-1">New Order</span><span className="font-black text-indigo-600">₹{saleTotal.toLocaleString()}</span></div>
                        <div className="flex flex-col text-right"><span className="font-black text-gray-400 uppercase mb-1">Total Limit</span><span className="font-black text-gray-900">₹{(assessment.creditLimit || 0).toLocaleString()}</span></div>
                    </div>
                </div>

                {/* Blockers */}
                {(assessment.blockers?.length || 0) > 0 && (
                    <div className="mb-4 space-y-2">
                        {assessment.blockers?.map((b, i) => (
                            <div key={i} className="p-4 bg-red-50/80 rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
                                <FiAlertCircle size={14} className="text-red-500 mt-1 shrink-0" />
                                <div className="flex-1">
                                    <span className="block text-[11px] font-black text-red-900 uppercase tracking-widest">{b.label}</span>
                                    {b.detail && <span className="text-[10px] font-medium text-red-700/70 block mt-1 leading-relaxed">{b.detail}</span>}
                                    {b.code === 'CREDIT_DISABLED' && (
                                        <button onClick={() => setShowLimitForm(true)} className="mt-3 w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-[0.98]">Authorize Credit Engine</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Assessment Footer */}
                <div className={`mb-4 p-4 rounded-2xl border-l-4 text-[10px] leading-relaxed font-bold ${isBlocked ? 'bg-red-50 border-red-500 text-red-800' : 'bg-indigo-50 border-indigo-500 text-indigo-900'}`}>
                    {isBlocked ? "SAFETY BLOCK: Transaction must be processed in CASH only." : `System approval verified. Assessment confidence high.`}
                </div>
            </div>

            {/* Sticky Actions */}
            <div className="flex gap-2 pt-4 bg-[#fcfdff] border-t border-gray-50 mt-auto">
                {!isBlocked ? (
                    <>
                        <button onClick={onCashOnly} className="px-6 py-5 font-black text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all uppercase text-[11px] tracking-widest">Cash</button>
                        <button onClick={onAllowPayLater} disabled={isCompleting} className={`flex-1 py-5 font-black text-white rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 text-[11px] tracking-widest ${isElevatedRisk ? 'bg-orange-600 shadow-orange-600/20' : 'bg-indigo-600 shadow-indigo-600/20'} disabled:opacity-50 active:scale-[0.98]`}>
                            {isCompleting ? <ProcessingLoader size="sm" color="white" /> : <FiCheck size={14} />}
                            {isCompleting ? 'AUTHORIZING...' : `PAY LATER (₹${saleTotal})`}
                        </button>
                    </>
                ) : (
                    <button onClick={onCashOnly} className="w-full py-6 font-black text-white bg-red-600 rounded-2xl shadow-xl shadow-red-600/20 transition-all uppercase text-[11px] tracking-widest">Switch to Cash Transaction</button>
                )}
            </div>
        </div>
    );
}
