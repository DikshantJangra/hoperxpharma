"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiPlus, FiClock, FiUser, FiAlertCircle, FiCheck, FiEdit, FiPause, FiX, FiPackage, FiSave, FiCheckCircle, FiFileText, FiTrash2, FiUpload, FiLink, FiMonitor, FiAlertTriangle, FiInfo, FiPaperclip, FiMapPin, FiBox } from "react-icons/fi";
import { prescriptionApi } from "@/lib/api/prescriptions";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";
import { drugApi, patientApi } from "@/lib/api/drugs";
import OCRUploader from "./upload/components/OCRUploader";
import toast, { Toaster } from 'react-hot-toast';
import PrescriberSelect from "./components/PrescriberSelect";
import PatientSearchSelect from "@/components/prescriptions/PatientSearchSelect";
import ImageViewer from "./components/ImageViewer";
import { optimizeImage } from "@/utils/imageOptimizer";
import { tokenManager } from "@/lib/api/client";

// New Interface for Inventory Display
interface InventoryBatch {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantityInStock: number;
    location?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'DRAFT': 'bg-gray-100 text-gray-700 border-gray-300',
        'IN_PROGRESS': 'bg-blue-50 text-blue-700 border-blue-300',
        'ON_HOLD': 'bg-amber-50 text-amber-700 border-amber-300',
        'COMPLETED': 'bg-green-50 text-green-700 border-green-300',
        'CANCELLED': 'bg-red-50 text-red-700 border-red-300'
    };

    return (
        <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

interface PrescriptionItem {
    drugId: string;
    drugName: string;
    quantity: number;
    sig: string;
    daysSupply: number;
    isControlled: boolean;
    batchId?: string;
}

type RightPanelMode = 'empty' | 'view' | 'new';

export default function PrescriptionsPage() {
    const router = useRouter();
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [rightPanel, setRightPanel] = useState<RightPanelMode>('empty');
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'notes'>('details');
    const [inputMode, setInputMode] = useState<'manual' | 'scan' | 'verify'>('manual');
    const [scannedFile, setScannedFile] = useState<File | null>(null);
    const [scannedPreview, setScannedPreview] = useState<string | null>(null);
    const [ocrText, setOcrText] = useState<string | null>(null);
    const [selectedPrescriber, setSelectedPrescriber] = useState<any>(null);
    const [drugInventory, setDrugInventory] = useState<{ total: number, batches: InventoryBatch[] } | null>(null);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);

    // ... existing code ...

    const handleOCRComplete = (data: any) => {
        setScannedFile(data.file);
        setScannedPreview(data.previewUrl);
        setOcrText(data.rawText);

        // Auto-fill Patient
        if (data.patientName && data.patientName.length > 2) {
            // Patient name detected - user can search manually in PatientSearchSelect
            toast.success(`Detected Patient: ${data.patientName}`);
        }

        // Auto-fill common fields from first detected drug
        if (data.potentialDrugs && data.potentialDrugs.length > 0) {
            const firstDrug = data.potentialDrugs[0];

            // Set search hint
            setDrugSearch(firstDrug.drugName);

            // Pre-fill form fields
            setCurrentItem({
                ...currentItem,
                quantity: firstDrug.quantity || 1,
                sig: firstDrug.sig || '',
                // If we detected other fields like daysSupply (future), add here is possible
            });

            toast(`Detected ${data.potentialDrugs.length} potential items. Details pre-filled.`, { icon: '💊' });
        }

        setInputMode('verify');
    };

    const handleSaveNewPrescription = async () => {
        if (!selectedPatient || items.length === 0) {
            toast.error('Please select patient and add at least one medication');
            return;
        }

        try {
            setSaving(true);

            // Use FormData to send file + data
            const formData = new FormData();

            // Common data
            formData.append('patientId', selectedPatient.id);
            if (selectedPrescriber) {
                formData.append('prescriberId', selectedPrescriber.id);
            }
            formData.append('priority', priority);
            formData.append('source', source);
            formData.append('items', JSON.stringify(items.map(item => ({
                drugId: item.drugId,
                quantity: item.quantity,
                daysSupply: item.daysSupply,
                sig: item.sig
            }))));

            if (scannedFile) {
                if (scannedFile.type.startsWith('image/')) {
                    try {
                        const optimized = await optimizeImage(scannedFile);
                        formData.append('files', optimized);
                    } catch (e) {
                        console.warn("Retrying scanned file optimization or fallback", e);
                        formData.append('files', scannedFile);
                    }
                } else {
                    formData.append('files', scannedFile);
                }
                if (ocrText) formData.append('ocrText', ocrText);
            }
            // Append extra attachments
            attachments.forEach(file => {
                formData.append('files', file);
            });

            // Since we need to use FormData, we probably need a custom API call here
            // or update the generic API helper to support FormData.
            // For now, let's assume we use a direct fetch or axios call for multipart

            const token = tokenManager.getAccessToken();

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/prescriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                credentials: 'include' // Important for cookies (if used in addition to token)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create prescription');
            }

            setRightPanel('empty');
            resetNewForm();
            toast.success('Prescription created successfully!');
            fetchPrescriptions(); // Refresh list
        } catch (error: any) {
            console.error('Save error:', error);
            toast.error(error.message || 'Failed to save prescription');
        } finally {
            setSaving(false);
        }
    };

    // ... existing code ...

    // New prescription form state
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const [drugSearch, setDrugSearch] = useState("");
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [showDrugResults, setShowDrugResults] = useState(false);
    const [searchingDrugs, setSearchingDrugs] = useState(false);

    const [items, setItems] = useState<PrescriptionItem[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItem>>({
        quantity: 1,
        sig: "",
        daysSupply: 30
    });

    const [priority, setPriority] = useState<'Normal' | 'Urgent'>('Normal');
    const [source, setSource] = useState<'manual' | 'e-Rx'>('manual');
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    // Prefetch POS route for faster redirection
    useEffect(() => {
        router.prefetch('/pos/new-sale');
    }, [router]);

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

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            // Handle specific "Failed to fetch" or network errors specially if needed
            const message = error.message === 'Failed to fetch'
                ? 'Network error: Could not connect to server'
                : (error.response?.data?.message || 'Failed to delete prescription');
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSelectPrescription = (rx: any) => {
        setSelectedId(rx.id);
        setRightPanel('view');
        setActiveTab('details');
    };

    const handleNewPrescription = () => {
        setRightPanel('new');
        setSelectedId(null);
        resetNewForm();
    };

    const resetNewForm = () => {
        setSelectedPatient(null);
        setSelectedPrescriber(null);
        setItems([]);
        setCurrentItem({ quantity: 1, sig: "", daysSupply: 30 });
        setDrugSearch("");
        setPriority('Normal');
        setSource('manual');
        setErrors({});
        setDrugInventory(null);
        setEditingIndex(null);
        setSelectedBatchIds([]);
    };

    const selectedRx = prescriptions.find(rx => rx.id === selectedId);

    const stats = {
        total: prescriptions.length,
        draft: prescriptions.filter(p => p.status === 'DRAFT').length,
        inProgress: prescriptions.filter(p => p.status === 'IN_PROGRESS').length,
        onHold: prescriptions.filter(p => p.status === 'ON_HOLD').length,
        completed: prescriptions.filter(p => p.status === 'COMPLETED').length
    };

    // Drug search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (drugSearch.length >= 2) {
                try {
                    setSearchingDrugs(true);
                    const response = await drugApi.searchDrugs(drugSearch);
                    if (response.success) {
                        setDrugResults(response.data || []);
                        setShowDrugResults(true);
                    }
                } catch (error) {
                    toast.error('Failed to search drugs');
                } finally {
                    setSearchingDrugs(false);
                }
            } else {
                setDrugResults([]);
                setShowDrugResults(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [drugSearch]);

    const handleSelectDrug = async (drug: any) => {
        setCurrentItem({
            ...currentItem,
            drugId: drug.id,
            drugName: drug.name,
            isControlled: drug.isControlled || false
        });
        setDrugSearch("");
        setShowDrugResults(false);

        try {
            const response = await drugApi.getDrugById(drug.id);
            if (response.success && response.data.inventory) {
                const batches = response.data.inventory.items || response.data.inventory;

                // Filter out zero-stock batches
                const validBatches = batches.filter((b: any) => b.quantityInStock > 0);
                const total = validBatches.reduce((acc: number, b: any) => acc + b.quantityInStock, 0);
                const sortedBatches = validBatches.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                setDrugInventory({
                    total,
                    batches: sortedBatches
                });

                // FEFO: Auto-select first valid batch
                if (sortedBatches.length > 0) {
                    setCurrentItem(prev => ({
                        ...prev,
                        drugId: drug.id,
                        drugName: drug.name,
                        isControlled: drug.isControlled || false,
                        batchId: sortedBatches[0].id
                    }));
                    setSelectedBatchIds([sortedBatches[0].id]);
                } else {
                    toast.error(`${drug.name} has no stock available`);
                    setSelectedBatchIds([]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch inventory", e);
            setDrugInventory(null);
            setSelectedBatchIds([]);
        }
    };

    const validateItem = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!currentItem.drugId) newErrors.drug = 'Please select a medication';

        if (!currentItem.quantity || currentItem.quantity < 1) {
            newErrors.quantity = 'Quantity must be at least 1';
        } else if (drugInventory && selectedBatchIds.length > 0) {
            // Check against total stock of selected batches
            const totalSelectedStock = drugInventory.batches
                .filter(b => selectedBatchIds.includes(b.id))
                .reduce((sum, b) => sum + b.quantityInStock, 0);

            if (Number(currentItem.quantity) > totalSelectedStock) {
                newErrors.quantity = `Max quantity for selected batch(es) is ${totalSelectedStock}`;
            }
        }

        if (!currentItem.sig || currentItem.sig.trim() === '') newErrors.sig = 'Instructions are required';

        if (!currentItem.daysSupply || currentItem.daysSupply < 1) newErrors.daysSupply = 'Days supply must be at least 1';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSelectBatch = (batch: InventoryBatch) => {
        // Toggle batch selection for multi-select
        setSelectedBatchIds(prev => {
            if (prev.includes(batch.id)) {
                // Deselect
                const updated = prev.filter(id => id !== batch.id);
                // Update currentItem.batchId to first selected or null
                if (updated.length > 0) {
                    setCurrentItem({ ...currentItem, batchId: updated[0] });
                } else {
                    setCurrentItem({ ...currentItem, batchId: undefined });
                }
                return updated;
            } else {
                // Select
                const updated = [...prev, batch.id];
                // Set currentItem.batchId to first selected
                setCurrentItem({ ...currentItem, batchId: updated[0] });
                return updated;
            }
        });
    };

    const handleAddItem = () => {
        if (!validateItem()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (editingIndex !== null) {
            const updatedItems = [...items];
            updatedItems[editingIndex] = currentItem as PrescriptionItem;
            setItems(updatedItems);
            setEditingIndex(null);
            toast.success('Medication updated');
        } else {
            // Multi-batch support: split quantity across selected batches
            if (selectedBatchIds.length > 1 && drugInventory) {
                const selectedBatches = drugInventory.batches.filter(b => selectedBatchIds.includes(b.id));
                let remainingQty = Number(currentItem.quantity) || 1;
                const newItems: PrescriptionItem[] = [];

                for (const batch of selectedBatches) {
                    if (remainingQty <= 0) break;

                    const qtyToTake = Math.min(remainingQty, batch.quantityInStock);

                    if (qtyToTake > 0) {
                        newItems.push({
                            drugId: currentItem.drugId!,
                            drugName: currentItem.drugName!,
                            quantity: qtyToTake,
                            sig: currentItem.sig!,
                            daysSupply: currentItem.daysSupply!,
                            isControlled: currentItem.isControlled || false,
                            batchId: batch.id
                        });

                        remainingQty -= qtyToTake;
                    }
                }

                setItems([...items, ...newItems]);
                toast.success(`Medication added (${newItems.length} batch${newItems.length > 1 ? 'es' : ''})`);
            } else {
                // Single batch
                setItems([...items, currentItem as PrescriptionItem]);
                toast.success('Medication added');
            }
        }

        setCurrentItem({ quantity: 1, sig: "", daysSupply: 30 });
        setDrugSearch("");
        setErrors({});
        setSelectedBatchIds([]);
        setDrugInventory(null);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        toast.success('Medication removed');
    };



    const sigTemplates = [
        "Take 1 tablet twice daily",
        "Take 1 tablet three times daily",
        "Take 1 capsule at bedtime",
        "Apply topically as needed",
        "Take 1 tablet every 4-6 hours as needed"
    ];

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Prescriptions</h1>
                                <p className="text-xs text-gray-500 mt-0.5">{stats.total} total</p>
                            </div>
                            <div className="relative flex-1 max-w-md">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search patient, Rx ID, drug..."
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {[
                                { key: 'ALL', label: 'All', count: stats.total },
                                { key: 'DRAFT', label: 'Draft', count: stats.draft },
                                { key: 'IN_PROGRESS', label: 'Active', count: stats.inProgress },
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
                            onClick={() => toast('E-Rx Integration coming soon!', { icon: '🔌' })}
                            className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <FiMonitor className="w-4 h-4" />
                            Connect E-Rx
                        </button>
                        <button
                            onClick={handleNewPrescription}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            New
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: List */}
                <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto">
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
                                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : prescriptions.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {prescriptions.map((rx) => (
                                <div
                                    key={rx.id}
                                    onClick={() => handleSelectPrescription(rx)}
                                    className={`p-3 cursor-pointer transition-all group relative ${selectedId === rx.id && rightPanel === 'view'
                                        ? 'bg-teal-50 border-l-4 border-teal-600'
                                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                                        } `}
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
                                            <p className="text-xs text-gray-500 font-mono">{rx.id.slice(0, 16)}...</p>
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
                                            {rx.prescriber?.name || 'Walk-in'}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                            {rx.items?.length || 0} items
                                        </span>
                                    </div>

                                    {rx.status === 'DRAFT' && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleVerify(rx.id);
                                                }}
                                                disabled={verifyingId === rx.id}
                                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-75 disabled:cursor-wait"
                                                title="Verify"
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

                {/* Right: Details or New Form */}
                <div className="flex-1 overflow-y-auto bg-gray-50">
                    {rightPanel === 'empty' && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <FiAlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-medium mb-2">Select a prescription to view details</p>
                                <p className="text-sm text-gray-400">or click "New" to create a prescription</p>
                            </div>
                        </div>
                    )}

                    {rightPanel === 'view' && selectedRx && (
                        <div className="p-6 max-w-4xl mx-auto space-y-4">
                            {/* Action Bar */}
                            {selectedRx.status === 'DRAFT' && (
                                <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">Ready to verify?</h3>
                                            <p className="text-sm text-gray-500">Review details and send to dispense queue</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeleteClick(selectedRx.id)}
                                                className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                            <button
                                                onClick={() => handleVerify(selectedRx.id)}
                                                disabled={verifyingId === selectedRx.id}
                                                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-75 disabled:cursor-wait"
                                            >
                                                <FiCheck className="w-4 h-4" />
                                                {verifyingId === selectedRx.id ? 'Verifying...' : 'Verify & Send to Queue'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                <div className="border-b border-gray-200 flex">
                                    {[
                                        { key: 'details', label: 'Details', icon: FiFileText },
                                        { key: 'history', label: 'History', icon: FiClock },
                                        { key: 'notes', label: 'Notes', icon: FiEdit }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key as any)}
                                            className={`flex-1 px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === tab.key
                                                ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                } `}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-5">
                                    {activeTab === 'details' && (
                                        <div className="space-y-4">
                                            {/* Patient Info */}
                                            <div>
                                                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                    <FiUser className="w-4 h-4 text-teal-600" />
                                                    Patient Information
                                                </h2>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Name</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {selectedRx.patient?.firstName} {selectedRx.patient?.lastName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Phone</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {selectedRx.patient?.phoneNumber || '-'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Allergies</div>
                                                        <div className="text-sm text-gray-900">
                                                            {selectedRx.patient?.allergies?.join(', ') || 'None'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Chronic Conditions</div>
                                                        <div className="text-sm text-gray-900">
                                                            {selectedRx.patient?.chronicConditions?.join(', ') || 'None'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Prescription Info */}
                                            <div className="pt-4 border-t border-gray-200">
                                                <h2 className="text-base font-bold text-gray-900 mb-3">Prescription Details</h2>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Priority</div>
                                                        <div className="text-sm font-semibold text-gray-900">{selectedRx.priority}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Source</div>
                                                        <div className="text-sm font-semibold text-gray-900">{selectedRx.source}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 font-medium mb-1">Created</div>
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {new Date(selectedRx.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Attachments Display */}
                                            {console.log('Selected Rx Debug:', { files: selectedRx.files, uploadedImages: selectedRx.uploadedImages })}
                                            {((selectedRx.files && selectedRx.files.length > 0) || (selectedRx.uploadedImages && selectedRx.uploadedImages.length > 0)) && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                        <FiPaperclip className="text-gray-400" />
                                                        Attachments ({(selectedRx.files?.length || 0) + (selectedRx.uploadedImages?.length || 0)})
                                                    </h2>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                        {/* Render Relation Files */}
                                                        {selectedRx.files?.map((file: any) => (
                                                            <div key={file.id} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                                                                <div className="aspect-video bg-gray-200 rounded mb-2 overflow-hidden flex items-center justify-center">
                                                                    {file.fileUrl.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                                                                        <img
                                                                            src={file.fileUrl}
                                                                            alt="Attachment"
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                        />
                                                                    ) : (
                                                                        <FiFileText className="w-8 h-8 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-xs text-gray-500 truncate max-w-[100px] block" title={file.fileUrl.split('/').pop()}>
                                                                        {file.fileUrl.split('/').pop()}
                                                                    </span>
                                                                    <a
                                                                        href={file.fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1.5 bg-white border border-gray-200 rounded hover:bg-teal-50 hover:text-teal-600 transition-colors"
                                                                        title="View/Download"
                                                                    >
                                                                        <FiLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {/* Render Legacy Uploaded Images (Strings) */}
                                                        {selectedRx.uploadedImages?.map((url: string, idx: number) => {
                                                            // Avoid duplicates if usage overlaps (rare but possible during migration)
                                                            if (selectedRx.files?.some((f: any) => f.fileUrl === url)) return null;
                                                            return (
                                                                <div key={`legacy-${idx}`} className="group relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
                                                                    <div className="aspect-video bg-gray-200 rounded mb-2 overflow-hidden flex items-center justify-center">
                                                                        <img
                                                                            src={url}
                                                                            alt="Attachment"
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                        />
                                                                    </div>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-xs text-gray-500 truncate max-w-[100px] block">Legacy Img {idx + 1}</span>
                                                                        <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-gray-200 rounded hover:bg-teal-50 hover:text-teal-600 transition-colors">
                                                                            <FiLink className="w-3 h-3" />
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Medications */}
                                            <div className="pt-4 border-t border-gray-200">
                                                <h2 className="text-base font-bold text-gray-900 mb-3">Medications ({selectedRx.items?.length || 0})</h2>
                                                {selectedRx.items && selectedRx.items.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {selectedRx.items.map((item: any, idx: number) => (
                                                            <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <h3 className="font-semibold text-gray-900 text-sm">
                                                                            {item.drug?.name}
                                                                        </h3>
                                                                        <div className="mt-2 space-y-1">
                                                                            <p className="text-xs text-gray-600">
                                                                                <span className="font-medium">Quantity:</span> {item.quantityPrescribed}
                                                                            </p>
                                                                            {item.sig && (
                                                                                <p className="text-xs text-gray-600">
                                                                                    <span className="font-medium">Instructions:</span> {item.sig}
                                                                                </p>
                                                                            )}
                                                                            {item.daysSupply && (
                                                                                <p className="text-xs text-gray-600">
                                                                                    <span className="font-medium">Days Supply:</span> {item.daysSupply}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {item.isControlled && (
                                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-300">
                                                                            CONTROLLED
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-center py-8 text-gray-400">No medications</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="text-center py-12 text-gray-400">
                                            <FiClock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>Audit history coming soon</p>
                                        </div>
                                    )}

                                    {activeTab === 'notes' && (
                                        <div className="text-center py-12 text-gray-400">
                                            <FiEdit className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>Notes feature coming soon</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {rightPanel === 'new' && (
                        <div className="p-6 max-w-4xl mx-auto space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">New Prescription</h2>
                                    <p className="text-xs text-gray-500">Create a new prescription for a patient</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setRightPanel('empty');
                                        resetNewForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Input Mode Tabs */}
                            <div className="bg-gray-100 p-1 rounded-lg flex mb-6">
                                <button
                                    onClick={() => setInputMode('manual')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${inputMode === 'manual'
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        } `}
                                >
                                    <FiEdit className="w-4 h-4" />
                                    Manual Entry
                                </button>
                                <button
                                    onClick={() => setInputMode('scan')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${inputMode === 'scan'
                                        ? 'bg-white text-teal-700 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        } `}
                                >
                                    <FiUpload className="w-4 h-4" />
                                    Upload Scan
                                </button>
                            </div>

                            {inputMode === 'scan' ? (
                                <div className="space-y-4">
                                    <OCRUploader onComplete={handleOCRComplete} />
                                </div>
                            ) : inputMode === 'verify' ? (
                                <div className="flex flex-col h-[calc(100vh-200px)]">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-yellow-800 text-sm">
                                            <FiAlertCircle />
                                            <span className="font-semibold">Verification Mode:</span> Compare the scanned image with your entries.
                                        </div>
                                        <button
                                            onClick={() => setInputMode('manual')}
                                            className="text-xs text-yellow-800 underline hover:text-yellow-900"
                                        >
                                            Switch to Full Form
                                        </button>
                                    </div>

                                    <div className="flex-1 flex gap-4 overflow-hidden">
                                        {/* Left: Image Preview */}
                                        <div className="w-1/2 bg-gray-900 rounded-xl overflow-hidden relative group">
                                            {scannedPreview ? (
                                                <ImageViewer src={scannedPreview} alt="Scanned Prescription" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    No preview available
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Form (Scrollable) */}
                                        <div className="w-1/2 overflow-y-auto pr-2">
                                            {/* Reuse the form components here */}
                                            {/* Patient Selection */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiUser className="w-4 h-4 text-teal-600" />
                                                    <h3 className="text-sm font-bold text-gray-900">Patient</h3>
                                                    {selectedPatient && <FiCheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                                                </div>

                                                <PatientSearchSelect
                                                    selectedPatient={selectedPatient}
                                                    onSelect={(patient) => {
                                                        setSelectedPatient(patient);
                                                        setErrors({ ...errors, patient: '' });
                                                    }}
                                                />
                                            </div>

                                            {/* Prescriber Selection */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiUser className="w-4 h-4 text-blue-600" />
                                                    <h3 className="text-sm font-bold text-gray-900">Prescriber</h3>
                                                </div>
                                                <PrescriberSelect
                                                    selectedPrescriber={selectedPrescriber}
                                                    onSelect={setSelectedPrescriber}
                                                />
                                            </div>

                                            {/* Drug Entry */}
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiPackage className="w-4 h-4 text-teal-600" />
                                                    <h3 className="text-sm font-bold text-gray-900">Medications</h3>
                                                </div>
                                                {/* Simplified Drug Search for Verify Mode */}
                                                <div className="relative mb-3">
                                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={drugSearch}
                                                        onChange={(e) => setDrugSearch(e.target.value)}
                                                        placeholder="Add medication..."
                                                        className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                                    />
                                                    {showDrugResults && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                                            {drugResults.map(d => (
                                                                <div key={d.id} onClick={() => handleSelectDrug(d)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm">
                                                                    {d.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {currentItem.drugId && (
                                                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                                                        <div className="font-bold text-sm text-blue-900 mb-2">{currentItem.drugName}</div>
                                                        {drugInventory && (
                                                            <div className="mb-2 p-2 bg-white rounded border border-blue-100">
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span className="font-semibold text-blue-800">Stock: {drugInventory.total}</span>
                                                                    <span className="text-blue-600">FEFO Active</span>
                                                                </div>
                                                                {drugInventory.batches.find(b => b.id === currentItem.batchId) && Number(currentItem.quantity || 0) > (drugInventory.batches.find(b => b.id === currentItem.batchId)?.quantityInStock || 0) && (
                                                                    <div className="text-xs text-red-600 font-bold flex items-center gap-1">
                                                                        <FiAlertTriangle /> Exceeds Batch Stock ({drugInventory.batches.find(b => b.id === currentItem.batchId)?.quantityInStock})
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Qty"
                                                                value={currentItem.quantity}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    e.target.value = val.toString();
                                                                    setCurrentItem({ ...currentItem, quantity: val });
                                                                }}
                                                                className="p-1.5 text-sm border rounded"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder="Sig..."
                                                                value={currentItem.sig}
                                                                onChange={(e) => setCurrentItem({ ...currentItem, sig: e.target.value })}
                                                                className="p-1.5 text-sm border rounded"
                                                            />
                                                        </div>
                                                        <button onClick={handleAddItem} className="w-full py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                                            {editingIndex !== null ? 'Update' : 'Add'}
                                                        </button>
                                                    </div>
                                                )}

                                                {items.map((item, idx) => (
                                                    <div key={idx} className="p-2 bg-gray-50 border rounded mb-1 flex justify-between items-center text-sm">
                                                        <span>{item.drugName} <span className="text-gray-500">x{item.quantity}</span></span>
                                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500"><FiX /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2 border-t mt-auto">
                                        <button onClick={() => setInputMode('manual')} className="px-4 py-2 text-gray-600 font-semibold text-sm">Back</button>
                                        <button
                                            onClick={handleSaveNewPrescription}
                                            disabled={saving}
                                            className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold shadow-md hover:bg-teal-700 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving...' : 'Confirm & Save'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Normal Manual Entry Mode (Patient Selection, etc.) */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiUser className="w-5 h-5 text-teal-600" />
                                            <h3 className="text-base font-bold text-gray-900">Patient Information</h3>
                                            {selectedPatient && <FiCheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                                        </div>

                                        <PatientSearchSelect
                                            selectedPatient={selectedPatient}
                                            onSelect={(patient) => {
                                                setSelectedPatient(patient);
                                                setErrors({ ...errors, patient: '' });
                                            }}
                                        />
                                    </div>

                                    {/* Prescriber Selection */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiUser className="w-5 h-5 text-blue-600" />
                                            <h3 className="text-base font-bold text-gray-900">Prescriber Details</h3>
                                        </div>
                                        <PrescriberSelect
                                            selectedPrescriber={selectedPrescriber}
                                            onSelect={setSelectedPrescriber}
                                        />
                                    </div>

                                    {/* Prescription Details */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-base font-bold text-gray-900 mb-4">Prescription Details</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
                                                <select
                                                    value={priority}
                                                    onChange={(e) => setPriority(e.target.value as any)}
                                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="Normal">Normal</option>
                                                    <option value="Urgent">Urgent</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Source</label>
                                                <select
                                                    value={source}
                                                    onChange={(e) => setSource(e.target.value as any)}
                                                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="manual">Manual Entry</option>
                                                    <option value="e-Rx">E-Prescription</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add Medications */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiPackage className="w-5 h-5 text-teal-600" />
                                            <h3 className="text-base font-bold text-gray-900">Medications</h3>
                                        </div>

                                        {/* Drug Search */}
                                        <div className="relative mb-3">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={drugSearch}
                                                onChange={(e) => setDrugSearch(e.target.value)}
                                                placeholder="Search medication..."
                                                className={`w-full pl-9 pr-10 py-2.5 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.drug ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {searchingDrugs && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-teal-600 rounded-full border-t-transparent" />
                                                </div>
                                            )}

                                            {showDrugResults && (
                                                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {drugResults.length > 0 ? (
                                                        drugResults.map((drug) => (
                                                            <div
                                                                key={drug.id}
                                                                onClick={() => handleSelectDrug(drug)}
                                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                            >
                                                                <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                                                                    {drug.name}
                                                                    {drug.isControlled && (
                                                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">CONTROLLED</span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {drug.manufacturer} • {drug.packSize}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500 text-sm">
                                                            <FiAlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                            <p>No medications found</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Details */}
                                        {currentItem.drugId && (
                                            <>
                                                {drugInventory && (
                                                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="text-sm font-bold text-blue-800">Available Stock: {drugInventory.total}</div>
                                                            <div className="text-xs text-blue-600 flex items-center gap-1"><FiInfo /> Select batch(es) - FEFO</div>
                                                        </div>
                                                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar mb-2">
                                                            {drugInventory.batches.map(batch => {
                                                                const isSelected = selectedBatchIds.includes(batch.id);
                                                                return (
                                                                    <div
                                                                        key={batch.id}
                                                                        onClick={() => handleSelectBatch(batch)}
                                                                        className={`flex items-center gap-2 text-xs p-2 rounded border cursor-pointer transition-colors ${isSelected
                                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                                            : 'bg-white text-gray-700 border-blue-100 hover:border-blue-300'
                                                                            }`}
                                                                    >
                                                                        {/* Checkbox */}
                                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`}>
                                                                            {isSelected && <FiCheck className="w-3 h-3 text-blue-600" />}
                                                                        </div>

                                                                        <div className="flex justify-between flex-1">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-mono font-bold">Batch: {batch.batchNumber}</span>
                                                                                {batch.location && (
                                                                                    <span className={`text-[10px] flex items-center gap-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                                        <FiMapPin className="w-3 h-3" /> Loc: {batch.location}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex flex-col items-end">
                                                                                <span className={`font-medium ${new Date(batch.expiryDate) < new Date()
                                                                                    ? (isSelected ? 'text-red-200' : 'text-red-600')
                                                                                    : (isSelected ? 'text-green-200' : 'text-green-600')
                                                                                    }`}>
                                                                                    Exp: {new Date(batch.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })}
                                                                                </span>
                                                                                <span className="font-bold">Qty: {batch.quantityInStock}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        {selectedBatchIds.length > 0 && drugInventory.batches.filter(b => selectedBatchIds.includes(b.id)).length > 0 && (
                                                            <div className="text-xs text-blue-700 font-medium">
                                                                {selectedBatchIds.length} batch(es) selected • Total: {drugInventory.batches.filter(b => selectedBatchIds.includes(b.id)).reduce((sum, b) => sum + b.quantityInStock, 0)} units
                                                            </div>
                                                        )}
                                                        {selectedBatchIds.length > 0 && Number(currentItem.quantity || 0) > drugInventory.batches.filter(b => selectedBatchIds.includes(b.id)).reduce((sum, b) => sum + b.quantityInStock, 0) && (
                                                            <div className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1">
                                                                <FiAlertTriangle /> Warning: Quantity exceeds total available stock from selected batches!
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                                        <FiPackage className="w-4 h-4 text-blue-600" />
                                                        {currentItem.drugName}
                                                        {currentItem.isControlled && (
                                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded border border-amber-300">
                                                                CONTROLLED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3 mb-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quantity *</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={currentItem.quantity}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                e.target.value = val.toString();
                                                                setCurrentItem({ ...currentItem, quantity: val });
                                                            }}
                                                            className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.quantity ? 'border-red-300' : 'border-gray-300'}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Days Supply *</label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={currentItem.daysSupply}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    e.target.value = val.toString();
                                                                    setCurrentItem({ ...currentItem, daysSupply: val });
                                                                }}
                                                                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.daysSupply ? 'border-red-300' : 'border-gray-300'}`}
                                                            />
                                                            {/* Quick Select Days */}
                                                            <div className="absolute right-1 top-1.5 flex gap-1">
                                                                {[7, 15, 30, 90].map(d => (
                                                                    <button
                                                                        key={d}
                                                                        onClick={() => setCurrentItem({ ...currentItem, daysSupply: d })}
                                                                        className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-[10px] rounded text-gray-600 font-medium transition-colors"
                                                                    >
                                                                        {d}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sig Template</label>
                                                        <select
                                                            onChange={(e) => e.target.value && setCurrentItem({ ...currentItem, sig: e.target.value })}
                                                            className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        >
                                                            <option value="">Select...</option>
                                                            {sigTemplates.map(sig => <option key={sig} value={sig}>{sig}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Sig (Instructions) *</label>
                                                    <input
                                                        type="text"
                                                        value={currentItem.sig}
                                                        onChange={(e) => setCurrentItem({ ...currentItem, sig: e.target.value })}
                                                        placeholder="e.g., Take 1 tablet twice daily with food"
                                                        className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.sig ? 'border-red-300' : 'border-gray-300'}`}
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleAddItem}
                                                    className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <FiPlus className="w-4 h-4" />
                                                    Add Medication
                                                </button>
                                            </>
                                        )}

                                        {/* Attachments Section */}
                                        <div className="mt-6 border-t border-gray-100 pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <FiPaperclip className="text-gray-400" /> Attachments
                                                </h4>
                                                <label className="cursor-pointer px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1">
                                                    <FiPlus className="w-3 h-3" /> Add File
                                                    <input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        accept="image/*,application/pdf"
                                                        onChange={async (e) => {
                                                            if (e.target.files) {
                                                                const newFiles: File[] = [];
                                                                for (let i = 0; i < e.target.files.length; i++) {
                                                                    const file = e.target.files[i];
                                                                    if (file.type.startsWith('image/')) {
                                                                        try {
                                                                            const optimized = await optimizeImage(file);
                                                                            newFiles.push(optimized);
                                                                        } catch (err) {
                                                                            console.error("Optimization failed", err);
                                                                            newFiles.push(file); // Fallback
                                                                        }
                                                                    } else {
                                                                        newFiles.push(file);
                                                                    }
                                                                }
                                                                setAttachments([...attachments, ...newFiles]);
                                                                toast.success(`${newFiles.length} file(s) attached`);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {attachments.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {attachments.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <FiFileText className="text-gray-400 w-3 h-3" />
                                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                                <span className="text-gray-400">({(file.size / 1024).toFixed(0)}KB)</span>
                                                            </div>
                                                            <button
                                                                onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <FiX className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Items List */}
                                        {items.length > 0 && (
                                            <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                                                <h4 className="text-sm font-bold text-gray-900">Added Medications ({items.length})</h4>
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="p-3 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h5 className="font-semibold text-gray-900 text-sm">{item.drugName}</h5>
                                                                {item.isControlled && (
                                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">CONTROLLED</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                <span className="font-medium">Qty:</span> {item.quantity} •
                                                                <span className="font-medium"> Days:</span> {item.daysSupply} •
                                                                <span className="font-medium"> Sig:</span> {item.sig}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                        >
                                                            <FiX className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setRightPanel('empty');
                                                resetNewForm();
                                            }}
                                            className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveNewPrescription}
                                            disabled={saving || !selectedPatient || items.length === 0}
                                            className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <FiSave className="w-4 h-4" />
                                            {saving ? 'Saving...' : 'Save Prescription'}
                                        </button>
                                    </div>

                                </>
                            )}

                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Prescription"
                message="Are you sure you want to delete this prescription? This action cannot be undone."
                isDeleting={isDeleting}
            />
        </div >
    );
}
