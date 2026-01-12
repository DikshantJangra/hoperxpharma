'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { FaFlask, FaExclamationTriangle, FaCheckDouble } from 'react-icons/fa';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function SaltIntelligenceWidget() {
    const router = useRouter();
    const [stats, setStats] = useState({ pending: 0, active: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // We rely on the /drugs endpoint filtering we added
                // Fetch pending count
                const pendingRes = await apiClient.get('/drugs', { params: { ingestionStatus: 'SALT_PENDING', limit: 1 } });
                // Fetch active count (optional, just for show)
                // const activeRes = await apiClient.get('/drugs', { params: { ingestionStatus: 'ACTIVE', limit: 1 } });

                // If API returns paginated response with 'total' or 'totalDocs'
                const pendingTotal = pendingRes.data.data?.total || pendingRes.data.total || 0;

                setStats({ pending: pendingTotal, active: 0 });
            } catch (error) {
                console.error("Failed to fetch salt stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <Card className="p-5 flex flex-col justify-between h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <FaFlask className="text-blue-500" />
                        <h3>Salt Intelligence</h3>
                    </div>
                    {stats.pending > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            Action Needed
                        </Badge>
                    )}
                </div>

                <div className="mt-4 space-y-1">
                    <p className="text-3xl font-bold text-slate-900">
                        {loading ? '...' : stats.pending}
                    </p>
                    <p className="text-sm text-slate-500">
                        Unmapped Medicines
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-2">
                <Button
                    variant="default"
                    className="w-full bg-blue-600 hover:bg-blue-700 justify-between"
                    onClick={() => router.push('/inventory/maintenance')}
                    disabled={loading || stats.pending === 0}
                >
                    <span className="flex items-center"><FaExclamationTriangle className="mr-2" /> Fix Pending</span>
                    <span className="bg-blue-800 text-xs px-2 py-0.5 rounded-full">{stats.pending}</span>
                </Button>
                <Button
                    variant="outline"
                    className="w-full justify-start text-slate-600"
                    onClick={() => router.push('/inventory/ingest')}
                >
                    <FaCheckDouble className="mr-2" /> Ingest New
                </Button>
            </div>
        </Card>
    );
}
