'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiPlus, FiClock, FiUser, FiAlertCircle, FiFileText, FiEdit, FiRefreshCw, FiCheck, FiTrash2, FiMenu, FiX, FiShoppingCart } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';
import toast, { Toaster } from 'react-hot-toast';
import { prescriptionApi } from '@/lib/api/prescriptions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the detail tabs
import OverviewTab from '../components/detail-tabs/OverviewTab';
import MedicationsTab from '../components/detail-tabs/MedicationsTab';
import RefillsTab from '../components/detail-tabs/RefillsTab';
import HistoryTab from '../components/detail-tabs/HistoryTab';
import DocumentsTab from '../components/detail-tabs/DocumentsTab';
import PrescriptionForm from '../components/PrescriptionForm';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import { PrescriptionDetailsSkeleton } from '../components/PrescriptionDetailsSkeleton';

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'DRAFT': 'bg-gray-100 text-gray-700 border-gray-300',
        'ACTIVE': 'bg-blue-50 text-blue-700 border-blue-300',
        'ON_HOLD': 'bg-amber-50 text-amber-700 border-amber-300',
        'COMPLETED': 'bg-green-50 text-green-700 border-green-300',
        'CANCELLED': 'bg-red-50 text-red-700 border-red-300',
        'EXPIRED': 'bg-red-50 text-red-700 border-red-300'
    };

    return (
        <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

type RightPanelMode = 'empty' | 'view' | 'new';

export default function PrescriptionsListPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rightPanel, setRightPanel] = useState<RightPanelMode>('empty');
    const [activeTab, setActiveTab] = useState('overview');
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState<any | null>(null);

    useEffect(() => {
        fetchPrescriptions();
    }, [statusFilter]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const response = await prescriptionApi.getPrescriptions({
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                search: searchTerm || undefined
            });

            if (response.success) {
                setPrescriptions(response.data || []);
            }
        } catch (error) {
            console.error('[Prescriptions] Failed to fetch:', error);
            toast.error('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchPrescriptions();
    };

    const handleRowClick = async (rx: any) => {
        setSelectedId(rx.id);
        setRightPanel('view');
        setLoadingDetails(true);
        setActiveTab('overview'); // Reset to overview tab

        // Simulate loading delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 300));

        // Fetch full prescription details
        try {
            const response = await prescriptionApi.getPrescriptionById(rx.id);
            if (response.success && response.data) {
                // Update the prescription in the list with full details
                setPrescriptions(prev =>
                    prev.map(p => p.id === rx.id ? response.data : p)
                );
            }
        } catch (error) {
            console.error('[Prescription] Failed to fetch details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            setVerifyingId(id);
            const response = await prescriptionApi.verifyPrescription(id);
            if (response.success) {
                toast.success('✅ Prescription verified! Redirecting to POS...');
                router.push(`/pos/new-sale?importRx=${id}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to verify prescription');
            setVerifyingId(null);
        }
    };

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            setIsDeleting(true);
            const response = await prescriptionApi.deletePrescription(itemToDelete);
            if (response.success) {
                toast.success('Prescription deleted successfully');
                if (selectedId === itemToDelete) {
                    setSelectedId(null);
                    setRightPanel('empty');
                }
                fetchPrescriptions();
            }
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error('Delete error:', error);
            const message = error.message === 'Failed to fetch'
                ? 'Network error: Could not connect to server'
                : (error.response?.data?.message || 'Failed to delete prescription');
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const selectedRx = prescriptions.find(rx => rx.id === selectedId);

    const stats = {
        total: prescriptions.length,
        draft: prescriptions.filter(p => p.status === 'DRAFT').length,
        active: prescriptions.filter(p => p.status === 'ACTIVE').length,
        onHold: prescriptions.filter(p => p.status === 'ON_HOLD').length,
        completed: prescriptions.filter(p => p.status === 'COMPLETED').length
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Hamburger toggle */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                            >
                                {sidebarCollapsed ? <FiMenu className="w-5 h-5 text-gray-600" /> : <FiX className="w-5 h-5 text-gray-600" />}
                            </button>

                            <div>
                                <h1 className="text-xl font-bold text-gray-900">All Prescriptions</h1>
                                <p className="text-xs text-gray-500 mt-0.5">{stats.total} total</p>
                            </div>
                            <div className="relative flex-1 max-w-md">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search patient, Rx#, drug..."
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {[
                                { key: 'ALL', label: 'All', count: stats.total },
                                { key: 'DRAFT', label: 'Draft', count: stats.draft },
                                { key: 'ACTIVE', label: 'Active', count: stats.active },
                                { key: 'ON_HOLD', label: 'Hold', count: stats.onHold },
                                { key: 'COMPLETED', label: 'Done', count: stats.completed }
                            ].map((filter) => (
                                <button
                                    key={filter.key}
                                    onClick={() => setStatusFilter(filter.key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === filter.key
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label} {filter.count > 0 && <span className="ml-1 opacity-75">({filter.count})</span>}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setRightPanel('new');
                                setSelectedId(null);
                                setSidebarCollapsed(true); // Close sidebar when creating new
                            }}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            New
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Split Panel */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: List - Collapsible (hides completely) */}
                <div className={`bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-0' : 'w-80'
                    }`}>
                    {!sidebarCollapsed && (
                        <div className="h-full overflow-y-auto">

                            {loading ? (
                                <div className="divide-y divide-gray-100">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="p-3 animate-pulse">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                                <div className="h-5 bg-gray-200 rounded w-16"></div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 bg-gray-200 rounded w-20"></div>
                                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : prescriptions.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {prescriptions.map((rx) => (
                                        <div
                                            key={rx.id}
                                            onClick={() => handleRowClick(rx)}
                                            className={`p-3 cursor-pointer transition-all group relative ${selectedId === rx.id && rightPanel === 'view'
                                                ? 'bg-teal-50 border-l-4 border-teal-600'
                                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                                                }`}
                                        >
                                            {rx.priority === 'Urgent' && (
                                                <div className="absolute top-3 right-3">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                                                        {rx.patient?.firstName} {rx.patient?.lastName}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        {rx.prescriptionNumber || rx.id.slice(0, 16)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={rx.status} />
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <FiClock className="w-3 h-3" />
                                                    {new Date(rx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FiUser className="w-3 h-3" />
                                                    {rx.prescriber?.firstName ? `Dr. ${rx.prescriber.firstName}` : 'Walk-in'}
                                                </span>
                                                {rx.items && rx.items.length > 0 && (
                                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                                        {rx.items.length} items
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quick Actions for DRAFT prescriptions */}
                                            {rx.status === 'DRAFT' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleVerify(rx.id);
                                                        }}
                                                        disabled={verifyingId === rx.id}
                                                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                                                        title="Verify & Send to POS"
                                                    >
                                                        {verifyingId === rx.id ? (
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <FiCheck className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(rx.id);
                                                        }}
                                                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Quick Actions for VERIFIED prescriptions */}
                                            {rx.status === 'VERIFIED' && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/pos/new-sale?prescriptionId=${rx.id}`);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs font-medium flex items-center gap-1.5"
                                                        title="Dispense in POS"
                                                    >
                                                        <FiShoppingCart className="w-3 h-3" />
                                                        Dispense
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500 font-medium">No prescriptions found</p>
                                    <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Details (3/5 width) */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {rightPanel === 'empty' && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FiAlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium mb-2">Select a prescription to view details</p>
                                <p className="text-sm text-gray-400">Click any prescription from the list</p>
                            </div>
                        </div>
                    )}

                    {rightPanel === 'view' && loadingDetails && (
                        <PrescriptionDetailsSkeleton />
                    )}

                    {rightPanel === 'view' && selectedRx && !loadingDetails && (
                        <div className="p-6 max-w-4xl mx-auto space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {selectedRx.prescriptionNumber || selectedRx.id.slice(0, 16)}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {selectedRx.patient?.firstName} {selectedRx.patient?.lastName}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedRx.status === 'DRAFT' && (
                                        <button
                                            onClick={async () => {
                                                // Fetch full details before editing to ensure all data is loaded
                                                try {
                                                    const detailsResponse = await prescriptionApi.getPrescriptionById(selectedRx.id);
                                                    if (detailsResponse.success && detailsResponse.data) {
                                                        setEditingPrescription(detailsResponse.data);
                                                    } else {
                                                        setEditingPrescription(selectedRx);
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to fetch prescription details:', error);
                                                    setEditingPrescription(selectedRx); // Fallback to cached data
                                                }
                                                setRightPanel('new');
                                            }}
                                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-1.5"
                                        >
                                            <FiEdit className="w-4 h-4" />
                                            Edit
                                        </button>
                                    )}
                                    {selectedRx.status === 'VERIFIED' && (
                                        <button
                                            onClick={() => {
                                                router.push(`/pos/new-sale?prescriptionId=${selectedRx.id}`);
                                            }}
                                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <FiShoppingCart className="w-4 h-4" />
                                            Dispense Now
                                        </button>
                                    )}
                                    <StatusBadge status={selectedRx.status} />
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="w-full border-b border-gray-200 flex bg-gray-50">
                                        <TabsTrigger value="overview" className="flex-1 flex items-center justify-center gap-2">
                                            <FiFileText className="w-4 h-4" />
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="medications" className="flex-1 flex items-center justify-center gap-2">
                                            <RiCapsuleLine className="w-4 h-4" />
                                            Medications
                                        </TabsTrigger>
                                        <TabsTrigger value="refills" className="flex-1 flex items-center justify-center gap-2">
                                            <FiRefreshCw className="w-4 h-4" />
                                            Refills
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="flex-1 flex items-center justify-center gap-2">
                                            <FiClock className="w-4 h-4" />
                                            History
                                        </TabsTrigger>
                                        <TabsTrigger value="documents" className="flex-1 flex items-center justify-center gap-2">
                                            <FiFileText className="w-4 h-4" />
                                            Documents
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="medications" className="p-5 mt-0">
                                        <MedicationsTab prescription={selectedRx} onUpdate={fetchPrescriptions} />
                                    </TabsContent>

                                    <TabsContent value="refills" className="p-5 mt-0">
                                        <RefillsTab prescription={selectedRx} onUpdate={fetchPrescriptions} />
                                    </TabsContent>

                                    <TabsContent value="overview" className="p-5 mt-0">
                                        <OverviewTab prescription={selectedRx} />
                                    </TabsContent>

                                    <TabsContent value="history" className="p-5 mt-0">
                                        <HistoryTab prescription={selectedRx} />
                                    </TabsContent>

                                    <TabsContent value="documents" className="p-5 mt-0">
                                        <DocumentsTab prescription={selectedRx} onUpdate={fetchPrescriptions} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}

                    {rightPanel === 'new' && (
                        <div className="h-full flex items-center justify-center bg-gray-50/50 p-6">
                            <div className="w-full h-full max-h-[90vh] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                                <PrescriptionForm
                                    prescription={editingPrescription}
                                    onSubmit={async (data) => {
                                        try {
                                            const response = await prescriptionApi.createPrescription(data);
                                            if (response.success) {
                                                // Refresh the prescription list
                                                await fetchPrescriptions();

                                                // If we have a prescription ID (edit mode), refetch full details
                                                if (response.data?.id) {
                                                    const detailsResponse = await prescriptionApi.getPrescriptionById(response.data.id);
                                                    if (detailsResponse.success && detailsResponse.data) {
                                                        // Update the prescription in the array with full details
                                                        setPrescriptions(prev =>
                                                            prev.map(p => p.id === response.data.id ? detailsResponse.data : p)
                                                        );
                                                    }
                                                }

                                                // Only close panel if verified, keep open for drafts
                                                if (data.get?.('status') === 'VERIFIED' || (typeof data === 'object' && 'status' in data && data.status === 'VERIFIED')) {
                                                    toast.success('Prescription verified successfully!');
                                                    setRightPanel('empty');
                                                } else {
                                                    toast.success('Draft saved! You can continue editing.');
                                                }
                                            }
                                        } catch (error: any) {
                                            toast.error(error.message || 'Failed to create prescription');
                                            throw error;
                                        }
                                    }}
                                    onCancel={() => setRightPanel('empty')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onConfirm={confirmDelete}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                isDeleting={isDeleting}
                title="Delete Prescription"
                message="Are you sure you want to delete this prescription? This action cannot be undone."
            />
        </div >
    );
}
