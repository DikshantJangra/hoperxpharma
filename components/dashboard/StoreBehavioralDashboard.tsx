'use client';

import { useQuery } from '@tanstack/react-query';
import { behavioralApi } from '@/lib/api/behavioral';
import { fefoApi } from '@/lib/api/fefo';
import { FiAlertTriangle, FiUsers, FiTrendingUp, FiShield, FiPackage } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Simple Card component (since shadcn not installed)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`p-6 ${className}`}>{children}</div>
);
const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);
const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`px-6 pb-6 ${className}`}>{children}</div>
);
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
    const variantClasses = variant === 'destructive' ? 'bg-red-100 text-red-700' : variant === 'secondary' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700';
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses} ${className}`}>{children}</span>;
};
const Alert = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
    const variantClasses = variant === 'destructive' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
    return <div className={`flex items-start gap-3 p-4 rounded-lg border ${variantClasses} ${className}`}>{children}</div>;
};
const AlertDescription = ({ children }: { children: React.ReactNode }) => (
    <div className="text-sm">{children}</div>
);

export function StoreBehavioralDashboard() {
    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['store-behavioral-insights'],
        queryFn: () => behavioralApi.getStoreInsights(7),
        refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    });

    const { data: fefoStats, isLoading: fefoLoading } = useQuery({
        queryKey: ['fefo-adherence-stats'],
        queryFn: () => fefoApi.getAdherenceStats(),
        refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    });

    const { data: violators } = useQuery({
        queryKey: ['fefo-top-violators'],
        queryFn: () => fefoApi.getTopViolators(30, 5),
    });

    if (insightsLoading || fefoLoading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-32 bg-gray-200 rounded" />
                            <div className="h-48 bg-gray-200 rounded" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!insights) {
        return (
            <Alert>
                <AlertDescription>No behavioral data available yet.</AlertDescription>
            </Alert>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return '#ef4444';
        if (score >= 50) return '#f97316';
        if (score >= 30) return '#eab308';
        return '#22c55e';
    };

    // Risk distribution data
    const riskDistribution = [
        { name: 'Low Risk (0-30)', value: insights.totalEmployeesTracked - insights.highRiskEmployees, color: '#22c55e' },
        { name: 'High Risk (70+)', value: insights.highRiskEmployees, color: '#ef4444' }
    ];

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FiUsers className="h-4 w-4" />
                            Employees Tracked
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{insights.totalEmployeesTracked}</div>
                        <p className="text-xs text-gray-500 mt-1">Active employees</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FiAlertTriangle className="h-4 w-4" />
                            High Risk
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{insights.highRiskEmployees}</div>
                        <p className="text-xs text-gray-500 mt-1">Score ≥ 70</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FiTrendingUp className="h-4 w-4" />
                            Store Avg Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold" style={{ color: getScoreColor(insights.storeAverageAnomalyScore) }}>
                            {insights.storeAverageAnomalyScore.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Out of 100</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <FiPackage className="h-4 w-4" />
                            FEFO Adherence
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {fefoStats?.adherenceRate.toFixed(1) || 0}%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* High Risk Employees Alert */}
            {insights.highRiskEmployees > 0 && (
                <Alert variant="destructive">
                    <FiAlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{insights.highRiskEmployees} high-risk employee(s) detected!</strong> Immediate management review required.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* High Risk Employees List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FiShield className="h-5 w-5 text-red-600" />
                            High-Risk Employees
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {insights.highRiskList.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                ✅ No high-risk employees detected
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {insights.highRiskList.map((employee) => (
                                    <div
                                        key={employee.employeeId}
                                        className="p-4 border border-red-200 rounded-lg bg-red-50/50"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    Employee ID: {employee.employeeId.substring(0, 8)}...
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Last updated: {new Date(employee.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <Badge variant="destructive" className="text-lg font-bold px-3">
                                                {employee.anomalyScore.toFixed(0)}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                                            <div>
                                                <div className="text-gray-500">Manual Rate</div>
                                                <div className="font-semibold text-orange-600">
                                                    {employee.manualEntryRate.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Voids</div>
                                                <div className="font-semibold">{employee.voidCount}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Overrides</div>
                                                <div className="font-semibold">{employee.overrideCount}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={riskDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {riskDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* FEFO Violators */}
            {violators && violators.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FiPackage className="h-5 w-5 text-orange-600" />
                            Top FEFO Violators (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {violators.map((violator: any, i: number) => (
                                <div
                                    key={violator.employeeId}
                                    className="p-3 border rounded-lg flex items-center justify-between hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                Employee {violator.employeeId.substring(0, 8)}...
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {violator.deviationCount} deviations • Avg {violator.averageDeviationDays} days newer
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="font-bold">
                                        {violator.deviationCount}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
