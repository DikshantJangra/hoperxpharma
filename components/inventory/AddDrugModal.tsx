'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ModalWrapper from '@/components/ui/ModalWrapper';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface AddDrugModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddDrugModal({ isOpen, onClose, onSuccess }: AddDrugModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        manufacturer: '',
        strength: '',
        form: '',
        hsnCode: '',
        gstRate: '12',
        requiresPrescription: false,
        defaultUnit: 'Strip',
        lowStockThreshold: '10',
        lowStockThreshold: '10',
        schedule: '',
        addOpeningStock: false,
        initialStock: {
            batchNumber: '',
            expiryDate: '',
            quantity: '',
            mrp: '',
            purchaseRate: ''
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { inventoryApi } = await import('@/lib/api/inventory');
            const response = await inventoryApi.createDrug({
                ...formData,
                gstRate: parseFloat(formData.gstRate),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
                // Only include initialStock if the checkbox is checked
                initialStock: formData.addOpeningStock ? {
                    ...formData.initialStock,
                    quantity: parseFloat(formData.initialStock.quantity),
                    mrp: parseFloat(formData.initialStock.mrp),
                    purchaseRate: parseFloat(formData.initialStock.purchaseRate || '0')
                } : undefined
            });

            if (response.success) {
                toast.success('Drug added successfully!');
                onSuccess();
                onClose();
                // Reset form
                setFormData({
                    name: '',
                    genericName: '',
                    manufacturer: '',
                    strength: '',
                    form: '',
                    hsnCode: '',
                    gstRate: '12',
                    requiresPrescription: false,
                    defaultUnit: 'Strip',
                    lowStockThreshold: '10',
                    schedule: ''
                });
            }
        } catch (error: any) {
            console.error('Failed to create drug:', error);
            toast.error(error.message || 'Failed to add drug');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onClose}
            title="Add New Drug"
            width="max-w-2xl"
        >
            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
                onKeyDown={handleKeyDown}
            >
                <div className="grid grid-cols-2 gap-4">
                    {/* Drug Name */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Drug Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="e.g., Paracetamol"
                        />
                    </div>

                    {/* Generic Name */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Generic Name
                        </label>
                        <input
                            type="text"
                            value={formData.genericName}
                            onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="e.g., Acetaminophen"
                        />
                    </div>

                    {/* Manufacturer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Manufacturer
                        </label>
                        <input
                            type="text"
                            value={formData.manufacturer}
                            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="e.g., Cipla"
                        />
                    </div>

                    {/* Strength */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Strength
                        </label>
                        <input
                            type="text"
                            value={formData.strength}
                            onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="e.g., 500mg"
                        />
                    </div>

                    {/* Form */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Form
                        </label>
                        <select
                            value={formData.form}
                            onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                        >
                            <option value="">Select form</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Injection">Injection</option>
                            <option value="Cream">Cream</option>
                            <option value="Ointment">Ointment</option>
                        </select>
                    </div>

                    {/* Default Unit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Default Unit
                        </label>
                        <select
                            value={formData.defaultUnit}
                            onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                        >
                            <option value="Strip">Strip</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Vial">Vial</option>
                            <option value="Tube">Tube</option>
                            <option value="Unit">Unit</option>
                        </select>
                    </div>

                    {/* HSN Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            HSN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.hsnCode}
                            onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="e.g., 30049099"
                        />
                    </div>

                    {/* GST Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            GST Rate (%) <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.gstRate}
                            onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                        >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>

                    {/* Schedule */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Schedule
                        </label>
                        <select
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                        >
                            <option value="">None</option>
                            <option value="H">H (Prescription Required)</option>
                            <option value="H1">H1 (Habit Forming)</option>
                            <option value="X">X (Narcotic)</option>
                        </select>
                    </div>

                    {/* Low Stock Threshold */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low Stock Threshold
                        </label>
                        <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3] focus:border-[#0ea5a3]"
                            placeholder="10"
                        />
                    </div>

                    {/* Requirements */}
                    <div className="col-span-2 space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.requiresPrescription}
                                onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                                className="w-4 h-4 text-[#0ea5a3] rounded focus:ring-[#0ea5a3]"
                            />
                            <span className="text-sm font-medium text-gray-700">Requires Prescription</span>
                        </label>

                        {/* Opening Stock Section */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={formData.addOpeningStock}
                                    onChange={(e) => setFormData({ ...formData, addOpeningStock: e.target.checked })}
                                    className="w-4 h-4 text-[#0ea5a3] rounded focus:ring-[#0ea5a3]"
                                />
                                <span className="font-bold text-gray-800">Add Opening Stock</span>
                            </label>

                            {formData.addOpeningStock && (
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                    {/* Batch Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Batch Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required={formData.addOpeningStock}
                                            value={formData.initialStock?.batchNumber || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                initialStock: { ...formData.initialStock!, batchNumber: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3]"
                                            placeholder="BATCH001"
                                        />
                                    </div>

                                    {/* Expiry Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Expiry Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required={formData.addOpeningStock}
                                            value={formData.initialStock?.expiryDate || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                initialStock: { ...formData.initialStock!, expiryDate: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3]"
                                        />
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required={formData.addOpeningStock}
                                            min="1"
                                            value={formData.initialStock?.quantity || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                initialStock: { ...formData.initialStock!, quantity: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3]"
                                            placeholder="0"
                                        />
                                    </div>

                                    {/* MRP */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            MRP (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            required={formData.addOpeningStock}
                                            step="0.01"
                                            min="0"
                                            value={formData.initialStock?.mrp || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                initialStock: { ...formData.initialStock!, mrp: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3]"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    {/* Purchase Rate */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Purchase Rate (₹)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.initialStock?.purchaseRate || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                initialStock: { ...formData.initialStock!, purchaseRate: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ea5a3]"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Adding...' : 'Add Drug'}
                </button>
            </div>
        </ModalWrapper>
    );
}
