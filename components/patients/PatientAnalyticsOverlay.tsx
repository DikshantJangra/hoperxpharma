"use client";

import React from 'react';
import { FiX, FiTrendingUp, FiShield, FiDollarSign, FiClock, FiActivity } from 'react-icons/fi';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

interface PatientAnalyticsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    patient: any;
    insights: any;
}

export default function PatientAnalyticsOverlay({ isOpen, onClose, patient, insights }: PatientAnalyticsOverlayProps) {
    if (!isOpen) return null;

    const { identity, relationship, paymentBehavior, creditUsage } = insights;

    // Prepare Sales Trend Data for Last 6 Months
    const salesTrendData = (patient.sales || [])
        .slice(0, 10)
        .reverse()
        .map((s: any) => ({
            date: new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            amount: Number(s.total)
        }));

    // Trust Score Gauge Data (Mock mapping for visualization)
    const trustBreakdown = [
        { name: 'Punctuality', value: identity.trustFactors?.punctuality || 0, color: '#0d9488' },
        { name: 'Longevity', value: identity.trustFactors?.longevity || 0, color: '#0f172a' },
        { name: 'Stability', value: (identity.trustFactors?.recency || 0) + (identity.trustFactors?.volume || 0), color: '#3b82f6' },
        { name: 'Opportunity', value: 900 - identity.systemTrustScore, color: '#e2e8f0' }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <FiActivity className="text-teal-600" />
                            Deep Analytics Hub
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            Predictive Behavioral Data for {patient.firstName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <FiX size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                    {/* Trust Score Algorithm Visualization */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                <FiShield className="text-teal-600" />
                                Trust Algorithm Breakdown
                            </h3>
                            <div className="text-right">
                                <span className="text-3xl font-black text-gray-900">{identity.systemTrustScore}</span>
                                <span className="text-gray-400 font-bold ml-1">/ 900</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 rounded-3xl p-8 border border-gray-100">
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={trustBreakdown}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {trustBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-4">
                                {trustBreakdown.filter(t => t.name !== 'Opportunity').map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-sm font-bold text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900">+{item.value}</span>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-gray-200 mt-4">
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                                        * Score calculated based on 300 base points + behavior weights. Exceptional scores ({" > "}800) qualify for priority credit processing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Purchase Behavior Trends */}
                    <section>
                        <div className="mb-6">
                            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                                <FiTrendingUp className="text-blue-600" />
                                Longitudinal Spend Trends
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Performance across recent transactions</p>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrendData}>
                                        <defs>
                                            <linearGradient id="overlayTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#overlayTrend)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    {/* Financial Summary */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-900 rounded-3xl text-white">
                            <FiDollarSign className="text-teal-400 mb-4" size={24} />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Value</p>
                            <p className="text-2xl font-black mt-1">₹{Number(relationship.totalSpent || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-6 bg-blue-600 rounded-3xl text-white">
                            <FiClock className="text-white/70 mb-4" size={24} />
                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Store Loyalty</p>
                            <p className="text-2xl font-black mt-1">{relationship.visitCount} Visits</p>
                        </div>
                    </section>
                </div>

                {/* Footer Action */}
                <div className="px-8 py-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full h-12 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98]"
                    >
                        Close Insights
                    </button>
                </div>
            </div>
        </div>
    );
}
