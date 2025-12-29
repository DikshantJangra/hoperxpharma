'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { loyaltyAPI, type LoyaltyProfile, type EngagementOverview } from '@/lib/api/loyalty';
import { FiUsers, FiTrendingUp, FiAlertTriangle, FiAward, FiSearch, FiArrowRight, FiInfo, FiActivity, FiZap } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';

const STATUS_CONFIG = {
    NEW: { label: 'New Member', color: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-200' },
    REGULAR: { label: 'Regular', color: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-200' },
    TRUSTED: { label: 'Trusted', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-200' },
    INSIDER: { label: 'Insider', color: 'bg-violet-50 text-violet-700 border-violet-200 ring-violet-200' },
    ADVOCATE: { label: 'Advocate', color: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-200' },
};

export default function LoyaltyOverviewPage() {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState<EngagementOverview | null>(null);
    const [customers, setCustomers] = useState<LoyaltyProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!primaryStore?.id) {
            setError('No store selected. Please log in again.');
            setLoading(false);
            return;
        }

        fetchData(primaryStore.id);
    }, [primaryStore]);

    const fetchData = async (storeId: string) => {
        try {
            setLoading(true);
            setError(null);

            const [overviewResponse, customersResponse] = await Promise.all([
                loyaltyAPI.getOverview(storeId),
                loyaltyAPI.getCustomers(storeId, { limit: 50 }),
            ]);

            setOverview(overviewResponse?.overview || null);
            setCustomers(customersResponse?.customers || []);
        } catch (error: any) {
            console.error('Failed to fetch loyalty data:', error);
            setError(error.message || 'Failed to load loyalty data');
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = (customers || []).filter((customer) => {
        const fullName = `${customer.patient?.firstName || ''} ${customer.patient?.lastName || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC]">
                <div className="container mx-auto py-8 px-4 space-y-8">
                    {/* Header Skeleton */}
                    <div className="space-y-4">
                        <div className="h-10 w-64 bg-slate-200 rounded-lg animate-pulse" />
                        <div className="h-6 w-96 bg-slate-200 rounded-lg animate-pulse" />
                    </div>

                    {/* Metrics Skeleton */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse" />
                        ))}
                    </div>

                    {/* List Skeleton */}
                    <div className="h-96 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
                <Card className="max-w-md border-rose-100 shadow-xl shadow-rose-50">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiAlertTriangle className="h-6 w-6 text-rose-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
                            <p className="text-slate-500 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hasCustomers = customers.length > 0;
    const repeatRate = overview?.stats.total
        ? Math.round(((overview.stats.total - (overview.stats.statusDistribution.find((s: any) => s.status === 'NEW')?._count || 0)) / overview.stats.total) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Loop Loyalty</h1>
                        <p className="text-slate-500 mt-2 text-lg">Customer retention & rewards engine</p>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                    {/* Active Customers */}
                    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Members</span>
                                <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                    <FiUsers className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{overview?.stats.total || 0}</h3>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                                    <FiActivity className="mr-1 h-3 w-3" /> Active
                                </span>
                                <span>loyalty profiles</span>
                            </div>
                        </div>
                    </div>

                    {/* Retention Rate */}
                    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-emerald-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Retention Rate</span>
                                <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                                    <FiTrendingUp className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{repeatRate}%</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-slate-600">
                                <span>Returning customer base</span>
                            </div>
                        </div>
                    </div>

                    {/* At Risk */}
                    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-rose-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">At Risk</span>
                                <div className="h-8 w-8 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600">
                                    <FiAlertTriangle className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{overview?.stats.atRisk || 0}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-slate-600">
                                <span>Inactive {'>'} 30 days</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Growth */}
                    <div className="relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-300 group">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-violet-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Growth</span>
                                <div className="h-8 w-8 bg-violet-50 rounded-lg flex items-center justify-center text-violet-600">
                                    <FiZap className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">+{overview?.metrics.newProfiles || 0}</h3>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-slate-600">
                                <span>New members this month</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Levers / Insights */}
                {overview && overview.nearMilestone && overview.nearMilestone.length > 0 && (
                    <div className="mb-10 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <FiAward className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Opportunity Alert</h3>
                                <p className="text-indigo-100 mt-1">
                                    {overview.nearMilestone.length} customers are close to leveling up! Engage them now to boost loyalty.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-slate-900">Member Directory</h2>
                        <div className="relative w-full md:w-96">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 transition-all font-medium"
                            />
                        </div>
                    </div>

                    {!hasCustomers ? (
                        <div className="p-16 text-center">
                            <div className="mx-auto h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <FiUsers className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No members yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                Start making sales to automatically enroll customers into the loyalty program. Profiles will appear here instantly.
                            </p>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="p-16 text-center">
                            <p className="text-slate-500">No members matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => router.push(`/engage/loyalty/${customer.patientId}`)}
                                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group flex items-center gap-4"
                                >
                                    {/* Avatar */}
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:scale-105 transition-transform duration-300">
                                        {customer.patient?.firstName?.[0]}
                                        {customer.patient?.lastName?.[0]}
                                    </div>

                                    {/* Name & Phone */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                                            {customer.patient?.firstName} {customer.patient?.lastName}
                                        </h4>
                                        <p className="text-sm text-slate-500 truncate">{customer.patient?.phoneNumber}</p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="hidden sm:block">
                                        <Badge className={cn('px-3 py-1 font-medium border shadow-sm', STATUS_CONFIG[customer.status as keyof typeof STATUS_CONFIG]?.color)}>
                                            {STATUS_CONFIG[customer.status as keyof typeof STATUS_CONFIG]?.label || customer.status}
                                        </Badge>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:block text-right min-w-[120px]">
                                        <div className="text-sm font-bold text-slate-900">{customer.totalPoints} pts</div>
                                        <div className="text-xs text-slate-500">{customer.purchaseCount} purchases</div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="pl-4">
                                        <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                                            <FiArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
