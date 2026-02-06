
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { AiOutlineCloudUpload, AiOutlineCheckCircle, AiOutlineWarning, AiOutlineCloseCircle, AiOutlineLoading3Quarters } from 'react-icons/ai';

export default function GSTReconciliationPage() {
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleReconcile = async () => {
        if (!jsonInput) return;
        setLoading(true);
        try {
            let parsedData;
            try {
                parsedData = JSON.parse(jsonInput);
                // Handle different JSON structures if needed, assuming array of invoices for now
                if (parsedData.data) parsedData = parsedData.data;
            } catch (e) {
                alert('Invalid JSON');
                setLoading(false);
                return;
            }

            const response = await apiClient.post('/gst/reconcile', {
                month,
                gstr2bData: parsedData
            });

            if (response.data.success) {
                setResults(response.data.data);
            }
        } catch (error) {
            console.error('Reconciliation failed:', error);
            alert('Reconciliation failed. Check console.');
        } finally {
            setLoading(false);
        }
    };

    const loadSampleData = () => {
        const sample = [
            { invoiceNumber: "INV-001", supplierName: "Pharma Distrib A", totalTax: 500, date: "2024-01-15" },
            { invoiceNumber: "INV-002", supplierName: "MediSupply Co", totalTax: 1200, date: "2024-01-18" },
            { invoiceNumber: "MISSING-01", supplierName: "Unknown Vendor", totalTax: 300, date: "2024-01-20" }
        ];
        setJsonInput(JSON.stringify(sample, null, 2));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GSTR-2B Reconciliation</h1>
                    <p className="text-muted-foreground">Match your Purchase Register with Government Data</p>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload GSTR-2B JSON</CardTitle>
                            <CardDescription>Paste the JSON data from your GSTR-2B file here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="w-full h-64 p-3 border rounded-md font-mono text-xs"
                                placeholder="Paste JSON here..."
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleReconcile} disabled={loading} className="flex-1">
                                    {loading ? <AiOutlineLoading3Quarters className="animate-spin mr-2" /> : <AiOutlineCloudUpload className="mr-2" />}
                                    Run Reconciliation
                                </Button>
                                <Button variant="outline" onClick={loadSampleData}>Sample</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                    {results ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ResultCard
                                    title="Matched"
                                    count={results.matched.length}
                                    color="bg-green-50 text-green-700 border-green-200"
                                    icon={<AiOutlineCheckCircle className="w-6 h-6" />}
                                />
                                <ResultCard
                                    title="Mismatched"
                                    count={results.mismatched.length}
                                    color="bg-yellow-50 text-yellow-700 border-yellow-200"
                                    icon={<AiOutlineWarning className="w-6 h-6" />}
                                />
                                <ResultCard
                                    title="Missing Logs"
                                    count={results.missingInLocal.length + results.missingInPortal.length}
                                    color="bg-red-50 text-red-700 border-red-200"
                                    icon={<AiOutlineCloseCircle className="w-6 h-6" />}
                                />
                            </div>

                            {results.mismatched.length > 0 && (
                                <Card className="border-yellow-200">
                                    <CardHeader className="py-3 bg-yellow-50"><CardTitle className="text-sm font-bold text-yellow-800">Value Mismatches</CardTitle></CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-yellow-100/50 text-yellow-900">
                                                <tr>
                                                    <th className="p-3 text-left">Invoice</th>
                                                    <th className="p-3 text-left">Supplier</th>
                                                    <th className="p-3 text-right">My Books</th>
                                                    <th className="p-3 text-right">Portal</th>
                                                    <th className="p-3 text-right">Diff</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.mismatched.map((item: any, i: number) => (
                                                    <tr key={i} className="border-b last:border-0 hover:bg-yellow-50/50">
                                                        <td className="p-3 font-medium">{item.invoiceNumber}</td>
                                                        <td className="p-3">{item.supplierName}</td>
                                                        <td className="p-3 text-right">₹{item.localValue}</td>
                                                        <td className="p-3 text-right">₹{item.portalValue}</td>
                                                        <td className="p-3 text-right font-bold text-red-600">₹{item.diff}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}

                            {results.missingInLocal.length > 0 && (
                                <Card className="border-red-200">
                                    <CardHeader className="py-3 bg-red-50"><CardTitle className="text-sm font-bold text-red-800">Missing in My Books (Extra in Portal)</CardTitle></CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-red-100/50 text-red-900">
                                                <tr>
                                                    <th className="p-3 text-left">Invoice</th>
                                                    <th className="p-3 text-left">Supplier</th>
                                                    <th className="p-3 text-right">Tax Amount</th>
                                                    <th className="p-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.missingInLocal.map((item: any, i: number) => (
                                                    <tr key={i} className="border-b last:border-0 hover:bg-red-50/50">
                                                        <td className="p-3 font-medium">{item.invoiceNumber}</td>
                                                        <td className="p-3">{item.supplierName}</td>
                                                        <td className="p-3 text-right">₹{item.portalValue}</td>
                                                        <td className="p-3 text-right"><Button size="sm" variant="ghost" className="h-6 text-xs">Add Entry</Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}

                            {results.matched.length > 0 && (
                                <Card className="border-green-200">
                                    <CardHeader className="py-3 bg-green-50"><CardTitle className="text-sm font-bold text-green-800">Matched Invoices</CardTitle></CardHeader>
                                    <CardContent className="p-0">
                                        <div className="p-3 text-sm text-green-700">
                                            {results.matched.length} invoices matched perfectly. ITC confirmed.
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
                            <AiOutlineCloudUpload className="w-12 h-12 mb-2 opacity-50" />
                            <p>Upload JSON and run reconciliation to see results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ResultCard({ title, count, color, icon }: any) {
    return (
        <Card className={`border ${color}`}>
            <CardContent className="p-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium opacity-80">{title}</p>
                    <p className="text-3xl font-bold">{count}</p>
                </div>
                <div className={`p-3 rounded-full bg-white/50`}>{icon}</div>
            </CardContent>
        </Card>
    );
}
