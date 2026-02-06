"use client";

import React from 'react';
import { FiX, FiShield, FiTrendingUp, FiActivity, FiArrowUpRight, FiInfo } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface GrowthTrustOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    insights: any;
}

const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => (
    <div className="group relative inline-block">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl font-medium leading-normal">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
    </div>
);

export default function GrowthTrustOverlay({ isOpen, onClose, insights }: GrowthTrustOverlayProps) {
    if (!isOpen) return null;

    const { identity } = insights;

    const trustBreakdown = [
        { name: 'Punctuality', value: identity.trustFactors?.punctuality || 0, color: '#0d9488', info: 'Strength of on-time payment history' },
        { name: 'Longevity', value: identity.trustFactors?.longevity || 0, color: '#0f172a', info: 'Days since the first transaction' },
        { name: 'Recency', value: identity.trustFactors?.recency || 0, color: '#3b82f6', info: 'Activity in the last 30 days' },
        { name: 'Volume', value: identity.trustFactors?.volume || 0, color: '#8b5cf6', info: 'Total number of store visits' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 top-0 bottom-0 z-40 bg-white/95 backdrop-blur-md rounded-3xl border border-teal-100/50 shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-teal-50/30">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-200">
                        <FiShield size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Growth & Trust Engine</h2>
                        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mt-0.5">Automated Risk & Loyalty Assessment</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                >
                    <FiX size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Score Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/30 rounded-full blur-3xl -mr-16 -mt-16" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Aggregate Trust Score</h3>
                                    <Tooltip content="A CIBIL-style score (300-900) derived from payment punctuality, relationship age, and visit frequency.">
                                        <FiInfo className="text-gray-400 cursor-help" size={14} />
                                    </Tooltip>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black text-gray-900 tracking-tighter">{identity.systemTrustScore}</span>
                                    <span className="text-xl font-bold text-gray-400">/ 900</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${identity.systemTrustScore > 750 ? 'bg-green-100 text-green-700' :
                                            identity.systemTrustScore > 550 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {identity.systemTrust} Status
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Positive Factors</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {trustBreakdown.filter(f => f.value > 40).map((factor, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                <FiArrowUpRight size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{factor.name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">{factor.info}</p>
                                            </div>
                                        </div>
                                        <span className="text-teal-600 font-black">+{factor.value} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-3xl p-8 flex flex-col shadow-sm">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Weight Distribution</h3>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={trustBreakdown}
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationBegin={200}
                                        animationDuration={1500}
                                    >
                                        {trustBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {trustBreakdown.map((factor, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: factor.color }} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{factor.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profile Tier Detail */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <FiActivity size={20} />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">{identity.profileTier}</h3>
                            </div>
                            <p className="text-slate-400 text-sm max-w-md">
                                Based on current performance, this patient is classified as a <strong className="text-white">"{identity.profileTier}"</strong>.
                                {identity.systemTrustScore > 750 ? " This profile is eligible for maximum store benefits and premium credit limits." : " Further verification and consistency will elevate this profile to the next tier."}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Profile Strength</p>
                            <div className="text-4xl font-black">{identity.profileStrength}%</div>
                            <div className="mt-2 w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-auto">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${identity.profileStrength}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
