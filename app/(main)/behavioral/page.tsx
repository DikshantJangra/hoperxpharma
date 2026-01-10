'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreBehavioralDashboard } from '@/components/dashboard/StoreBehavioralDashboard';
import { EmployeePerformanceCard } from '@/components/dashboard/EmployeePerformanceCard';
import { Activity, Shield, TrendingUp } from 'react-icons/fi';

export default function BehavioralAnalyticsPage() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="h-8 w-8 text-emerald-600" />
                    Behavioral Analytics
                </h1>
                <p className="text-gray-500 mt-2">
                    Monitor employee performance and detect behavioral anomalies
                </p>
            </div>

            <Tabs defaultValue="store" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="store" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Store Overview
                    </TabsTrigger>
                    <TabsTrigger value="employee" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        My Performance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="store" className="space-y-6">
                    <StoreBehavioralDashboard />
                </TabsContent>

                <TabsContent value="employee" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <EmployeePerformanceCard days={30} />
                        <EmployeePerformanceCard days={7} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Understanding Your Score</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">0-30: Low Risk (Excellent)</h4>
                                <p className="text-sm text-green-700">
                                    Great performance! You're following all protocols consistently.
                                </p>
                            </div>

                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-semibold text-yellow-900 mb-2">30-50: Moderate (Good)</h4>
                                <p className="text-sm text-yellow-700">
                                    Good performance with minor inconsistencies. Focus on scanning all items.
                                </p>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h4 className="font-semibold text-orange-900 mb-2">50-70: Elevated (Needs Attention)</h4>
                                <p className="text-sm text-orange-700">
                                    Several protocol deviations detected. Please review best practices with your manager.
                                </p>
                            </div>

                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-semibold text-red-900 mb-2">70-100: High Risk (Critical)</h4>
                                <p className="text-sm text-red-700">
                                    Immediate management review required. Multiple high-risk behaviors detected.
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">📊 Score Components</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• <strong>Manual Entry Rate (30%):</strong> Items entered without scanning</li>
                                    <li>• <strong>Void Rate (25%):</strong> Frequency of voided transactions</li>
                                    <li>• <strong>Override Rate (25%):</strong> Manual price or batch overrides</li>
                                    <li>• <strong>FEFO Deviation Rate (20%):</strong> Choosing newer batches over older ones</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
