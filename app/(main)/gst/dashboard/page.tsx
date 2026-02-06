'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getGSTDashboard, getMonthlyTrends, type GSTDashboardData } from '@/lib/api/gst';
import { AiOutlineLoading3Quarters, AiOutlineRise, AiOutlineFileText, AiOutlineDollar, AiOutlineTeam } from 'react-icons/ai';
import { GSTConfidenceCard } from '@/components/gst/GSTConfidenceCard';
import { GSTRiskList } from '@/components/gst/GSTRiskList';

export default function GSTDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<GSTDashboardData | null>(null);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        loadDashboard();
    }, [selectedMonth]);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const result = await getGSTDashboard(selectedMonth || undefined);
            setData(result);
        } catch (error) {
            console.error('Failed to load GST dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!data) {
        return <div>No data available</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GST Dashboard</h1>
                    <p className="text-muted-foreground">
                        View your GST compliance and tax collection summary
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Score & Risks */}
                <div className="space-y-6">
                    <GSTConfidenceCard score={data.confidenceScore || 100} />
                    <GSTRiskList risks={data.risks || []} />

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <Button className="w-full justify-start" onClick={() => window.location.href = '/gst/filings'}>
                                View GSTR Summaries
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/settings/gst/tax-slabs'}>
                                Manage Tax Slabs
                            </Button>
                            <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/settings/gst/hsn-codes'}>
                                Manage HSN Codes
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: KPIs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">GST Collected</CardTitle>
                                <AiOutlineRise className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ₹{data.totalGstCollected.toLocaleString('en-IN')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    CGST: ₹{data.cgstAmount.toFixed(2)} | SGST: ₹{data.sgstAmount.toFixed(2)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Taxable Sales</CardTitle>
                                <AiOutlineDollar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ₹{data.taxableAmount.toLocaleString('en-IN')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.totalInvoices} invoices
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">B2B Sales</CardTitle>
                                <AiOutlineTeam className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.b2bCount}</div>
                                <p className="text-xs text-muted-foreground">
                                    With verified GSTIN
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Zero-Rated</CardTitle>
                                <AiOutlineFileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ₹{data.zeroRatedTotal.toLocaleString('en-IN')}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.zeroRatedCount} invoices
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Categories</CardTitle>
                            <p className="text-sm text-muted-foreground">GSTR classification breakdown</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(data.categoryBreakdown).map(([category, count]) => (
                                    <div key={category} className="flex justify-between items-center border-b pb-2 last:border-0">
                                        <span className="text-sm font-medium">{category}</span>
                                        <span className="text-sm text-muted-foreground">{count} invoices</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
