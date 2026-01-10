'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { behavioralApi } from '@/lib/api/behavioral';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, BarChart3 } from 'react-icons/fi';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import dayjs from 'dayjs';

interface EmployeePerformanceCardProps {
    employeeId?: string;
    days?: number;
}

export function EmployeePerformanceCard({ employeeId, days = 30 }: EmployeePerformanceCardProps) {
    const { data: summary, isLoading } = useQuery({
        queryKey: ['employee-behavioral-summary', employeeId, days],
        queryFn: () => behavioralApi.getEmployeeSummary(employeeId, days),
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Employee Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-20 bg-gray-200 rounded" />
                        <div className="h-32 bg-gray-200 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Employee Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            No behavioral data available. Data will appear after first sales.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
        if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
        if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    const getScoreBadgeVariant = (score: number): 'default' | 'destructive' | 'secondary' => {
        if (score >= 70) return 'destructive';
        if (score >= 50) return 'secondary';
        return 'default';
    };

    const getRateColor = (rate: number) => {
        if (rate >= 40) return 'text-red-600';
        if (rate >= 20) return 'text-orange-600';
        return 'text-green-600';
    };

    // Prepare chart data
    const chartData = summary.dailyMetrics
        .slice(-14) // Last 14 days
        .map(m => ({
            date: dayjs(m.date).format('MMM DD'),
            score: m.anomalyScore,
            manualRate: m.manualEntryRate
        }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Performance Score ({days} days)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Anomaly Score Gauge */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Anomaly Score</span>
                        <Badge variant={getScoreBadgeVariant(summary.averageAnomalyScore)} className="text-lg font-bold px-3 py-1">
                            {summary.averageAnomalyScore.toFixed(1)} / 100
                        </Badge>
                    </div>
                    <Progress
                        value={summary.averageAnomalyScore}
                        className="h-3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {summary.averageAnomalyScore < 30 && '✅ Low risk - Good performance'}
                        {summary.averageAnomalyScore >= 30 && summary.averageAnomalyScore < 50 && '⚠️ Moderate - Monitor closely'}
                        {summary.averageAnomalyScore >= 50 && summary.averageAnomalyScore < 70 && '⚠️ Elevated - Needs attention'}
                        {summary.averageAnomalyScore >= 70 && '🚨 High risk - Immediate action required'}
                    </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Manual Entry Rate</div>
                        <div className={`text-2xl font-bold ${getRateColor(summary.averageManualEntryRate)}`}>
                            {summary.averageManualEntryRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {summary.averageManualEntryRate < 20 ? '✓ Good' : '✗ High'}
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Total Sales</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {summary.totalSales.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {Math.round(summary.totalSales / summary.daysAnalyzed)}/day avg
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Voids</div>
                        <div className="text-2xl font-bold text-orange-600">
                            {summary.totalVoids}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {((summary.totalVoids / summary.totalSales) * 100).toFixed(1)}% rate
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 mb-1">Overrides</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {summary.totalOverrides}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {((summary.totalOverrides / summary.totalSales) * 100).toFixed(1)}% rate
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                {chartData.length > 0 && (
                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Anomaly Score Trend
                        </div>
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData}>
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10 }}
                                    stroke="#94a3b8"
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 10 }}
                                    stroke="#94a3b8"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: '#ef4444', r: 3 }}
                                    name="Anomaly Score"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Alert if high risk */}
                {summary.averageAnomalyScore >= 70 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>High-risk employee detected!</strong> Requires immediate management review and investigation.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
