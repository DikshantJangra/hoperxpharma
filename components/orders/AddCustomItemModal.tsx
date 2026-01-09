import React, { useState } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { apiClient } from '@/lib/api/client';

interface AddCustomItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: any) => void;
    initialName?: string;
}

export default function AddCustomItemModal({ isOpen, onClose, onAdd, initialName = '' }: AddCustomItemModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: initialName,
        manufacturer: '',
        packSize: 10,
        packUnit: 'Strip',
        price: 0,
        gstPercent: 5,
        hsn: ''
    });

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await apiClient.post('/drugs', {
                name: formData.name,
                manufacturer: formData.manufacturer || 'Custom',
                defaultUnit: formData.packUnit,
                gstRate: Number(formData.gstPercent),
                hsnCode: formData.hsn,
                requiresPrescription: false, // Default for custom items
                description: 'Custom item added via PO'
            });

            // result is the body directly now
            const newDrug = result.data || result;

            // 2. Add to PO with the REAL backend ID
            onAdd({
                id: newDrug.id,
                name: newDrug.name,
                packSize: Number(formData.packSize),
                packUnit: newDrug.defaultUnit || formData.packUnit,
                unit: (newDrug.defaultUnit || formData.packUnit).toLowerCase(),
                price: Number(formData.price),
                gstPercent: Number(newDrug.gstRate || formData.gstPercent),
                currentStock: 0,
                isCustom: false // It is now a real persisted drug
            });

            toast.success('Product added to catalog and PO');
            onClose();
            setFormData({
                name: '',
                manufacturer: '',
                packSize: 10,
                packUnit: 'Strip',
                price: 0,
                gstPercent: 5,
                hsn: ''
            });
        } catch (error: any) {
            console.error('Failed to add custom item:', error);
            toast.error(error.message || 'Failed to add item');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onKeyDown={handleKeyDown}
                data-focus-trap="true"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Add Custom Item</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <HiOutlineXMark size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Custom Medicine 500mg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer (Optional)</label>
                        <input
                            type="text"
                            value={formData.manufacturer}
                            onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g. Pharma Co."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pack Size</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.packSize}
                                onChange={e => setFormData({ ...formData, packSize: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pack Unit</label>
                            <select
                                value={formData.packUnit}
                                onChange={e => setFormData({ ...formData, packUnit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="Strip">Strip</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Box">Box</option>
                                <option value="Tube">Tube</option>
                                <option value="Vial">Vial</option>
                                <option value="Ampoule">Ampoule</option>
                                <option value="Piece">Piece</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                            <select
                                value={formData.gstPercent}
                                onChange={e => setFormData({ ...formData, gstPercent: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
