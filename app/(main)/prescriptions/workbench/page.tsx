'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { baseFetch } from '@/lib/api-client';
import { FiClock, FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Kanban Components
import DispenseCard from './components/DispenseCard';
import DispensePanel from './components/DispensePanel';

type DispenseStatus = 'QUEUED' | 'VERIFYING' | 'FILLING' | 'CHECKING' | 'READY';

interface WorkbenchData {
    QUEUED: any[];
    VERIFYING: any[];
    FILLING: any[];
    CHECKING: any[];
    READY: any[];
}

export default function WorkbenchPage() {
    const [dispenses, setDispenses] = useState<WorkbenchData>({
        QUEUED: [],
        VERIFYING: [],
        FILLING: [],
        CHECKING: [],
        READY: [],
    });
    const [loading, setLoading] = useState(true);
    const [selectedDispense, setSelectedDispense] = useState<any>(null);
    const [panelOpen, setPanelOpen] = useState(false);

    useEffect(() => {
        fetchWorkbenchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchWorkbenchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchWorkbenchData = async () => {
        try {
            const data = await baseFetch('/api/v1/dispenses/workbench');
            setDispenses(data);
        } catch (error: any) {
            toast.error('Failed to load workbench data');
            console.error('[Workbench] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (dispense: any) => {
        setSelectedDispense(dispense);
        setPanelOpen(true);
    };

    const handleStatusUpdate = async (dispenseId: string, newStatus: DispenseStatus) => {
        try {
            await baseFetch(`/api/v1/dispenses/${dispenseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            toast.success(`Moved to ${newStatus}`);
            fetchWorkbenchData();
            setPanelOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleSendToPOS = (dispenseId: string) => {
        // Navigate to POS with dispense ID
        window.location.href = `/pos/new-sale?dispenseId=${dispenseId}`;
    };

    const totalDispenses = Object.values(dispenses).reduce((sum, arr) => sum + arr.length, 0);
    const urgentCount = Object.values(dispenses).reduce(
        (sum, arr) => sum + arr.filter(d => d.priority === 'URGENT').length,
        0
    );

    const columns: { key: DispenseStatus; label: string; icon: any; color: string }[] = [
        { key: 'QUEUED', label: 'Queued', icon: FiClock, color: 'text-gray-600' },
        { key: 'VERIFYING', label: 'Verifying', icon: FiAlertCircle, color: 'text-yellow-600' },
        { key: 'FILLING', label: 'Filling', icon: FiPackage, color: 'text-blue-600' },
        { key: 'CHECKING', label: 'Checking', icon: FiCheckCircle, color: 'text-purple-600' },
        { key: 'READY', label: 'Ready', icon: FiCheckCircle, color: 'text-green-600' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading workbench...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Workbench</h1>
                        <p className="text-sm text-muted-foreground">Operational workflow management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Card className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Total:</span>
                                <span className="text-lg font-bold">{totalDispenses}</span>
                            </div>
                        </Card>
                        {urgentCount > 0 && (
                            <Card className="px-4 py-2 bg-red-50 border-red-200">
                                <div className="flex items-center gap-2">
                                    <FiAlertCircle className="text-red-600" />
                                    <span className="text-sm text-red-700">Urgent:</span>
                                    <span className="text-lg font-bold text-red-700">{urgentCount}</span>
                                </div>
                            </Card>
                        )}
                        <Button onClick={fetchWorkbenchData} variant="outline">
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex gap-4 h-full min-w-fit">
                    {columns.map((column) => {
                        const Icon = column.icon;
                        const columnDispenses = dispenses[column.key] || [];

                        return (
                            <div key={column.key} className="flex flex-col w-80 shrink-0">
                                {/* Column Header */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-5 w-5 ${column.color}`} />
                                            <h3 className="font-semibold">{column.label}</h3>
                                        </div>
                                        <Badge variant="secondary">{columnDispenses.length}</Badge>
                                    </div>
                                    <div className="h-1 rounded-full bg-gradient-to-r from-primary/20 to-primary/5" />
                                </div>

                                {/* Column Cards */}
                                <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                                    {columnDispenses.length === 0 ? (
                                        <Card className="p-8 text-center text-muted-foreground text-sm">
                                            No items
                                        </Card>
                                    ) : (
                                        columnDispenses.map((dispense: any) => (
                                            <DispenseCard
                                                key={dispense.id}
                                                dispense={dispense}
                                                onClick={() => handleCardClick(dispense)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dispense Panel (Side Drawer) */}
            {panelOpen && selectedDispense && (
                <DispensePanel
                    dispense={selectedDispense}
                    isOpen={panelOpen}
                    onClose={() => setPanelOpen(false)}
                    onStatusUpdate={handleStatusUpdate}
                    onSendToPOS={handleSendToPOS}
                />
            )}
        </div>
    );
}
