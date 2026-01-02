import React, { useState } from 'react';
import { HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { normalizeGSTRate } from '@/utils/gst-utils';
import { getApiBaseUrl } from '@/lib/config/env';
import { tokenManager } from '@/lib/api/client';

interface AddCustomItemInlineProps {
    onAdd: (item: any) => void;
    onCancel: () => void;
    initialName?: string;
    editMode?: boolean;
    drugId?: string;
    initialData?: any;
}

export default function AddCustomItemInline({ onAdd, onCancel, initialName = '', editMode = false, drugId, initialData }: AddCustomItemInlineProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        // Row 1: Basic Info
        name: initialData?.name || initialName,
        genericName: initialData?.genericName || '',
        manufacturer: initialData?.manufacturer || '',
        form: initialData?.form || 'Tablet',

        // Row 2: Clinical & Regulatory
        strength: initialData?.strength || '',
        schedule: initialData?.schedule || '',
        hsnCode: initialData?.hsnCode || '',
        gstRate: initialData?.gstRate || 5,

        // Row 3: Inventory
        defaultUnit: initialData?.defaultUnit || 'Strip',
        requiresPrescription: initialData?.requiresPrescription || false,
        lowStockThreshold: initialData?.lowStockThreshold || 10,

        // PO specific
        packSize: initialData?.packSize || 10,
        price: initialData?.price || 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const method = editMode ? 'PUT' : 'POST';
            const url = editMode
                ? `${getApiBaseUrl()}/drugs/${drugId}`
                : `${getApiBaseUrl()}/drugs`;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokenManager.getAccessToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    genericName: formData.genericName || null,
                    manufacturer: formData.manufacturer || null,
                    form: formData.form || null,
                    strength: formData.strength || null,
                    schedule: formData.schedule || null,
                    hsnCode: formData.hsnCode || null,
                    gstRate: Number(formData.gstRate),
                    requiresPrescription: formData.requiresPrescription,
                    defaultUnit: formData.defaultUnit,
                    lowStockThreshold: formData.lowStockThreshold,
                    description: 'Custom item added via PO'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create drug');
            }

            const result = await response.json();
            const newDrug = result.data || result;

            // Add to PO
            onAdd({
                id: newDrug.id,
                name: newDrug.name,
                packSize: Number(formData.packSize),
                packUnit: newDrug.defaultUnit || formData.defaultUnit,
                unit: (newDrug.defaultUnit || formData.defaultUnit).toLowerCase(),
                price: Number(formData.price),
                gstPercent: normalizeGSTRate(newDrug.gstRate || formData.gstRate),
                currentStock: 0,
                isCustom: false
            });

            toast.success(editMode ? 'Item updated successfully' : 'Custom item added to catalog and PO');
        } catch (error: any) {
            console.error('Failed to add custom item:', error);
            toast.error(error.message || 'Failed to add item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{editMode ? 'Edit Item' : 'Add Custom Item'}</h4>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <HiOutlineXMark size={20} />
                </button>
            </div>

            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Paracetamol"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Generic Name</label>
                    <input
                        type="text"
                        value={formData.genericName}
                        onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Acetaminophen"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. Cipla"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dosage Form</label>
                    <select
                        value={formData.form}
                        onChange={e => setFormData({ ...formData, form: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Injection">Injection</option>
                        <option value="Cream">Cream</option>
                        <option value="Ointment">Ointment</option>
                        <option value="Drops">Drops</option>
                        <option value="Inhaler">Inhaler</option>
                    </select>
                </div>
            </div>

            {/* Row 2: Clinical & Regulatory */}
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Strength</label>
                    <input
                        type="text"
                        value={formData.strength}
                        onChange={e => setFormData({ ...formData, strength: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 500mg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Schedule</label>
                    <select
                        value={formData.schedule}
                        onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">None</option>
                        <option value="H">H (Habit Forming)</option>
                        <option value="H1">H1 (Habit Forming)</option>
                        <option value="X">X (Narcotic)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
                    <input
                        type="text"
                        value={formData.hsnCode}
                        onChange={e => setFormData({ ...formData, hsnCode: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="e.g. 30049099"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">GST Rate (%)</label>
                    <select
                        value={formData.gstRate}
                        onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                    </select>
                </div>
            </div>

            {/* Row 3: Inventory & PO Details */}
            <div className="grid grid-cols-5 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                    <select
                        value={formData.defaultUnit}
                        onChange={e => setFormData({ ...formData, defaultUnit: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="Strip">Strip</option>
                        <option value="Bottle">Bottle</option>
                        <option value="Box">Box</option>
                        <option value="Tube">Tube</option>
                        <option value="Vial">Vial</option>
                        <option value="Piece">Piece</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pack Size</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.packSize}
                        onChange={e => {
                            const val = e.target.value.replace(/^0+/, '') || '0';
                            setFormData({ ...formData, packSize: Number(val) });
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={e => {
                            const val = e.target.value.replace(/^0+(?=\d)/, '');
                            setFormData({ ...formData, price: Number(val) });
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock</label>
                    <input
                        type="number"
                        min="0"
                        value={formData.lowStockThreshold}
                        onChange={e => {
                            const val = e.target.value.replace(/^0+/, '') || '0';
                            setFormData({ ...formData, lowStockThreshold: Number(val) });
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.requiresPrescription}
                            onChange={e => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-xs font-medium text-gray-700">Requires Rx</span>
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <HiOutlineCheck size={16} />
                    {isSubmitting ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Item' : 'Add Item')}
                </button>
            </div>
        </form>
    );
}
