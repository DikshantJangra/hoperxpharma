'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/api/client';
import ReceivingTable from '@/components/grn/ReceivingTable';
import CompletionSummary from '@/components/grn/CompletionSummary';
import AttachmentUploader from '@/components/orders/AttachmentUploader';
import ValidationModal from '@/components/grn/ValidationModal';
import { HiOutlineArrowLeft, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import { toast } from 'sonner';

export default function ReceiveShipmentPage() {
    const params = useParams();
    const router = useRouter();
    const poId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [grn, setGrn] = useState<any>(null);
    const [po, setPO] = useState<any>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [showValidationModal, setShowValidationModal] = useState(false);

    // Invoice details
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [notes, setNotes] = useState('');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    useEffect(() => {
        initializeGRN();
    }, [poId]);

    // Populate invoice details from GRN when it loads
    useEffect(() => {
        if (grn) {
            if (grn.supplierInvoiceNo) setInvoiceNo(grn.supplierInvoiceNo);
            if (grn.supplierInvoiceDate) {
                // Convert ISO date to YYYY-MM-DD format for input
                const date = new Date(grn.supplierInvoiceDate);
                const formattedDate = date.toISOString().split('T')[0];
                setInvoiceDate(formattedDate);
            }
            if (grn.notes) setNotes(grn.notes);
        }
    }, [grn]);

    // Auto-save every 30 seconds if there are changes
    useEffect(() => {
        if (!grn) return;

        const autoSaveInterval = setInterval(() => {
            handleSaveDraft(true);
        }, 30000); // 30 seconds

        return () => clearInterval(autoSaveInterval);
    }, [grn, invoiceNo, invoiceDate, notes]);

    const initializeGRN = async () => {
        setLoading(true);
        try {
            const token = tokenManager.getAccessToken();

            // Create GRN from PO
            const response = await fetch(`${apiBaseUrl}/grn`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ poId })
            });

            if (response.ok) {
                const result = await response.json();
                setGrn(result.data);

                // Set PO from GRN response if available, otherwise fetch it
                if (result.data.po && result.data.po.items) {
                    setPO(result.data.po);
                } else {
                    // Fallback: fetch PO details separately
                    try {
                        const poResponse = await fetch(`${apiBaseUrl}/purchase-orders/${poId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (poResponse.ok) {
                            const poResult = await poResponse.json();
                            setPO(poResult.data);
                        } else {
                            console.error('Failed to fetch PO details');
                        }
                    } catch (poError) {
                        console.error('Error fetching PO:', poError);
                    }
                }

                setLastSaved(new Date());
            } else {
                const errorData = await response.json();
                console.error('Failed to initialize GRN:', errorData);
                alert(`Failed to initialize GRN: ${errorData.message || errorData.error || 'Unknown error'}`);
                router.push('/orders/pending');
            }
        } catch (error) {
            console.error('Error initializing GRN:', error);
            alert(`Error initializing GRN: ${error instanceof Error ? error.message : 'Unknown error'}`);
            router.push('/orders/pending');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async (isAutoSave = false) => {
        if (isAutoSave) {
            setAutoSaving(true);
        } else {
            setSaving(true);
        }

        try {
            const token = tokenManager.getAccessToken();

            const payload: any = { status: 'IN_PROGRESS' };
            if (invoiceNo) payload.supplierInvoiceNo = invoiceNo;
            if (invoiceDate) payload.supplierInvoiceDate = new Date(invoiceDate).toISOString();
            if (notes) payload.notes = notes;

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setLastSaved(new Date());
                if (!isAutoSave) {
                    toast.success('Draft saved successfully!');
                }
            } else {
                const error = await response.json();
                if (!isAutoSave) {
                    toast.error(error.error || error.message || 'Failed to save');
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            if (!isAutoSave) {
                toast.error('Failed to save draft');
            }
        } finally {
            if (isAutoSave) {
                setAutoSaving(false);
            } else {
                setSaving(false);
            }
        }
    };

    const handleItemUpdate = async (itemId: string, updates: any) => {
        // Optimistic update
        setGrn((prevGrn: any) => {
            if (!prevGrn) return null;

            const updatedItems = prevGrn.items.map((item: any) => {
                if (item.id === itemId) {
                    const newItem = { ...item, ...updates };

                    // Recalculate line total if quantity or price changed
                    // Note: This is a simple client-side calc, backend does authoritative calc
                    if (updates.receivedQty !== undefined || updates.freeQty !== undefined || updates.unitPrice !== undefined) {
                        // Basic total update for UI responsiveness
                        // Real totals come from backend response
                    }
                    return newItem;
                }
                return item;
            });

            return { ...prevGrn, items: updatedItems };
        });

        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/items/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                // Background refresh to get accurate totals/tax from backend
                // Debounce this if needed, but for now just let it sync
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
            }
        } catch (error) {
            console.error('Error updating item:', error);
            // Revert on error would be ideal, but for now just log
        }
    };

    const handleBatchSplit = async (itemId: string, splitData: any[]) => {
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/items/${itemId}/split`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ splitData })
            });

            if (response.ok) {
                // Refresh GRN data
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
            }
        } catch (error) {
            console.error('Error splitting batch:', error);
        }
    };

    const handleDiscrepancy = async (itemId: string, discrepancyData: any) => {
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/discrepancies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(discrepancyData)
            });

            if (response.ok) {
                // Refresh GRN data
                const grnResponse = await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const grnData = await grnResponse.json();
                setGrn(grnData.data);
            }
        } catch (error) {
            console.error('Error recording discrepancy:', error);
        }
    };

    const validateGRN = () => {
        const errors: any[] = [];

        // Invoice validation
        if (!invoiceNo || invoiceNo.trim() === '') {
            errors.push({ field: 'invoiceNo', message: 'Supplier invoice number is required' });
        }
        if (!invoiceDate) {
            errors.push({ field: 'invoiceDate', message: 'Invoice date is required' });
        }

        // Item validation
        if (grn && grn.items) {
            grn.items.forEach((item: any) => {
                const drugName = getDrugName(item.drugId);

                if (!item.batchNumber || item.batchNumber.trim() === '') {
                    errors.push({
                        field: 'batchNumber',
                        message: 'Batch number is required',
                        itemId: item.id,
                        drugName
                    });
                }

                if (!item.expiryDate) {
                    errors.push({
                        field: 'expiryDate',
                        message: 'Expiry date is required',
                        itemId: item.id,
                        drugName
                    });
                } else {
                    const expiryDate = new Date(item.expiryDate);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (expiryDate < today) {
                        errors.push({
                            field: 'expiryDate',
                            message: 'Expiry date must be in the future',
                            itemId: item.id,
                            drugName
                        });
                    }
                }

                if (!item.mrp || item.mrp <= 0) {
                    errors.push({
                        field: 'mrp',
                        message: 'MRP must be greater than 0',
                        itemId: item.id,
                        drugName
                    });
                }
            });

            // At least one item must be received
            const totalReceived = grn.items.reduce((sum: number, item: any) => sum + (item.receivedQty || 0), 0);
            if (totalReceived === 0) {
                errors.push({ field: 'receivedQty', message: 'At least one item must be received (Received Qty > 0)' });
            }
        }

        return errors;
    };

    const getDrugName = (drugId: string) => {
        if (!po || !po.items) return 'Unknown';
        const poItem = po.items.find((pi: any) => pi.drugId === drugId);
        if (!poItem || !poItem.drug) return 'Unknown';
        return `${poItem.drug.name}${poItem.drug.strength ? ` ${poItem.drug.strength}` : ''}`;
    };

    const handleCompleteClick = () => {
        // Validate before showing summary
        const errors = validateGRN();
        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }
        // If validation passes, show summary
        setShowSummary(true);
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            const token = tokenManager.getAccessToken();

            const response = await fetch(`${apiBaseUrl}/grn/${grn.id}/complete`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplierInvoiceNo: invoiceNo,
                    supplierInvoiceDate: invoiceDate || null,
                    notes
                })
            });

            if (response.ok) {
                toast.success('Order received successfully!');
                setTimeout(() => router.push('/orders/received'), 1000);
            } else {
                const error = await response.json();
                toast.error(error.error || error.message || 'Failed to complete GRN');
            }
        } catch (error) {
            console.error('Error completing GRN:', error);
            toast.error('Failed to complete GRN');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this receiving process?')) {
            return;
        }

        try {
            const token = tokenManager.getAccessToken();

            await fetch(`${apiBaseUrl}/grn/${grn.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            router.push('/orders/pending');
        } catch (error) {
            console.error('Error cancelling GRN:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!grn || !po) {
        return null;
    }

    const formatCurrency = (amount: any) => {
        const num = Number(amount);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.push('/orders/pending')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <HiOutlineArrowLeft className="h-5 w-5" />
                    Back to Pending Orders
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Receive Shipment</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            PO: {po.poNumber} | Supplier: {po.supplier.name}
                            {lastSaved && (
                                <span className="ml-3 text-xs text-gray-400">
                                    {autoSaving ? 'Saving...' : `Last saved: ${lastSaved.toLocaleTimeString()}`}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSaveDraft(false)}
                            disabled={saving || autoSaving}
                            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={handleCompleteClick}
                            disabled={saving}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            <HiOutlineCheck className="h-5 w-5" />
                            {saving ? 'Completing...' : 'Complete Receiving'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Invoice Number
                        </label>
                        <input
                            type="text"
                            value={invoiceNo}
                            onChange={(e) => setInvoiceNo(e.target.value)}
                            onKeyDown={(e) => {
                                // Prevent slash from triggering search hotkey
                                if (e.key === '/') {
                                    e.stopPropagation();
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="INV/2024/001"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Invoice Date
                        </label>
                        <input
                            type="date"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received By
                        </label>
                        <input
                            type="text"
                            value={grn.receivedByUser ? `${grn.receivedByUser.firstName} ${grn.receivedByUser.lastName}` : grn.receivedBy}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Any additional notes about this shipment..."
                    />
                </div>
            </div>

            {/* Invoice Attachments */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice & Documents</h2>
                <AttachmentUploader
                    poId={grn?.id}
                    attachments={grn?.attachments || []}
                    apiEndpoint="grn-attachments"
                    onUpload={(attachment) => {
                        // Update GRN with new attachment
                        setGrn((prev: any) => ({
                            ...prev,
                            attachments: [...(prev.attachments || []), attachment]
                        }));
                    }}
                    onRemove={(attachmentId) => {
                        // Remove attachment from GRN
                        setGrn((prev: any) => ({
                            ...prev,
                            attachments: (prev.attachments || []).filter((att: any) => att.id !== attachmentId)
                        }));
                    }}
                />
            </div>

            {/* Receiving Table */}
            <ReceivingTable
                items={grn.items}
                poItems={po.items}
                onItemUpdate={handleItemUpdate}
                onBatchSplit={handleBatchSplit}
                onDiscrepancy={handleDiscrepancy}
            />

            {/* Summary Panel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div className="text-sm text-gray-600">Subtotal</div>
                        <div className="text-xl font-semibold text-gray-900">
                            ₹{formatCurrency(grn.subtotal)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Tax Amount</div>
                        <div className="text-xl font-semibold text-gray-900">
                            ₹{formatCurrency(grn.taxAmount)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-2xl font-bold text-emerald-600">
                            ₹{formatCurrency(grn.total)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Completion Summary Modal */}
            {showSummary && (
                <CompletionSummary
                    grn={grn}
                    po={po}
                    onConfirm={handleComplete}
                    onCancel={() => setShowSummary(false)}
                    saving={saving}
                />
            )}

            {/* Validation Modal */}
            {showValidationModal && (
                <ValidationModal
                    errors={validationErrors}
                    onClose={() => setShowValidationModal(false)}
                />
            )}

            {/* Completion Summary */}
            {showSummary && (
                <CompletionSummary
                    grn={grn}
                    po={po}
                    onConfirm={handleComplete}
                    onCancel={() => setShowSummary(false)}
                    saving={saving}
                />
            )}
        </div>
    );
}
