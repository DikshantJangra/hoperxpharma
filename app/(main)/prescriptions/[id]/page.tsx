'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FiArrowLeft, FiFileText, FiRefreshCw, FiClock, FiFilePlus } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';
import { toast } from 'sonner';

// Tab Components
import OverviewTab from '../components/detail-tabs/OverviewTab';
import MedicationsTab from '../components/detail-tabs/MedicationsTab';
import RefillsTab from '../components/detail-tabs/RefillsTab';
import DispenseHistoryTab from '../components/detail-tabs/DispenseHistoryTab';
import DocumentsTab from '../components/detail-tabs/DocumentsTab';

// API
import { baseFetch } from '@/lib/api-client';

export default function PrescriptionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const prescriptionId = params.id as string;

    const [prescription, setPrescription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchPrescription();
    }, [prescriptionId]);

    const fetchPrescription = async (silent = false) => {
        try {
            if (!silent && !prescription) setLoading(true);
            const data = await baseFetch(`/api/v1/prescriptions/${prescriptionId}`);
            setPrescription(data);
        } catch (error: any) {
            toast.error('Failed to load prescription');
            console.error('[PrescriptionDetail] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading prescription...</p>
                </div>
            </div>
        );
    }

    if (!prescription) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <FiFileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Prescription Not Found</h2>
                    <p className="text-muted-foreground mb-4">
                        The prescription you're looking for doesn't exist or has been deleted.
                    </p>
                    <Button onClick={() => router.push('/prescriptions')}>
                        <FiArrowLeft className="mr-2 h-4 w-4" />
                        Back to Prescriptions
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/prescriptions')}
                    >
                        <FiArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {prescription.prescriptionNumber}
                        </h1>
                        <p className="text-muted-foreground">
                            {prescription.patient?.firstName} {prescription.patient?.lastName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusBadge status={prescription.status} />
                    <Button variant="outline" size="sm" onClick={() => fetchPrescription(false)}>
                        <FiRefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <FiFileText className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="medications" className="flex items-center gap-2">
                        <RiCapsuleLine className="h-4 w-4" />
                        Medications
                    </TabsTrigger>
                    <TabsTrigger value="refills" className="flex items-center gap-2">
                        <FiRefreshCw className="h-4 w-4" />
                        Refills
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                        <FiClock className="h-4 w-4" />
                        Dispense History
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2">
                        <FiFilePlus className="h-4 w-4" />
                        Documents
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                    <OverviewTab prescription={prescription} />
                </TabsContent>

                <TabsContent value="medications" className="mt-6">
                    <MedicationsTab prescription={prescription} onUpdate={fetchPrescription} />
                </TabsContent>

                <TabsContent value="refills" className="mt-6">
                    <RefillsTab prescription={prescription} onUpdate={() => fetchPrescription(true)} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <DispenseHistoryTab prescriptionId={prescriptionId} />
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                    <DocumentsTab prescription={prescription} onUpdate={fetchPrescription} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, { bg: string; text: string; label: string }> = {
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
        ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
        ON_HOLD: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'On Hold' },
        EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
        COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
        CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
    };

    const variant = variants[status] || variants.DRAFT;

    return (
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${variant.bg} ${variant.text}`}>
            {variant.label}
        </span>
    );
}
