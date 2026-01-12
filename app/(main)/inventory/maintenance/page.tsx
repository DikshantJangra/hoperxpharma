'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { FaCheck, FaEdit, FaSearch, FaSync } from 'react-icons/fa';
import { BiLoaderAlt } from 'react-icons/bi';

interface Drug {
    id: string;
    name: string;
    manufacturer: string;
    genericName: string;
    ingestionStatus: 'DRAFT' | 'SALT_PENDING' | 'ACTIVE';
}

export default function SaltMaintenancePage() {
    const [drugs, setDrugs] = useState<Drug[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchPendingDrugs = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch drugs with SALT_PENDING status
            // Note: We depend on the backend supporting 'ingestionStatus' filter which we just added
            const res = await apiClient.get('/drugs', {
                params: {
                    ingestionStatus: 'SALT_PENDING',
                    limit: 50,
                    sort: 'name',
                    order: 'asc'
                }
            });

            // Handle pagination wrapper if present
            const data = res.data?.data || res.data || [];
            // If API returns paginated structure: { docs: [], ... } or { drugs: [], ... }
            // Adjust based on your API response format
            setDrugs(Array.isArray(data) ? data : (data.drugs || []));

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch pending drugs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingDrugs();
    }, [fetchPendingDrugs]);

    const startEdit = (drug: Drug) => {
        setEditingId(drug.id);
        setEditValue(drug.genericName || '');
    };

    const saveEdit = async (id: string) => {
        try {
            await apiClient.patch(`/drugs/${id}`, {
                genericName: editValue
                // Note: We rely on backend hook to auto-map and potentially update status?
                // Actually, backend hook triggers mapping but might not auto-update status to ACTIVE if map succeeds immediately.
                // We might need to manually set status if we are confident, OR let the backend job do it.
                // For now, we update genericName.
            });

            toast.success("Updated & Triggered Auto-Map");
            setEditingId(null);
            fetchPendingDrugs(); // Refresh to see if status changed (if backend updates it)
        } catch (error) {
            console.error(error);
            toast.error("Failed to update");
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Salt Maintenance</h1>
                    <p className="text-slate-500">Fix unmapped drugs to enable substitution</p>
                </div>
                <Button onClick={fetchPendingDrugs} variant="outline">
                    <FaSync className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium">
                            <tr>
                                <th className="p-4">Drug Name</th>
                                <th className="p-4">Manufacturer</th>
                                <th className="p-4 w-1/3">Salt Composition (Generic Name)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        <BiLoaderAlt className="w-8 h-8 mx-auto animate-spin mb-2" />
                                        Loading unmapped drugs...
                                    </td>
                                </tr>
                            ) : drugs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-green-600">
                                        <FaCheck className="w-8 h-8 mx-auto mb-2" />
                                        All caught up! No pending salts.
                                    </td>
                                </tr>
                            ) : (
                                drugs.map(drug => (
                                    <tr key={drug.id} className="hover:bg-slate-50 group">
                                        <td className="p-4 font-medium text-slate-900">{drug.name}</td>
                                        <td className="p-4 text-slate-500">{drug.manufacturer || '-'}</td>
                                        <td className="p-4">
                                            {editingId === drug.id ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                        placeholder="e.g. Paracetamol 500mg"
                                                    />
                                                    <Button size="sm" onClick={() => saveEdit(drug.id)} className="h-8 bg-green-600 hover:bg-green-700">
                                                        Save
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div
                                                    className="cursor-pointer hover:text-blue-600 flex items-center group-hover:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200"
                                                    onClick={() => startEdit(drug)}
                                                >
                                                    <span className={!drug.genericName ? 'text-red-400 italic' : ''}>
                                                        {drug.genericName || 'Missing Composition'}
                                                    </span>
                                                    <FaEdit className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                                {drug.ingestionStatus}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* Future: View Details */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
