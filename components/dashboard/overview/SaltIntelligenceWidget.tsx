'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { FaFlask, FaExclamationTriangle, FaCheckDouble } from 'react-icons/fa';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth-store';

export default function SaltIntelligenceWidget() {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const [stats, setStats] = useState({ 
        pending: 0, 
        active: 0,
        noCompositionCount: 0,
        recentlyAdded: 0 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setError(null);
                console.log('[SaltIntelligenceWidget] Starting fetch...');
                console.log('[SaltIntelligenceWidget] primaryStore:', primaryStore);
                
                const storeId = primaryStore?.id;

                if (!storeId) {
                    console.log('[SaltIntelligenceWidget] No storeId found in primaryStore');
                    setLoading(false);
                    return;
                }

                console.log('[SaltIntelligenceWidget] Fetching stats for storeId:', storeId);
                
                // Call the salt-intelligence stats endpoint
                // apiClient.get returns data directly, not { data: ... }
                const data = await apiClient.get(`/salt-intelligence/stats?storeId=${storeId}`);
                
                console.log('[SaltIntelligenceWidget] API Response data:', JSON.stringify(data, null, 2));
                
                if (data) {
                    const newStats = {
                        pending: data.pendingCount || 0,
                        active: data.activeCount || 0,
                        noCompositionCount: data.noCompositionCount || 0,
                        recentlyAdded: data.recentlyAdded || 0
                    };
                    console.log('[SaltIntelligenceWidget] Setting stats:', newStats);
                    setStats(newStats);
                } else {
                    console.log('[SaltIntelligenceWidget] No data in response');
                }
            } catch (error: any) {
                console.error("[SaltIntelligenceWidget] Failed to fetch salt stats:", error);
                console.error("[SaltIntelligenceWidget] Error details:", error.response?.data || error.message);
                setError('Failed to load stats');
            } finally {
                setLoading(false);
            }
        };
        
        if (primaryStore?.id) {
            fetchStats();
        }
        
        // Auto-refresh every 5 minutes
        const interval = setInterval(() => {
            if (primaryStore?.id) {
                fetchStats();
            }
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [primaryStore?.id]);

    return (
        <Card className="p-5 flex flex-col justify-between h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <FaFlask className="text-blue-500" />
                        <h3>Salt Intelligence</h3>
                    </div>
                    {stats.noCompositionCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {stats.noCompositionCount} Pending
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="mt-4 space-y-2">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    </div>
                ) : error ? (
                    <div className="mt-4">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="mt-4 space-y-1">
                            <p className="text-3xl font-bold text-slate-900">
                                {stats.noCompositionCount}
                            </p>
                            <p className="text-sm text-slate-500">
                                Medicines Without Composition
                            </p>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-200">
                            <div className="text-center">
                                <p className="text-xs text-slate-500">No Salt</p>
                                <p className="text-lg font-semibold text-orange-600">{stats.noCompositionCount}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500">Mapped</p>
                                <p className="text-lg font-semibold text-green-600">{stats.active}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500">Recent</p>
                                <p className="text-lg font-semibold text-blue-600">{stats.recentlyAdded}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-6 space-y-2">
                {stats.noCompositionCount > 0 ? (
                    <Button
                        variant="default"
                        className="w-full bg-blue-600 hover:bg-blue-700 justify-between"
                        onClick={() => router.push('/inventory/maintenance')}
                        disabled={loading}
                    >
                        <span className="flex items-center">
                            <FaExclamationTriangle className="mr-2" /> 
                            Fix Pending
                        </span>
                        <span className="bg-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {stats.noCompositionCount}
                        </span>
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full justify-center text-green-600 border-green-600 hover:bg-green-50"
                        disabled
                    >
                        <FaCheckDouble className="mr-2" /> 
                        All Medicines Mapped
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="w-full justify-start text-slate-600 hover:bg-slate-50"
                    onClick={() => router.push('/inventory/maintenance')}
                >
                    <FaFlask className="mr-2" /> 
                    Manage Compositions
                </Button>
            </div>
        </Card>
    );
}
