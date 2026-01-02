'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getGSTR1Summary, getGSTR3BSummary, type GSTR1Summary, type GSTR3BSummary } from '@/lib/api/gst';
import { AiOutlineLoading3Quarters, AiOutlineDownload } from 'react-icons/ai';

export default function GSTFilingsPage() {
    const [loading, setLoading] = useState(true);
    const [gstr1, setGstr1] = useState<GSTR1Summary | null>(null);
    const [gstr3b, setGstr3b] = useState<GSTR3BSummary | null>(null);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        loadSummaries();
    }, [selectedMonth]);

    const loadSummaries = async () => {
        try {
            setLoading(true);
            const [gstr1Data, gstr3bData] = await Promise.all([
                getGSTR1Summary(selectedMonth || undefined),
                getGSTR3BSummary(selectedMonth || undefined)
            ]);
            setGstr1(gstr1Data);
            setGstr3b(gstr3bData);
        } catch (error) {
            console.error('Failed to load GSTR summaries:', error);
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

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GSTR Filing Summaries</h1>
                    <p className="text-muted-foreground">
                        View and download GST return summaries for filing
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

            <Tabs defaultValue="gstr1" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
                    <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
                </TabsList>

                <TabsContent value="gstr1" className="space-y-4">
                    {gstr1 && (
                        <>
                            {/* B2B Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>B2B Supplies</CardTitle>
                                            <p className="text-sm text-muted-foreground">{gstr1.b2b.count} invoices with GSTIN</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <AiOutlineDownload className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-medium mb-2">
                                        Total Value: ₹{gstr1.b2b.totalValue.toLocaleString('en-IN')}
                                    </div>
                                    {gstr1.b2b.invoices.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Invoice No.</th>
                                                        <th className="text-left p-2">GSTIN</th>
                                                        <th className="text-right p-2">Taxable</th>
                                                        <th className="text-right p-2">CGST</th>
                                                        <th className="text-right p-2">SGST</th>
                                                        <th className="text-right p-2">IGST</th>
                                                        <th className="text-right p-2">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gstr1.b2b.invoices.slice(0, 10).map((inv) => (
                                                        <tr key={inv.invoiceNumber} className="border-b">
                                                            <td className="p-2">{inv.invoiceNumber}</td>
                                                            <td className="p-2 font-mono text-xs">{inv.buyerGstin}</td>
                                                            <td className="p-2 text-right">₹{inv.taxableValue.toFixed(2)}</td>
                                                            <td className="p-2 text-right">₹{inv.cgst.toFixed(2)}</td>
                                                            <td className="p-2 text-right">₹{inv.sgst.toFixed(2)}</td>
                                                            <td className="p-2 text-right">₹{inv.igst.toFixed(2)}</td>
                                                            <td className="p-2 text-right font-medium">₹{inv.invoiceValue.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No B2B invoices for this period</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* B2C Small Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>B2C Small (≤ ₹2.5L per invoice)</CardTitle>
                                    <p className="text-sm text-muted-foreground">Aggregate summary</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Invoices</p>
                                            <p className="font-medium">{gstr1.b2cSmall.count}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Taxable Value</p>
                                            <p className="font-medium">₹{gstr1.b2cSmall.taxableValue.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">CGST</p>
                                            <p className="font-medium">₹{gstr1.b2cSmall.cgst.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">SGST</p>
                                            <p className="font-medium">₹{gstr1.b2cSmall.sgst.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Total</p>
                                            <p className="font-medium">₹{gstr1.b2cSmall.totalValue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* HSN Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>HSN-wise Summary</CardTitle>
                                    <p className="text-sm text-muted-foreground">Product classification breakdown</p>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">HSN Code</th>
                                                    <th className="text-left p-2">Description</th>
                                                    <th className="text-right p-2">Quantity</th>
                                                    <th className="text-right p-2">Taxable Value</th>
                                                    <th className="text-right p-2">Total Tax</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gstr1.hsnSummary.map((hsn) => (
                                                    <tr key={hsn.hsnCode} className="border-b">
                                                        <td className="p-2 font-mono">{hsn.hsnCode}</td>
                                                        <td className="p-2">{hsn.description}</td>
                                                        <td className="p-2 text-right">{hsn.totalQuantity}</td>
                                                        <td className="p-2 text-right">₹{hsn.taxableValue.toFixed(2)}</td>
                                                        <td className="p-2 text-right">₹{(hsn.cgst + hsn.sgst + hsn.igst).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="gstr3b" className="space-y-4">
                    {gstr3b && (
                        <>
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle>GSTR-3B Summary</CardTitle>
                                            <p className="text-sm text-muted-foreground">Tax liability summary</p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <AiOutlineDownload className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Outward Supplies */}
                                    <div>
                                        <h3 className="font-semibold mb-3">3.1 Outward Supplies</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Taxable Value</p>
                                                <p className="font-medium">₹{gstr3b.outwardSupplies.taxableValue.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">CGST</p>
                                                <p className="font-medium">₹{gstr3b.outwardSupplies.cgst.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">SGST</p>
                                                <p className="font-medium">₹{gstr3b.outwardSupplies.sgst.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">IGST</p>
                                                <p className="font-medium">₹{gstr3b.outwardSupplies.igst.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Cess</p>
                                                <p className="font-medium">₹{gstr3b.outwardSupplies.cess.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tax Payable */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Tax Payable</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="bg-muted p-3 rounded">
                                                <p className="text-muted-foreground">CGST</p>
                                                <p className="font-bold text-lg">₹{gstr3b.taxPayable.cgst.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-muted p-3 rounded">
                                                <p className="text-muted-foreground">SGST</p>
                                                <p className="font-bold text-lg">₹{gstr3b.taxPayable.sgst.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-muted p-3 rounded">
                                                <p className="text-muted-foreground">IGST</p>
                                                <p className="font-bold text-lg">₹{gstr3b.taxPayable.igst.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-muted p-3 rounded">
                                                <p className="text-muted-foreground">Cess</p>
                                                <p className="font-bold text-lg">₹{gstr3b.taxPayable.cess.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ITC Note */}
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <strong>Note:</strong> {gstr3b.inputTaxCredit.note}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
