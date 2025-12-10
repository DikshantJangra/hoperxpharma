'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface AddBatchModalProps {
    drugId: string;
    drugName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddBatchModal({ drugId, drugName, onClose, onSuccess }: AddBatchModalProps) {
    const [formData, setFormData] = useState({
        batchNumber: '',
        expiryDate: '',
        quantity: '',
        mrp: '',
        purchaseRate: '',
        rackLocation: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.batchNumber || !formData.expiryDate || !formData.quantity || !formData.mrp) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);

        try {
            const { inventoryApi } = await import('@/lib/api/inventory');

            await inventoryApi.createBatch({
                drugId,
                batchNumber: formData.batchNumber,
                expiryDate: new Date(formData.expiryDate).toISOString(),
                quantityInStock: parseFloat(formData.quantity),
                mrp: parseFloat(formData.mrp),
                purchaseRate: parseFloat(formData.purchaseRate || '0'),
                location: formData.rackLocation
            });

            toast.success('Stock added successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to add batch:', error);
            toast.error(error.message || 'Failed to add stock');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-lg w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                data-focus-trap="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
                    <div>
                        <h3 className="text-lg font-bold text-[#0f172a]">Add Stock</h3>
                        <p className="text-xs text-[#64748b] mt-0.5">Adding batch to {drugName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-[#f8fafc] rounded text-[#64748b] hover:text-[#0f172a]">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Batch Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.batchNumber}
                                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="e.g. BATCH001"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                MRP (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                value={formData.mrp}
                                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Rate (₹)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.purchaseRate}
                                onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rack / Location
                            </label>
                            <input
                                type="text"
                                value={formData.rackLocation}
                                onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="e.g. A-1-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Adding...
                                </>
                            ) : 'Add Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
