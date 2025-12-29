import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX, FiCheck, FiLock, FiEdit, FiTag, FiChevronDown, FiAlertCircle, FiPaperclip, FiFile } from 'react-icons/fi';
import { RiCapsuleLine } from 'react-icons/ri';
import { inventoryApi } from '@/lib/api/inventory';
import PatientSearchSelect from '@/components/prescriptions/PatientSearchSelect';
import PrescriberSelect from './PrescriberSelect';
import BatchModal from '@/components/pos/BatchModal';
import toast from 'react-hot-toast';

// Types
interface MedicationDraft {
    tempId: string;
    drugId: string;
    name: string;
    form: string;
    strength?: string;

    // POS Inventory Fields
    batchId: string;
    batchNumber: string;
    batchCount?: number;
    expiryDate: string;
    location?: string;
    totalStock: number;
    mrp: number;
    gstRate: number;
    requiresPrescription?: boolean;
    manufacturer?: string;

    // Prescription Fields
    frequencyPerDay: number;
    days: number;
    quantity: number;
    sig: string;
    refillsAllowed: number;
}

interface PrescriptionFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    prescription?: any | null; // For editing existing prescriptions
}

interface MedicationRowProps {
    medication: MedicationDraft;
    locked: boolean;
    onUpdate: (tempId: string, updates: Partial<MedicationDraft>) => void;
    onRemove: (tempId: string) => void;
    onChangeBatch?: (medicationIndex: number) => void;
}

