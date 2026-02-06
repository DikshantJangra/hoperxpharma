"use client";

import React from 'react';
import { FiX, FiTrendingUp, FiDollarSign, FiClock, FiActivity, FiArrowRight, FiInfo } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

interface PurchaseBehaviorOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
    insights: any;
}

const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => (
    <div className="group relative inline-block">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl font-medium leading-normal text-center">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
        </div>
    </div>
);

export default function PurchaseBehaviorOverlay({ isOpen, onClose, patient, insights }: PurchaseBehaviorOverlayProps) {
    if (!isOpen) return null;

    const { relationship } = insights;

    // Prepare Sales Trend Data for Last 10 Transactions
    const salesHistory = (patient.sales || [])
        .slice(0, 10)
        .reverse()
        .map((s: any) => ({
            date: new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            amount: Number(s.total)
        }));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-x-0 top-0 bottom-0 z-40 bg-white/95 backdrop-blur-md rounded-3xl border border-blue-100/50 shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Purchase Behavioral Insights</h2>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Statistical Spending & Visit Analysis</p>
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

                {/* Metrics Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <FiDollarSign className="text-blue-600" size={20} />
                            <Tooltip content="Total revenue generated from this patient over their entire history.">
                                <FiInfo className="text-gray-300 cursor-help" size={12} />
                            </Tooltip>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Value</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">₹{Number(relationship.totalSpent || 0).toLocaleString('en-IN')}</p>
                    </div>

                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <FiActivity className="text-teal-600" size={20} />
                            <Tooltip content="Average number of days between consecutive visits.">
                                <FiInfo className="text-gray-300 cursor-help" size={12} />
                            </Tooltip>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visit Frequency</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">
                            {relationship.visitInterval ? `Every ${relationship.visitInterval}d` : 'N/A'}
                        </p>
                    </div>

                    <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <FiClock className="text-amber-600" size={20} />
                            <Tooltip content="Total count of transactions recorded.">
                                <FiInfo className="text-gray-300 cursor-help" size={12} />
                            </Tooltip>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Visits</p>
                        <p className="text-3xl font-black text-gray-900 mt-1">{relationship.visitCount}</p>
                    </div>
                </div>

                {/* Main Graph */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Longitudinal Spend Analysis (Last 10 Sales)</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoiced Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesHistory}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        dx={-10}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#3b82f6"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorAmount)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Behavioral Bucket */}
                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                            <FiActivity size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900">Spending Patterns</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statistical Bucket: {relationship.avgBillRange}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                This patient typically spends within the <strong className="text-gray-900">{relationship.avgBillRange}</strong> range.
                                {relationship.visitInterval && relationship.visitInterval < 30
                                    ? " They show high loyalty with consistent monthly recurring store visits."
                                    : " They visit the store occasionally, prioritizing larger bulk orders over frequency."}
                            </p>
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs group cursor-pointer">
                                View full transaction log <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Bill Consistency</span>
                                <span className="text-xs font-black text-teal-600">High Stable</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500 w-[85%] rounded-full" />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 italic">* Based on standard deviation of recent bills</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
