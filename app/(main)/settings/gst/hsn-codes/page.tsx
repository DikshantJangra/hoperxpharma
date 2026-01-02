'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getHsnCodes, type HsnCode } from '@/lib/api/gst';
import { AiOutlineLoading3Quarters, AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai';

export default function HsnCodesPage() {
    const [loading, setLoading] = useState(true);
    const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadHsnCodes();
    }, [searchQuery]);

    const loadHsnCodes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getHsnCodes({ search: searchQuery || undefined });
            setHsnCodes(data || []);
        } catch (error: any) {
            console.error('Failed to load HSN codes:', error);
            setError(error.response?.data?.message || 'Failed to load HSN codes. Please login and try again.');
            setHsnCodes([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">HSN Codes</h1>
                    <p className="text-muted-foreground">
                        Manage product classifications and tax mappings
                    </p>
                </div>
                <Button>
                    <AiOutlinePlus className="h-4 w-4 mr-2" />
                    Add HSN Code
                </Button>
            </div>

            <div className="flex gap-4">
                <div className="relative flex-1">
                    <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by HSN code or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin" />
                </div>
            ) : (hsnCodes?.length === 0 && !error) ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">
                            No HSN codes found. Add your first HSN code or seed defaults from Tax Slabs page.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{hsnCodes.length} HSN Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">HSN Code</th>
                                        <th className="text-left p-3">Description</th>
                                        <th className="text-left p-3">Category</th>
                                        <th className="text-left p-3">Tax Slab</th>
                                        <th className="text-center p-3">GST Rate</th>
                                        <th className="text-center p-3">Status</th>
                                        <th className="text-right p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hsnCodes.map((hsn) => (
                                        <tr key={hsn.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3 font-mono font-medium">{hsn.code}</td>
                                            <td className="p-3">{hsn.description}</td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {hsn.category || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-3">{hsn.taxSlab.name}</td>
                                            <td className="p-3 text-center font-medium">{hsn.taxSlab.rate}%</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs ${hsn.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {hsn.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <Button size="sm" variant="ghost">Edit</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
