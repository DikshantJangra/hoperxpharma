import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiSave, FiAlertCircle, FiCheck, FiX, FiPackage, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import { drugApi } from '@/lib/api/drugs';
import PatientSearchSelect from '@/components/prescriptions/PatientSearchSelect';
import PrescriberSelect from './PrescriberSelect';
import toast from 'react-hot-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

// Interfaces
interface InventoryBatch {
    id: string;
    batchNumber: string;
    expiryDate: string;
    quantityInStock: number;
    location?: string;
}

interface PrescriptionItem {
    drugId: string;
    drugName: string;
    quantity: number;
    sig: string;
    daysSupply: number;
    isControlled: boolean;
    batchId?: string;
}

interface PrescriptionFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    scannedData?: any; // For OCR auto-fill
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ initialData, onSubmit, onCancel, scannedData }) => {
    // Form State
    const [selectedPatient, setSelectedPatient] = useState<any>(initialData?.patient || null);
    const [selectedPrescriber, setSelectedPrescriber] = useState<any>(initialData?.prescriber || null);
    const [priority, setPriority] = useState<'Normal' | 'Urgent'>(initialData?.priority || 'Normal');
    const [source, setSource] = useState<'manual' | 'e-Rx'>(initialData?.source || 'manual');

    // Items State
    const [items, setItems] = useState<PrescriptionItem[]>(initialData?.items || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItem>>({
        quantity: 1,
        sig: "",
        daysSupply: 30
    });

    // Drug Search State
    const [drugSearch, setDrugSearch] = useState("");
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [showDrugResults, setShowDrugResults] = useState(false);
    const [searchingDrugs, setSearchingDrugs] = useState(false);
    const [drugInventory, setDrugInventory] = useState<{ total: number, batches: InventoryBatch[] } | null>(null);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    // Effect: Handle OCR Data Auto-fill
    useEffect(() => {
        if (scannedData) {
            if (scannedData.patientName && !selectedPatient) {
                // In a real app, we might search for this patient here
                // For now, we rely on the parent or manual selection
            }
            if (scannedData.potentialDrugs && scannedData.potentialDrugs.length > 0) {
                const firstDrug = scannedData.potentialDrugs[0];
                setDrugSearch(firstDrug.drugName);
                setCurrentItem(prev => ({
                    ...prev,
                    quantity: firstDrug.quantity || 1,
                    sig: firstDrug.sig || '',
                }));
            }
        }
    }, [scannedData]);

    // Drug Search Effect
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
                    console.error("Search failed", error);
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
                const total = batches.reduce((acc: number, b: any) => acc + b.quantityInStock, 0);
                const sortedBatches = batches.sort((a: any, b: any) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
                setDrugInventory({
                    total,
                    batches: sortedBatches
                });

                // FEFO: Auto-select first batch
                if (sortedBatches.length > 0) {
                    setCurrentItem(prev => ({
                        ...prev,
                        drugId: drug.id,
                        drugName: drug.name,
                        isControlled: drug.isControlled || false,
                        batchId: sortedBatches[0].id
                    }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch inventory", e);
            setDrugInventory(null);
        }
    };

    const handleSelectBatch = (batch: InventoryBatch) => {
        setCurrentItem({ ...currentItem, batchId: batch.id });
    };

    const validateItem = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!currentItem.drugId) newErrors.drug = 'Please select a medication';
        if (!currentItem.quantity || currentItem.quantity < 1) newErrors.quantity = 'Quantity > 0';
        if (drugInventory) {
            const selectedBatch = drugInventory.batches.find(b => b.id === currentItem.batchId);
            if (selectedBatch && Number(currentItem.quantity) > selectedBatch.quantityInStock) {
                newErrors.quantity = `Max: ${selectedBatch.quantityInStock}`;
            }
        }
        if (!currentItem.sig?.trim()) newErrors.sig = 'Required';
        if (!currentItem.daysSupply || currentItem.daysSupply < 1) newErrors.daysSupply = 'Required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddItem = () => {
        if (!validateItem()) {
            toast.error('Please fix item errors');
            return;
        }

        if (editingIndex !== null) {
            const updatedItems = [...items];
            updatedItems[editingIndex] = currentItem as PrescriptionItem;
            setItems(updatedItems);
            setEditingIndex(null);
        } else {
            setItems([...items, currentItem as PrescriptionItem]);
        }

        // Reset item form
        setCurrentItem({ quantity: 1, sig: "", daysSupply: 30 });
        setDrugSearch("");
        setErrors({});
        setDrugInventory(null);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleFormSubmit = async () => {
        if (!selectedPatient) {
            toast.error('Please select a patient');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one medication');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                patientId: selectedPatient.id,
                prescriberId: selectedPrescriber?.id,
                priority,
                source,
                items
            });
        } catch (e) {
            // Handled by parent
        } finally {
            setIsSubmitting(false);
        }
    };

    const sigTemplates = [
        "Take 1 tablet twice daily",
        "Take 1 tablet three times daily",
        "Take 1 capsule at bedtime",
        "Apply topically as needed"
    ];

    return (
        <div
            className="space-y-6 pb-20"
            onKeyDown={handleKeyDown}
        >
            {/* 1. Patient & Prescriber */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FiInfo className="w-4 h-4 text-teal-600" />
                    Patient & Prescriber
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Patient</label>
                        <PatientSearchSelect
                            onSelect={setSelectedPatient}
                            selectedPatient={selectedPatient}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Prescriber</label>
                        <PrescriberSelect
                            selectedPrescriber={selectedPrescriber}
                            onSelect={setSelectedPrescriber}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {['Normal', 'Urgent'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p as any)}
                                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${priority === p
                                        ? p === 'Urgent' ? 'bg-red-500 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                        <select
                            value={source}
                            onChange={(e) => setSource(e.target.value as any)}
                            className="w-full text-sm border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 bg-gray-50"
                        >
                            <option value="manual">Manual Entry</option>
                            <option value="e-Rx">E-Prescription</option>
                            <option value="fax">Fax / Scan</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. Medication Entry */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <FiPackage className="w-4 h-4 text-purple-600" />
                    Add Medication
                </h3>

                {/* Drug Search */}
                <div className="relative">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Drug Name</label>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={currentItem.drugName || drugSearch}
                            onChange={(e) => {
                                setDrugSearch(e.target.value);
                                setCurrentItem(prev => ({ ...prev, drugId: undefined, drugName: undefined }));
                            }}
                            placeholder="Type to search drugs..."
                            className={`w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.drug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                        />
                        {searchingDrugs && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    {/* Search Results Dropdown */}
                    {showDrugResults && drugResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                            {drugResults.map(drug => (
                                <div
                                    key={drug.id}
                                    onClick={() => handleSelectDrug(drug)}
                                    className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0"
                                >
                                    <div className="font-medium text-sm text-gray-900">{drug.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span>{drug.manufacturer || 'Generic'}</span>
                                        {drug.isControlled && (
                                            <span className="bg-amber-100 text-amber-700 px-1.5 rounded font-bold text-[10px]">C</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {currentItem.drugId && (
                    <div className="animate-fade-in space-y-4">
                        {/* Batch Selection */}
                        {drugInventory && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-blue-800">Select Batch (FEFO)</span>
                                    <span className="text-xs text-blue-600">Total Stock: {drugInventory.total}</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {drugInventory.batches.map(batch => (
                                        <button
                                            key={batch.id}
                                            onClick={() => handleSelectBatch(batch)}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded border text-xs text-left transition-all ${currentItem.batchId === batch.id
                                                ? 'bg-white border-blue-500 ring-1 ring-blue-500 text-blue-900 shadow-sm'
                                                : 'bg-white/50 border-blue-200 text-blue-700 hover:bg-white'
                                                }`}
                                        >
                                            <div className="font-bold">{batch.batchNumber}</div>
                                            <div className="text-[10px]">Exp: {new Date(batch.expiryDate).toLocaleDateString()}</div>
                                            <div className="font-mono mt-0.5">Qty: {batch.quantityInStock}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={currentItem.quantity || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                                    className={`w-full text-sm border rounded-lg py-2 px-3 ${errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                                {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Days Supply</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={currentItem.daysSupply || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, daysSupply: parseInt(e.target.value) || 0 })}
                                    className={`w-full text-sm border rounded-lg py-2 px-3 ${errors.daysSupply ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Sig (Instructions)</label>
                            <div className="relative">
                                <textarea
                                    value={currentItem.sig || ''}
                                    onChange={(e) => setCurrentItem({ ...currentItem, sig: e.target.value })}
                                    placeholder="e.g. Take 1 tablet daily..."
                                    rows={2}
                                    className={`w-full text-sm border rounded-lg py-2 px-3 ${errors.sig ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {sigTemplates.map((template, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentItem({ ...currentItem, sig: template })}
                                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded border border-gray-200"
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddItem}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                            {editingIndex !== null ? <FiCheck className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                            {editingIndex !== null ? 'Update Medication' : 'Add Medication'}
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Items List */}
            {items.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Added Items ({items.length})</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {items.map((item, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50 flex items-start group">
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                        {item.drugName}
                                        {item.isControlled && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">C</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Qty: <span className="font-medium text-gray-700">{item.quantity}</span> • Days: {item.daysSupply}
                                    </div>
                                    <div className="text-xs text-gray-600 italic mt-1">"{item.sig}"</div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setCurrentItem(item);
                                            setEditingIndex(idx);
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                        <FiInfo className="w-3 h-3" /> {/* Using Info icon as edit for now */}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveItem(idx)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <FiTrash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions Footer */}
            <div className="fixed bottom-0 right-0 w-full md:w-[60%] lg:w-[calc(100%-40%)] bg-white border-t border-gray-200 p-4 shadow-lg z-20 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 font-semibold text-sm hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleFormSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-sm shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <FiSave className="w-4 h-4" />
                    )}
                    Save Prescription
                </button>
            </div>
        </div>
    );
};

export default PrescriptionForm;
