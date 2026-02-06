
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineLoading3Quarters } from 'react-icons/ai';

export default function GSTLedgerPage() {
    const [entries, setEntries] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('');

    useEffect(() => {
        loadLedger();
    }, [pagination.page, filterType]);

    const loadLedger = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit
            };
            if (filterType) params.type = filterType;

            const response = await apiClient.get('/gst/ledger', { params });
            if (response.data.success) {
                setEntries(response.data.data.data);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load ledger', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'PROVISIONAL': return 'bg-yellow-100 text-yellow-800';
            case 'REVERSED': return 'bg-red-100 text-red-800';
            case 'INELIGIBLE': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">GST Ledger</h1>
                    <p className="text-muted-foreground">Detailed transaction logs for compliance</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 border rounded-md text-sm"
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                    >
                        <option value="">All Types</option>
                        <option value="SALE">Sales</option>
                        <option value="PURCHASE">Purchases</option>
                        <option value="SALE_RETURN">Sale Returns</option>
                        <option value="WRITEOFF">Write-offs</option>
                    </select>
                    <Button onClick={loadLedger} disabled={loading} variant="outline" size="icon">
                        <AiOutlineLoading3Quarters className={loading ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="p-3 text-left">Date</th>
                                    <th className="p-3 text-left">Event Type</th>
                                    <th className="p-3 text-left">Ref ID</th>
                                    <th className="p-3 text-left">HSN</th>
                                    <th className="p-3 text-right">Taxable</th>
                                    <th className="p-3 text-right">CGST</th>
                                    <th className="p-3 text-right">SGST</th>
                                    <th className="p-3 text-right">IGST</th>
                                    <th className="p-3 text-center">ITC Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry: any) => (
                                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/5">
                                        <td className="p-3 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                                        <td className="p-3">
                                            <Badge variant={entry.eventType === 'PURCHASE' ? 'outline' : 'default'} className="text-xs">
                                                {entry.eventType}
                                            </Badge>
                                        </td>
                                        <td className="p-3 font-mono text-xs">{entry.eventId}</td>
                                        <td className="p-3">{entry.hsnCode}</td>
                                        <td className="p-3 text-right">₹{Number(entry.taxableValue).toFixed(2)}</td>
                                        <td className="p-3 text-right text-gray-500">₹{Number(entry.cgstAmount).toFixed(2)}</td>
                                        <td className="p-3 text-right text-gray-500">₹{Number(entry.sgstAmount).toFixed(2)}</td>
                                        <td className="p-3 text-right text-gray-500">₹{Number(entry.igstAmount).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            {entry.eventType === 'PURCHASE' || entry.eventType === 'WRITEOFF' ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(entry.itcStatus)}`}>
                                                    {entry.itcStatus}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !loading && (
                                    <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No records found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                        <AiOutlineArrowLeft className="mr-2" /> Prev
                    </Button>
                    <Button
                        variant="outline"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                        Next <AiOutlineArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