const generateSig = (frequencyPerDay: number): string => {
    const freqMap: Record<number, string> = {
        1: 'once daily',
        2: 'twice daily',
        3: 'three times daily',
        4: 'four times daily'
    };
    return `Take 1 tablet ${freqMap[frequencyPerDay] || `${frequencyPerDay} times daily`}`;
};

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSubmit, onCancel, prescription }) => {
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [prescriber, setPrescriper] = useState<any>(null);
    const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
    const [source, setSource] = useState<'MANUAL' | 'SCAN' | 'ERX'>('MANUAL');
    const [medications, setMedications] = useState<MedicationDraft[]>([]);
    const [clinicalNote, setClinicalNote] = useState('');
    const [status, setStatus] = useState<'UNSAVED' | 'DRAFT' | 'VERIFIED'>('UNSAVED');
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<any[]>([]); // For showing existing files when editing
    const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);

    const [drugSearch, setDrugSearch] = useState('');
    const [drugResults, setDrugResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Batch Modal State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [pendingDrug, setPendingDrug] = useState<any>(null);
    const [editingMedIndex, setEditingMedIndex] = useState<number | null>(null);

    const patientLocked = medications.length > 0;

    const validation = {
        patient: !!patient,
        prescriber: !!prescriber,
        medications: medications.length > 0
    };
    const canVerify = validation.patient && validation.prescriber && validation.medications;

    // Search using inventoryApi.searchForPOS (batch-aware)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (drugSearch.length >= 2) {
                setIsSearching(true);
                try {
                    const response = await inventoryApi.searchForPOS(drugSearch);

                    // Handle both response formats:
                    // 1. Direct array from backend: [{ id, name, ... }]
                    // 2. Wrapped object: { success: true, data: [...] }
                    let resultsData: any[] = [];

                    if (Array.isArray(response)) {
                        // Direct array response
                        resultsData = response;
                    } else if (response && typeof response === 'object' && response.success) {
                        // Wrapped response
                        resultsData = response.data || [];
                    }

                    setDrugResults(resultsData);
                    setShowResults(resultsData.length > 0);
                    setSelectedSearchIndex(0); // Reset selection
                } catch (error) {
                    console.error('Search error:', error);
                    setDrugResults([]);
                    setShowResults(false);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setDrugResults([]);
                setShowResults(false);
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [drugSearch]);

    // Load prescription data for editing
    useEffect(() => {
        if (prescription) {
            setEditingPrescriptionId(prescription.id);

            // Load patient
            if (prescription.patient) {
                setPatient(prescription.patient);
            }

            // Load prescriber
            if (prescription.prescriber) {
                setPrescriper(prescription.prescriber);
            }

            // Load priority and source
            setPriority(prescription.priority || 'NORMAL');
            setSource(prescription.source || 'MANUAL');

            if (prescription.versions?.[0]?.instructions) {
                setClinicalNote(prescription.versions[0].instructions);
                setShowNoteInput(true);
            }

            // Load existing files
            if (prescription.files && prescription.files.length > 0) {
                setExistingFiles(prescription.files);
            }

            // Load medications with refills from prescription.items
            if (prescription.items && prescription.items.length > 0) {
                const loadedMeds: MedicationDraft[] = prescription.items.map((item: any) => ({
                    tempId: `existing-${item.id}`,
                    drugId: item.drugId,
                    name: item.drug?.name || 'Unknown',
                    form: item.drug?.form || '',
                    strength: item.drug?.strength,
                    batchId: item.batchId || '',
                    batchNumber: item.batch?.batchNumber || '',
                    expiryDate: item.batch?.expiryDate || '',
                    location: item.batch?.location || '',
                    totalStock: item.batch?.quantityInStock || 0,
                    mrp: item.batch?.mrp || 0,
                    gstRate: item.drug?.gstRate || 0,
                    requiresPrescription: item.drug?.requiresPrescription || false,
                    manufacturer: item.drug?.manufacturer || '',
                    quantity: item.quantityPrescribed || 0,
                    sig: item.sig || '',
                    daysSupply: item.daysSupply || 0,
                    frequencyPerDay: 1,
                    refillsAllowed: item.refillsAllowed || 0
                }));

                setMedications(loadedMeds);
            }
        }
    }, [prescription]);

    // Keyboard navigation for search
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || drugResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSearchIndex(prev => Math.min(prev + 1, drugResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSearchIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (drugResults[selectedSearchIndex]) {
                addMedication(drugResults[selectedSearchIndex]);
            }
        } else if (e.key === 'Escape') {
            setDrugSearch('');
            setShowResults(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add medication with batch handling (POS-style)
    const addMedication = (drug: any) => {
        // If multiple batches and no specific batch selected, show modal
        if ((drug.batchCount > 1 || drug.batches > 1) && !drug.batchId) {
            setPendingDrug(drug);
            setShowBatchModal(true);
            return;
        }

        // Validate batch exists
        if (!drug.batchId) {
            toast.error('Batch information missing. Please select a batch.');
            return;
        }

        // Check for duplicates (same drug + same batch)
        const existingIndex = medications.findIndex(m =>
            m.drugId === drug.id && m.batchId === drug.batchId
        );

        if (existingIndex >= 0) {
            // Increment quantity instead of adding duplicate
            const existing = medications[existingIndex];
            const newQty = existing.quantity + 1;

            if (newQty > existing.totalStock) {
                toast.error(`Only ${existing.totalStock} units available in stock!`);
                return;
            }

            updateMedication(existing.tempId, { quantity: newQty });
            toast.success(`Increased quantity of ${drug.name}`);
        } else {
            // Add new medication
            const newMed: MedicationDraft = {
                tempId: `${Date.now()}-${Math.random()}`,
                drugId: drug.id,
                name: drug.name,
                form: drug.form || 'Tablet',
                strength: drug.strength,

                // POS Inventory fields
                batchId: drug.batchId,
                batchNumber: drug.batchNumber,
                batchCount: drug.batchCount || drug.batches || 1,
                expiryDate: drug.expiryDate,
                location: drug.location,
                totalStock: drug.totalStock || drug.stock || 0,
                mrp: drug.mrp || 0,
                gstRate: drug.gstRate || 5,
                requiresPrescription: drug.requiresPrescription,
                manufacturer: drug.manufacturer,

                // Prescription defaults
                frequencyPerDay: 2,
                days: 5,
                quantity: 1,
                sig: generateSig(2),
                refillsAllowed: 0
            };

            setMedications([...medications, newMed]);
            toast.success(`${drug.name} added`);
        }

        // Clear search and close dropdown
        setDrugSearch('');
        setShowResults(false);
        setSelectedSearchIndex(0);
        // Don't auto-focus to avoid disrupting user flow
    };

    const updateMedication = (tempId: string, updates: Partial<MedicationDraft>) => {
        setMedications(meds => meds.map(m => {
            if (m.tempId === tempId) {
                const updated = { ...m, ...updates };

                // Update Sig when frequency changes (only auto-update)
                if ('frequencyPerDay' in updates) {
                    updated.sig = generateSig(updated.frequencyPerDay);
                }

                // All fields (Qty, Frequency, Days) are independent - no auto-calculations

                return updated;
            }
            return m;
        }));
    };

    // Handle batch selection from modal
    const handleBatchSelect = (batch: any) => {
        if (editingMedIndex !== null) {
            // Updating existing medication's batch
            const med = medications[editingMedIndex];
            updateMedication(med.tempId, {
                batchId: batch.batchId || batch.id,
                batchNumber: batch.batchNumber,
                totalStock: batch.qty,
                expiryDate: batch.expiryDate,
                location: batch.location,
                mrp: batch.mrp,
                quantity: Math.min(med.quantity, batch.qty) // Cap quantity to new stock
            });
            setEditingMedIndex(null);
        } else if (pendingDrug) {
            // Adding new medication with selected batch
            addMedication({
                ...pendingDrug,
                batchId: batch.batchId || batch.id,
                batchNumber: batch.batchNumber,
                totalStock: batch.qty,
                expiryDate: batch.expiryDate,
                location: batch.location,
                mrp: batch.mrp
            });
        }

        setShowBatchModal(false);
        setPendingDrug(null);
    };

    const removeMedication = (tempId: string) => {
        setMedications(meds => meds.filter(m => m.tempId !== tempId));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            setAttachedFiles(prev => [...prev, ...newFiles]);
            toast.success(`${newFiles.length} file(s) attached`);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
        toast.success('File removed');
    };

    const handlePatientChange = (newPatient: any) => {
        if (patientLocked && medications.length > 0) {
            if (confirm('Changing patient will reset all medications. Continue?')) {
                setPatient(newPatient);
                setMedications([]);
            }
        } else {
            setPatient(newPatient);
        }
    };

    const handleSaveDraft = async () => {
        if (!patient || medications.length === 0) {
            toast.error('Add patient and medications');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert medications to backend format
            const items = medications.map(med => ({
                drugId: med.drugId,
                batchId: med.batchId,
                quantity: med.quantity,
                sig: med.sig,
                daysSupply: med.days,
                substitutionAllowed: true,
                isControlled: false,
                refillsAllowed: med.refillsAllowed || 0
            }));

            // Calculate total refills from max refills across all medications
            const totalRefills = medications.length > 0 ? Math.max(...medications.map(m => m.refillsAllowed || 0)) : 0;



            // Create FormData for file upload
            const formData = new FormData();

            // Append files
            attachedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Append other data (DON'T send storeId - backend gets it from middleware)
            // If editing, include prescription ID so backend updates instead of creates
            if (editingPrescriptionId) {
                formData.append('prescriptionId', editingPrescriptionId);
            }
            formData.append('patientId', patient.id);
            if (prescriber?.id) {
                formData.append('prescriberId', prescriber.id);
            }
            formData.append('priority', priority);
            formData.append('source', source);
            formData.append('items', JSON.stringify(items));
            formData.append('instructions', clinicalNote || '');
            formData.append('totalRefills', totalRefills.toString());
            formData.append('status', 'DRAFT');

            const response = await onSubmit(formData);
            toast.success('Draft saved successfully!');
            setStatus('DRAFT');
        } catch (error) {
            toast.error('Failed to save draft');
            console.error('Save draft error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerify = async () => {
        if (!patient || medications.length === 0 || !prescriber) {
            toast.error('Add patient, medications, and prescriber');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert medications to backend format
            const items = medications.map(med => ({
                drugId: med.drugId,
                batchId: med.batchId,
                quantity: med.quantity,
                sig: med.sig,
                daysSupply: med.days,
                substitutionAllowed: true,
                isControlled: false,
                refillsAllowed: med.refillsAllowed || 0
            }));

            // Calculate total refills from max refills across all medications
            const totalRefills = Math.max(...medications.map(m => m.refillsAllowed || 0));

            // Create FormData for file upload
            const formData = new FormData();

            // Append files
            attachedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Append other data (DON'T send storeId - backend gets it from middleware)
            // If editing, include prescription ID so backend updates instead of creates
            if (editingPrescriptionId) {
                formData.append('prescriptionId', editingPrescriptionId);
            }
            formData.append('patientId', patient.id);
            formData.append('prescriberId', prescriber.id);
            formData.append('priority', priority);
            formData.append('source', source);
            formData.append('items', JSON.stringify(items));
            formData.append('instructions', clinicalNote || '');
            formData.append('totalRefills', totalRefills.toString());
            formData.append('status', 'VERIFIED');

            console.log('Verifying prescription with FormData:', {
                itemCount: items.length,
                totalRefills,
                filesCount: attachedFiles.length,
                sampleItem: items[0]
            });

            const response = await onSubmit(formData) as any;

            if (response?.success) {
                const prescriptionId = response.data?.id || editingPrescriptionId;

                toast.success('Prescription verified! Redirecting to checkout...');
                setStatus('VERIFIED');

                // Redirect to POS with prescription pre-loaded (Simple Mode behavior)
                setTimeout(() => {
                    router.push(`/pos/new-sale?prescriptionId=${prescriptionId}`);
                }, 1000);
            } else {
                toast.success('Prescription verified!');
                setStatus('VERIFIED');
            }
        } catch (error) {
            toast.error('Failed to verify prescription');
            console.error('Verify error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full bg-gray-50 flex">
            {/* LEFT COLUMN: Clinical Context - TYPOGRAPHY BASED, NO CARDS */}
            <div className="w-72 bg-white border-r border-gray-200 p-5 space-y-6 overflow-y-auto flex-shrink-0">
                {/* Patient */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">PATIENT</h3>
                    {patient ? (
                        <div>
                            <p className="font-bold text-base text-gray-900">{patient.firstName} {patient.lastName}</p>
                            <p className="text-xs text-gray-600 mt-0.5">📞 {patient.phoneNumber}</p>
                            {patientLocked && (
                                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                                    <FiLock className="w-3 h-3" />
                                    Locked
                                </p>
                            )}
                            {patient.allergies && patient.allergies.length > 0 && (
                                <div className="mt-2 pl-2 border-l-2 border-red-500">
                                    <p className="text-[10px] font-bold text-red-900 uppercase">⚠️ Allergies</p>
                                    <p className="text-xs text-red-700 leading-tight">{patient.allergies.join(', ')}</p>
                                </div>
                            )}
                            {!patientLocked && (
                                <button
                                    onClick={() => handlePatientChange(null)}
                                    disabled={status === 'VERIFIED'}
                                    className="text-[10px] text-blue-600 hover:underline mt-1.5 disabled:opacity-50"
                                >
                                    Change
                                </button>
                            )}
                        </div>
                    ) : (
                        <PatientSearchSelect onSelect={setPatient} selectedPatient={null} />
                    )}
                </div>

                {/* Prescriber */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">PRESCRIBER</h3>
                    {prescriber ? (
                        <div>
                            <p className="font-bold text-sm text-gray-900">
                                {(() => {
                                    const fullName = `${prescriber.firstName || ''} ${prescriber.lastName || prescriber.name || ''}`.trim();
                                    const alreadyHasDr = fullName.toLowerCase().startsWith('dr.');
                                    const displayName = alreadyHasDr ? fullName : `Dr. ${fullName}`;
                                    return `${displayName} ${prescriber.qualification ? `(${prescriber.qualification})` : ''}`.trim();
                                })()}
                            </p>
                            <button
                                onClick={() => setPrescriper(null)}
                                disabled={status === 'VERIFIED'}
                                className="text-[10px] text-blue-600 hover:underline mt-1.5 disabled:opacity-50"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <PrescriberSelect selectedPrescriber={null} onSelect={setPrescriper} />
                    )}
                </div>

                {/* Meta - Clean divider */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    {/* Attachments */}
                    <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">ATTACHMENTS</h3>
                        <div className="space-y-1.5">
                            {/* Existing files from prescription */}
                            {existingFiles.map((file, index) => {
                                // Extract filename from URL and clean it up
                                let fileName = file.fileUrl.split('/').pop()?.split('?')[0] || '';

                                // If it's a UUID filename, show a user-friendly name instead
                                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(fileName);
                                if (isUUID || !fileName) {
                                    // Get file extension
                                    const ext = fileName.split('.').pop() || 'file';
                                    fileName = `Prescription Document ${index + 1}.${ext}`;
                                }

                                return (
                                    <div key={`existing-${index}`} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <FiFile className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                            <span className="text-[10px] text-blue-700 truncate" title={fileName}>
                                                {fileName}
                                            </span>
                                        </div>
                                        <a
                                            href={file.fileUrl}
                                            target="__blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:text-blue-700 text-[9px] underline"
                                        >
                                            View
                                        </a>
                                    </div>
                                );
                            })}

                            {/* Newly attached files */}
                            {attachedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1.5">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <FiFile className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <span className="text-[10px] text-gray-700 truncate" title={file.name}>
                                            {file.name}
                                        </span>
                                        <span className="text-[9px] text-gray-400 flex-shrink-0">
                                            ({(file.size / 1024).toFixed(1)}KB)
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        disabled={status === 'VERIFIED'}
                                        className="text-gray-400 hover:text-red-500 p-0.5 disabled:opacity-50"
                                    >
                                        <FiX className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className={`flex items-center gap-1.5 px-2 py-1.5 border border-dashed border-gray-300 rounded text-[10px] text-gray-500 hover:border-teal-500 hover:text-teal-600 transition-colors ${status === 'VERIFIED' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                }`}>
                                <FiPaperclip className="w-3 h-3" />
                                {attachedFiles.length === 0 ? 'Attach prescription scan/image' : 'Add more files'}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    disabled={status === 'VERIFIED'}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Priority & Source */}
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Priority:</span>
                        <div className="flex gap-1">
                            {(['NORMAL', 'URGENT'] as const).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    disabled={status === 'VERIFIED'}
                                    className={`px-1.5 py-0.5 text-[10px] font-bold uppercase transition ${priority === p
                                        ? p === 'URGENT' ? 'text-red-700 bg-red-50' : 'text-gray-900 bg-gray-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        } rounded disabled:opacity-50`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Source:</span>
                        <span className="font-medium text-gray-900">{source}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-semibold ${status === 'VERIFIED' ? 'text-green-600' :
                            status === 'DRAFT' ? 'text-blue-600' :
                                'text-gray-400'
                            }`}>
                            {status === 'UNSAVED' ? 'Unsaved' : status}
                        </span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Medication Builder - FULL HEIGHT */}
            <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* Search - Reduced noise */}
                <div className="border-b border-gray-100 p-3">
                    <div className="relative max-w-2xl mx-auto w-full">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={drugSearch}
                            onChange={(e) => setDrugSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="/ Search medication...   ↵ to add"
                            disabled={status === 'VERIFIED'}
                            className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all disabled:opacity-50 placeholder-gray-400"
                        />

                        {showResults && drugResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 max-h-80 overflow-y-auto ring-1 ring-black ring-opacity-5">
                                {drugResults.map((drug, i) => (
                                    <div
                                        key={`${drug.id}-${drug.batchId || i}`}
                                        onClick={() => addMedication(drug)}
                                        className={`p-3 hover:bg-teal-50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors ${i === selectedSearchIndex ? 'bg-teal-50 border-l-2 border-l-teal-500' : i === 0 && selectedSearchIndex !== 0 ? 'bg-gray-50' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="font-semibold text-sm text-gray-900 group-hover:text-teal-700">
                                                    {drug.name}
                                                    {drug.strength && <span className="font-normal text-gray-500"> • {drug.strength}</span>}
                                                    {drug.form && <span className="font-normal text-gray-500"> • {drug.form}</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                    <span>{drug.manufacturer || 'Generic'}</span>
                                                    <span>•</span>
                                                    <span className="font-mono bg-gray-100 px-1 rounded text-gray-600">
                                                        Batch: {drug.batchNumber || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="font-semibold text-sm text-gray-900">₹{drug.mrp || 0}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Stock: <span className={drug.totalStock > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                                                        {drug.totalStock || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Medication List - Compressed, fills remaining space */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-gray-50/50">
                    {medications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 py-4">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                <RiCapsuleLine className="w-6 h-6 opacity-20" />
                            </div>
                            <p className="text-[10px] font-medium text-gray-400">No medications added</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">Search above to begin prescription</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto w-full space-y-2">
                            {medications.map((med, index) => (
                                <MedicationRow
                                    key={med.tempId}
                                    medication={med}
                                    locked={status === 'VERIFIED'}
                                    onUpdate={updateMedication}
                                    onRemove={removeMedication}
                                    onChangeBatch={() => {
                                        console.log('onChangeBatch triggered for:', med.name);
                                        console.log('Medication data:', {
                                            drugId: med.drugId,
                                            batchCount: med.batchCount,
                                            currentBatch: med.batchNumber
                                        });
                                        setEditingMedIndex(index);
                                        setPendingDrug({
                                            id: med.drugId,
                                            name: med.name,
                                            form: med.form,
                                            strength: med.strength,
                                            manufacturer: med.manufacturer
                                        });
                                        setShowBatchModal(true);
                                        console.log('BatchModal should be opening...');
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Area - Verification & Actions */}
                <div className="bg-white border-t border-gray-200 mt-auto">
                    {/* Optional Note - Inline */}
                    <div className="px-4 py-1.5 border-b border-gray-100">
                        {!showNoteInput ? (
                            <button
                                onClick={() => setShowNoteInput(true)}
                                disabled={status === 'VERIFIED'}
                                className="text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                <FiEdit className="w-3 h-3" />
                                Add clinical note (optional)
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <span className="text-[10px] text-gray-400 flex-shrink-0">Note:</span>
                                <input
                                    type="text"
                                    value={clinicalNote}
                                    onChange={(e) => setClinicalNote(e.target.value)}
                                    placeholder="Add clinical context or instructions..."
                                    disabled={status === 'VERIFIED'}
                                    autoFocus
                                    className="flex-1 border-0 border-b border-gray-200 focus:border-teal-500 focus:ring-0 text-xs py-1 px-0 bg-transparent placeholder-gray-300"
                                />
                                <button onClick={() => setShowNoteInput(false)} className="text-gray-400 hover:text-red-500"><FiX className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>

                    <div className="p-3">
                        {/* Verification Status - Minimal */}
                        <div className="flex items-center justify-center gap-6 mb-3">
                            <div className={`flex items-center gap-1.5 transition-colors duration-300 ${validation.patient ? 'text-teal-600' : 'text-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${validation.patient ? 'bg-teal-600' : 'bg-gray-300'}`} />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Patient</span>
                            </div>
                            <div className="w-8 h-px bg-gray-100" />
                            <div className={`flex items-center gap-1.5 transition-colors duration-300 ${validation.prescriber ? 'text-teal-600' : 'text-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${validation.prescriber ? 'bg-teal-600' : 'bg-gray-300'}`} />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Prescriber</span>
                            </div>
                            <div className="w-8 h-px bg-gray-100" />
                            <div className={`flex items-center gap-1.5 transition-colors duration-300 ${validation.medications ? 'text-teal-600' : 'text-gray-300'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${validation.medications ? 'bg-teal-600' : 'bg-gray-300'}`} />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Medication</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={onCancel}
                                className="px-4 py-1.5 text-gray-400 font-medium hover:text-gray-600 hover:bg-gray-50 rounded text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting || status === 'VERIFIED'}
                                    className="px-4 py-1.5 text-gray-600 font-medium rounded hover:bg-gray-100 disabled:opacity-50 text-xs transition-colors"
                                >
                                    Save Draft
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={isSubmitting || !canVerify || status === 'VERIFIED'}
                                    className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 text-xs shadow-sm transition-all transform active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <FiCheck className="w-3 h-3" />
                                    )}
                                    VERIFY & LOCK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Batch Selection Modal */}
            {showBatchModal && (
                <BatchModal
                    product={pendingDrug}
                    onSelect={handleBatchSelect}
                    onClose={() => {
                        setShowBatchModal(false);
                        setPendingDrug(null);
                        setEditingMedIndex(null);
                    }}
                />
            )}
        </div>
    );
};

const MedicationRow: React.FC<MedicationRowProps> = ({ medication, locked, onUpdate, onRemove, onChangeBatch }) => {
    const { tempId, name, form, strength, frequencyPerDay, days, quantity, sig, refillsAllowed, batchId, batchNumber, batchCount } = medication;
    const [editingSig, setEditingSig] = React.useState(false);
    const totalDispenses = refillsAllowed + 1;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition">
            {/* Header - tighter */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-gray-900">{name}</h4>
                        {medication.requiresPrescription && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-100 uppercase tracking-wide">
                                <FiTag className="w-3 h-3" />RX
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5">{form}{strength && ` • ${strength}`}</p>

                    {/* POS Badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {/* Batch - Clickable if multiple batches */}
                        <button
                            onClick={() => {
                                console.log('Batch clicked:', { batchCount, locked, batchNumber });
                                if (batchCount && batchCount > 1 && !locked) {
                                    onChangeBatch?.(0);
                                }
                            }}
                            disabled={locked || !batchCount || batchCount <= 1}
                            type="button"
                            className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium transition-all ${!batchId
                                ? 'bg-red-50 border-red-100 text-red-700'
                                : batchCount && batchCount > 1 && !locked
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-100 cursor-pointer shadow-sm'
                                    : 'bg-gray-50 border-gray-100 text-gray-600'
                                }`}
                        >
                            <span className="opacity-70">Batch:</span>
                            <span className="font-mono font-bold">{batchNumber || 'N/A'}</span>
                            {batchCount && batchCount > 1 && !locked && (
                                <FiChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                        </button>

                        {/* Stock Availability */}
                        {medication.totalStock !== undefined && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium ${medication.totalStock === 0
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : medication.totalStock <= 10
                                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                                    : 'bg-green-50 border-green-200 text-green-700'
                                }`}>
                                <span className="opacity-70">Stock:</span>
                                <span className="font-bold">{medication.totalStock}</span>
                                <span className="opacity-70">units</span>
                            </div>
                        )}

                        {/* Expiry */}
                        {medication.expiryDate && (
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-medium ${new Date(medication.expiryDate) < new Date()
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-blue-50 border-blue-100 text-blue-700'
                                }`}>
                                <span className="opacity-70">Exp:</span>
                                <span>{new Date(medication.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}</span>
                            </div>
                        )}

                        {/* Location */}
                        {medication.location && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-50 border border-yellow-100 rounded text-[10px] text-yellow-700 font-medium">
                                <span className="opacity-70">Loc:</span>
                                <span>{medication.location}</span>
                            </div>
                        )}

                        {/* Stock Warning */}
                        {medication.totalStock !== undefined && quantity > medication.totalStock && (
                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[10px] text-red-600 font-bold animate-pulse">
                                <FiAlertCircle className="w-3 h-3" />
                                Only {medication.totalStock} available!
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => onRemove(tempId)}
                    disabled={locked}
                    className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                >
                    <FiX className="w-4 h-4" />
                </button>
            </div>

            {/* Controls - ONE TIGHT ROW */}
            <div className="flex items-center gap-2 mb-2">
                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5">Qty</label>
                    <input
                        type="number"
                        min="1"
                        value={quantity || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            // Remove leading zeros and parse
                            const num = val === '' ? 0 : parseInt(val.replace(/^0+/, '') || '0');
                            onUpdate(tempId, { quantity: num });
                        }}
                        disabled={locked}
                        className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs disabled:bg-gray-100"
                    />
                </div>

                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 block mb-0.5">Frequency</label>
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map(freq => (
                            <button
                                key={freq}
                                onClick={() => onUpdate(tempId, { frequencyPerDay: freq })}
                                disabled={locked}
                                className={`px-2 py-1 text-[10px] font-bold rounded transition ${frequencyPerDay === freq
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    } disabled:opacity-50`}
                            >
                                {['OD', 'BD', 'TDS', 'QID'][freq - 1]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-gray-500 block mb-0.5" title="How many days the patient should take this medication">
                        Days <span className="text-gray-400">(How long to take)</span>
                    </label>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={days === 0 ? '' : days}
                            onChange={(e) => {
                                const val = e.target.value;
                                // Remove leading zeros
                                const cleaned = val.replace(/^0+/, '') || '0';
                                onUpdate(tempId, { days: parseInt(cleaned) || 0 });
                            }}
                            disabled={locked}
                            className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs disabled:bg-gray-100"
                        />
                        {/* Quick fill buttons */}
                        {!locked && (
                            <div className="flex gap-0.5">
                                {[3, 5, 7, 10, 15, 30].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => onUpdate(tempId, { days: d })}
                                        className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-700 rounded transition-colors"
                                        type="button"
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions - Editable */}
            <div className="mb-2">
                <label className="text-[10px] text-gray-500 block mb-0.5">Instructions (Sig)</label>
                {editingSig || !sig ? (
                    <input
                        type="text"
                        value={sig}
                        onChange={(e) => onUpdate(tempId, { sig: e.target.value })}
                        onBlur={() => setEditingSig(false)}
                        placeholder="e.g., Take 1 tablet twice daily after meals"
                        disabled={locked}
                        autoFocus
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100"
                    />
                ) : (
                    <div
                        onClick={() => !locked && setEditingSig(true)}
                        className={`text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded ${!locked ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    >
                        {sig}
                    </div>
                )}
            </div>

            {/* Refill - compact */}
            <div className="border-t border-gray-100 pt-2">
                <div className="flex items-center gap-3 mb-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="radio"
                            checked={refillsAllowed === 0}
                            onChange={() => onUpdate(tempId, { refillsAllowed: 0 })}
                            disabled={locked}
                            className="w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">One-time</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                            type="radio"
                            checked={refillsAllowed > 0}
                            onChange={() => onUpdate(tempId, { refillsAllowed: 3 })}
                            disabled={locked}
                            className="w-3 h-3"
                        />
                        <span className="text-xs text-gray-700">Repeat</span>
                        {refillsAllowed > 0 && (
                            <>
                                <span className="text-xs text-gray-500">×</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={refillsAllowed}
                                    onChange={(e) => onUpdate(tempId, { refillsAllowed: parseInt(e.target.value) || 1 })}
                                    disabled={locked}
                                    className="w-12 px-1.5 py-0.5 border border-gray-300 rounded text-xs"
                                />
                            </>
                        )}
                    </label>
                </div>

                {/* Timeline dots */}
                {refillsAllowed > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-gray-400">Dispenses:</span>
                        {Array.from({ length: totalDispenses }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-green-600' : 'bg-gray-300'}`}
                            />
                        ))}
                        <span className="text-[10px] text-gray-400 ml-1">
                            (1 now + {refillsAllowed})
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrescriptionForm;