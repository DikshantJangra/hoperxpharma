
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGSTR1Summary, getGSTR3BSummary, type GSTR1Summary, type GSTR3BSummary } from '@/lib/api/gst';
import { apiClient } from '@/lib/api/client';
import { AiOutlineDownload, AiOutlineLoading3Quarters, AiOutlineFileText, AiOutlineCheckCircle } from 'react-icons/ai';

export default function GSTFilingsPage() {
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);
    const [gstr1, setGstr1] = useState<GSTR1Summary | null>(null);
    const [gstr3b, setGstr3b] = useState<GSTR3BSummary | null>(null);

    useEffect(() => {
        loadData();
    }, [month]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [r1, r3b] = await Promise.all([
                getGSTR1Summary(month),
                getGSTR3BSummary(month)
            ]);
            setGstr1(r1);
            setGstr3b(r3b);
        } catch (error) {
            console.error('Failed to load filing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadGSTR1Json = () => {
        if (!gstr1) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gstr1, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `GSTR1_${month}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleFreeze = async () => {
        if (!confirm('Are you sure you want to FREEZE this period? This will lock the data for filing.')) return;
        setLoading(true);
        try {
            const response = await apiClient.post('/gst/filing/freeze', { month });
            if (response.data.success) {
                alert('Period Filed & Locked Successfully!');
                loadData(); // Reload to reflect status
            }
        } catch (error: any) {
            alert('Failed to freeze period: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GST Filing Center</h1>
                    <p className="text-muted-foreground">Manage your monthly returns and download filing payloads</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="px-3 py-2 border rounded-md"
                    />
                    <Button onClick={loadData} disabled={loading} variant="outline">
                        {loading ? <AiOutlineLoading3Quarters className="animate-spin" /> : 'Refresh'}
                    </Button>
                    <Button onClick={handleFreeze} disabled={loading || !gstr1} className="bg-green-600 hover:bg-green-700">
                        <AiOutlineCheckCircle className="mr-2" /> Lock & File Period
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="gstr1" className="w-full">
                <TabsList>
                    <TabsTrigger value="gstr1">GSTR-1 (Outward)</TabsTrigger>
                    <TabsTrigger value="gstr3b">GSTR-3B (Summary)</TabsTrigger>
                </TabsList>

                <TabsContent value="gstr1" className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={downloadGSTR1Json} disabled={!gstr1}>
                            <AiOutlineDownload className="mr-2" /> Download GSTR-1 JSON
                        </Button>
                    </div>

                    {gstr1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SummaryCard title="B2B Invoices" count={gstr1.b2b.count} value={gstr1.b2b.totalValue} />
                            <SummaryCard title="B2C Large" count={gstr1.b2cLarge.count} value={gstr1.b2cLarge.totalValue} />
                            <SummaryCard title="B2C Small" count={gstr1.b2cSmall.count} value={gstr1.b2cSmall.totalValue} />
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground">No Data Available</div>
                    )}

                    {gstr1?.hsnSummary && (
                        <Card>
                            <CardHeader><CardTitle>HSN Summary</CardTitle></CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="text-left border-b">
                                                <th className="p-3">HSN</th>
                                                <th className="p-3">Taxable Value</th>
                                                <th className="p-3">IGST</th>
                                                <th className="p-3">CGST</th>
                                                <th className="p-3">SGST</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gstr1.hsnSummary.map((hsn, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                                                    <td className="p-3 font-medium">{hsn.hsnCode}</td>
                                                    <td className="p-3">₹{hsn.taxableValue}</td>
                                                    <td className="p-3">₹{hsn.igst}</td>
                                                    <td className="p-3">₹{hsn.cgst}</td>
                                                    <td className="p-3">₹{hsn.sgst}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="gstr3b">
                    {gstr3b ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle>Tax Liability (Outward Supplies)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <StatBox label="Taxable Value" value={gstr3b.outwardSupplies.taxableValue} />
                                        <StatBox label="IGST" value={gstr3b.outwardSupplies.igst} />
                                        <StatBox label="CGST" value={gstr3b.outwardSupplies.cgst} />
                                        <StatBox label="SGST" value={gstr3b.outwardSupplies.sgst} />
                                        <StatBox label="CESS" value={gstr3b.outwardSupplies.cess} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader><CardTitle>Input Tax Credit (ITC Available)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-3"></div>
                                        <StatBox label="IGST" value={gstr3b.inputTaxCredit.igst} color="text-green-600" />
                                        <StatBox label="CGST" value={gstr3b.inputTaxCredit.cgst} color="text-green-600" />
                                        <StatBox label="SGST" value={gstr3b.inputTaxCredit.sgst} color="text-green-600" />
                                        <StatBox label="CESS" value={gstr3b.inputTaxCredit.cess} color="text-green-600" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-200 bg-blue-50/50">
                                <CardHeader><CardTitle className="text-blue-900">Net Tax Payable (Cash Ledger)</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-3"></div>
                                        <StatBox label="IGST" value={gstr3b.taxPayable.igst} bold />
                                        <StatBox label="CGST" value={gstr3b.taxPayable.cgst} bold />
                                        <StatBox label="SGST" value={gstr3b.taxPayable.sgst} bold />
                                        <StatBox label="CESS" value={gstr3b.taxPayable.cess} bold />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div>No Data</div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SummaryCard({ title, count, value }: { title: string, count: number, value: number }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <AiOutlineFileText className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">Total Value: ₹{value.toLocaleString()}</p>
            </CardContent>
        </Card>
    );
}

function StatBox({ label, value, color, bold }: { label: string, value: number, color?: string, bold?: boolean }) {
    return (
        <div className={`p-3 rounded-md bg-background border ${bold ? 'border-primary/20 shadow-sm' : ''}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-lg ${bold ? 'font-bold' : 'font-medium'} ${color || ''}`}>
                ₹{value.toLocaleString('en-IN')}
            </p>
        </div>
    );
}
