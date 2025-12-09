'use client';

import { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiTrash2, FiPackage } from 'react-icons/fi';
import { toast } from 'sonner';

interface DeleteInventoryModalProps {
    type: 'drug' | 'batch';
    item: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteInventoryModal({ type, item, onClose, onSuccess }: DeleteInventoryModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [impactData, setImpactData] = useState<any>(null);
    const [isLoadingImpact, setIsLoadingImpact] = useState(true);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        fetchDeletionImpact();
    }, []);

    const fetchDeletionImpact = async () => {
        try {
            setIsLoadingImpact(true);

            if (type === 'drug') {
                // Fetch all batches for this drug to show impact
                const { inventoryApi } = await import('@/lib/api/inventory');
                const response = await inventoryApi.getBatchesWithSuppliers(item.id);

                // response is the batches array directly because inventoryApi unwraps it
                if (Array.isArray(response)) {
                    const batches = response;
                    const totalStock = batches.reduce((sum: number, b: any) => sum + (b.quantityInStock || 0), 0);
                    const totalValue = batches.reduce((sum: number, b: any) =>
                        sum + ((b.quantityInStock || 0) * (b.purchasePrice || 0)), 0
                    );

                    setImpactData({
                        batchCount: batches.length,
                        totalStock,
                        totalValue,
                        batches: batches.slice(0, 5), // Show first 5 batches
                        allBatches: batches, // Store all batches for deletion
                        hasMore: batches.length > 5
                    });
                } else {
                    // Set empty data if API call fails
                    setImpactData({
                        batchCount: 0,
                        totalStock: 0,
                        totalValue: 0,
                        batches: [],
                        allBatches: []
                    });
                }
            } else {
                // For batch deletion, show single batch impact
                setImpactData({
                    batchCount: 1,
                    totalStock: item.quantityInStock || 0,
                    totalValue: (item.quantityInStock || 0) * (item.purchasePrice || 0),
                    batches: [item],
                    allBatches: [item]
                });
            }
        } catch (error) {
            console.error('Failed to fetch deletion impact:', error);
            toast.error('Failed to load deletion impact');
            // Set minimal data to allow deletion to proceed
            setImpactData({
                batchCount: type === 'drug' ? 0 : 1,
                totalStock: type === 'drug' ? 0 : (item.quantityInStock || 0),
                totalValue: type === 'drug' ? 0 : ((item.quantityInStock || 0) * (item.purchasePrice || 0)),
                batches: type === 'drug' ? [] : [item],
                allBatches: type === 'drug' ? [] : [item]
            });
        } finally {
            setIsLoadingImpact(false);
        }
    };

    const handleDelete = async () => {
        // Validate confirmation text
        const expectedText = type === 'drug' ? item.name : item.batchNumber;
        if (confirmText !== expectedText) {
            toast.error(`Please type "${expectedText}" to confirm`);
            return;
        }

        // Ensure impact data is loaded
        if (!impactData) {
            toast.error('Impact data is still loading. Please wait.');
            return;
        }

        setIsDeleting(true);

        try {
            const { inventoryApi } = await import('@/lib/api/inventory');

            if (type === 'drug') {
                // Use the backend deleteDrug endpoint which handles all batches
                console.log('Deleting drug:', item.id);
                const response = await inventoryApi.deleteDrug(item.id);
                console.log('Delete drug response:', response);

                // API returns data directly: { drug, deletedBatchCount }
                const batchCount = response.deletedBatchCount || 0;
                toast.success(`Drug "${item.name}" and ${batchCount} batch${batchCount !== 1 ? 'es' : ''} deleted successfully`);
                onSuccess();
                onClose();
            } else {
                // Delete single batch
                console.log('Deleting batch:', item.id);
                const response = await inventoryApi.deleteBatch(item.id);
                console.log('Delete batch response:', response);

                // API returns batch data directly
                toast.success(`Batch "${item.batchNumber}" deleted successfully`);
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            console.error('Failed to delete:', error);
            toast.error(error.message || 'Failed to delete inventory');
        } finally {
            setIsDeleting(false);
        }
    };

    const expectedConfirmText = type === 'drug' ? item.name : item.batchNumber;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FiTrash2 className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Delete {type === 'drug' ? 'Drug & All Batches' : 'Batch'}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {type === 'drug' ? item.name : `Batch ${item.batchNumber}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        disabled={isDeleting}
                    >
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Warning Banner */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <FiAlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900 mb-1">
                                    ⚠️ Permanent Deletion Warning
                                </h3>
                                <p className="text-sm text-red-800 mb-2">
                                    This action will soft-delete the {type === 'drug' ? 'drug and ALL associated batches' : 'batch'}.
                                    The data will be marked as deleted but can be recovered by administrators if needed.
                                </p>
                                <p className="text-sm text-red-800 font-medium">
                                    This action should only be used for entries made by mistake.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Impact Summary */}
                    {isLoadingImpact ? (
                        <div className="bg-gray-50 rounded-lg p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                    ) : impactData && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                <FiPackage className="w-4 h-4" />
                                Deletion Impact
                            </h3>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-white rounded-lg p-3 border border-amber-200">
                                    <p className="text-xs text-gray-600 mb-1">Batches Affected</p>
                                    <p className="text-2xl font-bold text-gray-900">{impactData.batchCount}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-200">
                                    <p className="text-xs text-gray-600 mb-1">Total Stock Units</p>
                                    <p className="text-2xl font-bold text-gray-900">{impactData.totalStock}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-amber-200">
                                    <p className="text-xs text-gray-600 mb-1">Inventory Value</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{impactData.totalValue.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Affected Batches List */}
                            {impactData.batches && impactData.batches.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-amber-900 mb-2">
                                        Batches to be deleted:
                                    </p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {impactData.batches.map((batch: any) => (
                                            <div key={batch.id} className="bg-white rounded p-2 border border-amber-200 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-gray-900">{batch.batchNumber}</span>
                                                    <span className="text-gray-600">{batch.quantityInStock} units</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Expiry: {(() => {
                                                        const date = new Date(batch.expiryDate);
                                                        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                                                    })()} •
                                                    Value: ₹{((batch.quantityInStock || 0) * (batch.purchasePrice || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {impactData.hasMore && (
                                        <p className="text-xs text-amber-700 mt-2">
                                            + {impactData.batchCount - 5} more batches...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Confirmation Input */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Type <span className="font-mono bg-gray-200 px-2 py-0.5 rounded text-red-600">{expectedConfirmText}</span> to confirm deletion
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={`Type "${expectedConfirmText}" here`}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            disabled={isDeleting}
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This confirmation helps prevent accidental deletions.
                        </p>
                    </div>

                    {/* Additional Warnings */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Sales history referencing these batches will remain intact</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Stock movements will be preserved for audit purposes</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-red-500 font-bold">•</span>
                            <span>Deleted items can be recovered by administrators if needed</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting || confirmText !== expectedConfirmText || isLoadingImpact}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <FiTrash2 className="w-4 h-4" />
                                Delete {type === 'drug' ? 'Drug & Batches' : 'Batch'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
