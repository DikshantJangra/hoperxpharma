'use client';

import { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import { drugApi } from '@/lib/api/drugs';

interface EditDrugModalProps {
    drugId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DRUG_FORMS = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
    'Drops', 'Spray', 'Powder', 'Solution', 'Suspension', 'Gel', 'Lotion', 'Other'
];

const GST_RATES = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
];

const SCHEDULES = ['', 'H', 'H1', 'X', 'G', 'Other'];

const DEFAULT_UNITS = ['Strips', 'Units', 'Bottles', 'Tubes', 'Vials', 'Boxes', 'Pieces'];

export default function EditDrugModal({ drugId, isOpen, onClose, onSuccess }: EditDrugModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        strength: '',
        form: '',
        manufacturer: '',
        schedule: '',
        hsnCode: '',
        gstRate: 12,
        requiresPrescription: false,
        defaultUnit: 'Strips',
        lowStockThreshold: 10,
        description: '',
    });

    // Load drug data when modal opens
    useEffect(() => {
        if (isOpen && drugId) {
            loadDrugData();
        }
    }, [isOpen, drugId]);

    const loadDrugData = async () => {
        setLoading(true);
        try {
            const response = await drugApi.getDrugById(drugId);
            const drug = response.data || response;

            setFormData({
                name: drug.name || '',
                genericName: drug.genericName || '',
                strength: drug.strength || '',
                form: drug.form || '',
                manufacturer: drug.manufacturer || '',
                schedule: drug.schedule || '',
                hsnCode: drug.hsnCode || '',
                gstRate: parseFloat(drug.gstRate) || 12,
                requiresPrescription: drug.requiresPrescription || false,
                defaultUnit: drug.defaultUnit || 'Strips',
                lowStockThreshold: drug.lowStockThreshold || 10,
                description: drug.description || '',
            });
        } catch (error: any) {
            console.error('Failed to load drug data:', error);
            toast.error('Failed to load drug data');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Drug name is required');
            return;
        }

        setSaving(true);
        try {
            await drugApi.updateDrug(drugId, formData);
            toast.success('Drug updated successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to update drug:', error);
            toast.error(error.message || 'Failed to update drug');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Drug</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Drug Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Generic Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.genericName}
                                                onChange={(e) => handleChange('genericName', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Strength
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.strength}
                                                onChange={(e) => handleChange('strength', e.target.value)}
                                                placeholder="e.g., 500mg, 10ml"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Form
                                            </label>
                                            <select
                                                value={formData.form}
                                                onChange={(e) => handleChange('form', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                <option value="">Select form</option>
                                                {DRUG_FORMS.map(form => (
                                                    <option key={form} value={form}>{form}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Manufacturer
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.manufacturer}
                                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Regulatory Information */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Regulatory Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Schedule
                                            </label>
                                            <select
                                                value={formData.schedule}
                                                onChange={(e) => handleChange('schedule', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                {SCHEDULES.map(schedule => (
                                                    <option key={schedule} value={schedule}>
                                                        {schedule || 'None'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                HSN Code
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.hsnCode}
                                                onChange={(e) => handleChange('hsnCode', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                GST Rate
                                            </label>
                                            <select
                                                value={formData.gstRate}
                                                onChange={(e) => handleChange('gstRate', parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                {GST_RATES.map(rate => (
                                                    <option key={rate.value} value={rate.value}>
                                                        {rate.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-center pt-6">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.requiresPrescription}
                                                    onChange={(e) => handleChange('requiresPrescription', e.target.checked)}
                                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    Requires Prescription
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Inventory Settings */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Inventory Settings</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Default Unit
                                            </label>
                                            <select
                                                value={formData.defaultUnit}
                                                onChange={(e) => handleChange('defaultUnit', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            >
                                                {DEFAULT_UNITS.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Low Stock Threshold
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.lowStockThreshold}
                                                onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 0)}
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Additional notes or description"
                                    />
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving || loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FiSave size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
