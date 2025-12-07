'use client';

import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { patientsApi } from '@/lib/api/patients';
import { FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';

interface AdherenceData {
    month: string;
    rate: number;
}

interface AdherenceStats {
    averageRate: number;
    trend: 'up' | 'down' | 'stable';
    lastRefillGap: number;
}

interface AdherenceChartProps {
    patientId: string;
}

export default function AdherenceChart({ patientId }: AdherenceChartProps) {
    const [data, setData] = useState<AdherenceData[]>([]);
    const [stats, setStats] = useState<AdherenceStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAdherence();
    }, [patientId]);

    const loadAdherence = async () => {
        try {
            setLoading(true);
            const response = await patientsApi.getAdherence(patientId);

            // Transform backend data for chart
            // Assuming backend returns array of { date, rate }
            if (response.records) {
                const chartData = response.records.map((r: any) => ({
                    month: new Date(r.expectedRefillDate).toLocaleDateString(undefined, { month: 'short' }),
                    rate: Math.round(r.adherenceRate * 100)
                }));
                setData(chartData);
            }

            if (response.stats) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error("Failed to load adherence:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
            <span className="text-gray-400">Loading adherence history...</span>
        </div>;
    }

    if (data.length === 0) {
        return <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400">
            <FiActivity className="w-8 h-8 mb-2" />
            <p>No adherence data available yet</p>
        </div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FiActivity className="text-teal-600" />
                        Medication Adherence
                    </h3>
                    <p className="text-sm text-gray-500">Refill consistency over time</p>
                </div>
                {stats && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                            {Math.round(stats.averageRate * 100)}%
                        </div>
                        <div className={`text-xs font-medium flex items-center justify-end gap-1 ${stats.trend === 'up' ? 'text-green-600' :
                                stats.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                            {stats.trend === 'up' ? <FiTrendingUp /> : <FiTrendingDown />}
                            {stats.trend === 'up' ? 'Improving' : 'Declining'}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#9ca3af' }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="rate"
                            stroke="#0d9488"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRate)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
