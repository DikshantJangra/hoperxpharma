import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiPlus, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { inventoryApi } from '@/lib/api/inventory';
import SupplierSelect from '@/components/orders/SupplierSelect';
import { Supplier } from '@/types/po';
import { useAuthStore } from '@/lib/store/auth-store';

interface AddStockViewProps {
    drugId: string;
    drugName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddStockView({ drugId, drugName, onClose, onSuccess }: AddStockViewProps) {
    const [formData, setFormData] = useState({
        batchNumber: '',
        expiryDate: '',
        unit: 'Tablet',
        tabletsPerStrip: 10,
        quantity: 0,
        mrp: 0,
        purchaseRate: 0,
        location: '',
        gstRate: 12, // Default to 12%
    });
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { primaryStore } = useAuthStore();

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    // Try to pre-fill rack location if drug has one
    useEffect(() => {
        const fetchLatestBatch = async () => {
            try {
                // Also get drug details for GST rate
                const drugResponse = await inventoryApi.getDrugById(drugId);
                if (drugResponse && drugResponse.gstRate !== undefined) {
                    setFormData(prev => ({ ...prev, gstRate: Number(drugResponse.gstRate) }));
                }

                const response = await inventoryApi.getBatches({ drugId, limit: 1 });
                if (response.batches && response.batches.length > 0) {
                    const latest = response.batches[0];
                    setFormData(prev => ({
                        ...prev,
                        location: latest.location || '',
                        unit: latest.receivedUnit || 'Tablet',
                        tabletsPerStrip: latest.tabletsPerStrip || 10,
                    }));
                }
            } catch (err) {
                console.warn('Failed to fetch latest data for pre-fill:', err);
            }
        };
        fetchLatestBatch();
    }, [drugId]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than zero';
        if (formData.mrp <= 0) newErrors.mrp = 'MRP must be greater than zero';
        if (formData.purchaseRate < 0) newErrors.purchaseRate = 'Rate cannot be negative';
        if (!formData.batchNumber) newErrors.batchNumber = 'Batch number is required';
        if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error('Please correct the errors in the form');
            return;
        }

        setIsSubmitting(true);
        try {
            const promises = [];

            // Helper for last day of month
            const getExpiryISO = (dateStr: string) => {
                if (!dateStr) return '';
                // Handle MM/YYYY format
                if (dateStr.includes('/')) {
                    const [m, y] = dateStr.split('/');
                    const month = parseInt(m);
                    const year = parseInt(y);
                    // new Date(year, month, 0) gives last day of 'month' when month is 1-indexed
                    return new Date(year, month, 0).toISOString();
                }
                // Fallback for YYYY-MM
                const [y, m] = dateStr.split('-');
                return new Date(parseInt(y), parseInt(m), 0).toISOString();
            };

            // Calculate baseUnitQuantity
            const baseUnitQuantity = formData.unit === 'Strip'
                ? formData.quantity * formData.tabletsPerStrip
                : formData.quantity;

            // 1. Create Batch
            promises.push(inventoryApi.createBatch({
                ...formData,
                storeId: primaryStore?.id,
                drugId,
                baseUnitQuantity,
                purchasePrice: formData.purchaseRate, // Backend expects purchasePrice
                supplierId: selectedSupplier?.id,
                expiryDate: getExpiryISO(formData.expiryDate),
            }));

            // 2. Update Drug GST if different (optional but consistent with user expectations)
            // Note: We might want to fetch current drug again or pass it in props
            // For now, assume we should update it to keep it in sync
            promises.push(inventoryApi.updateDrug(drugId, {
                gstRate: formData.gstRate
            }));

            await Promise.all(promises);

            toast.success(`Batch ${formData.batchNumber} added successfully`);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to add batch:', error);
            toast.error(error.message || 'Failed to add batch');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClasses = (field: string) => `
        w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm
        ${errors[field] ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30' : 'border-gray-200 focus:ring-teal-500/20 focus:border-teal-500 bg-white'}
        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={isSubmitting}
                >
                    <FiX size={18} />
                </button>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Add New Batch</h3>
                    <p className="text-xs text-gray-500">{drugName}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <form id="add-stock-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                            <input
                                type="text"
                                required
                                value={formData.batchNumber}
                                onChange={(e) => {
                                    setFormData({ ...formData, batchNumber: e.target.value.toUpperCase() });
                                    if (errors.batchNumber) setErrors({ ...errors, batchNumber: '' });
                                }}
                                className={inputClasses('batchNumber')}
                                placeholder="e.g. BTC001"
                                disabled={isSubmitting}
                            />
                            {errors.batchNumber && <p className="text-[10px] text-red-500 mt-1">{errors.batchNumber}</p>}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                            <input
                                type="text"
                                required
                                placeholder="MM/YYYY"
                                value={formData.expiryDate}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');

                                    // Smart logic: if first digit > 1, make it 0X/
                                    if (val.length === 1 && parseInt(val) > 1) {
                                        val = `0${val}20`;
                                    } else if (val.length === 2) {
                                        // If month > 12, cap it or just allow it for now
                                        val = val;
                                    } else if (val.length === 3 && !val.startsWith('20', 2)) {
                                        // typed first digit of year
                                        const month = val.slice(0, 2);
                                        const yearDigit = val.slice(2);
                                        val = `${month}20${yearDigit}`;
                                    }

                                    // Format with slash
                                    let formatted = val;
                                    if (val.length >= 2) {
                                        formatted = val.slice(0, 2) + '/' + val.slice(2, 6);
                                    }

                                    setFormData({ ...formData, expiryDate: formatted });
                                    if (errors.expiryDate) setErrors({ ...errors, expiryDate: '' });
                                }}
                                maxLength={7} // MM/YYYY
                                className={inputClasses('expiryDate')}
                                disabled={isSubmitting}
                            />
                            {errors.expiryDate && <p className="text-[10px] text-red-500 mt-1">{errors.expiryDate}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="Tablet">Tablet</option>
                                <option value="Strip">Strip</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Vial">Vial</option>
                                <option value="Box">Box</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.quantity || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setFormData({ ...formData, quantity: val });
                                    if (val > 0 && errors.quantity) setErrors({ ...errors, quantity: '' });
                                }}
                                className={inputClasses('quantity')}
                                placeholder="0"
                                disabled={isSubmitting}
                            />
                            {errors.quantity && <p className="text-[10px] text-red-500 mt-1">{errors.quantity}</p>}
                        </div>
                    </div>

                    {formData.unit === 'Strip' && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tablets per Strip</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.tabletsPerStrip || ''}
                                onChange={(e) => setFormData({ ...formData, tabletsPerStrip: Math.max(1, parseInt(e.target.value) || 1) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹) *</label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={formData.mrp || ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setFormData({ ...formData, mrp: val });
                                    if (val > 0 && errors.mrp) setErrors({ ...errors, mrp: '' });
                                }}
                                className={inputClasses('mrp')}
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                            {errors.mrp && <p className="text-[10px] text-red-500 mt-1">{errors.mrp}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Rate (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.purchaseRate || ''}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setFormData({ ...formData, purchaseRate: val });
                                    if (val >= 0 && errors.purchaseRate) setErrors({ ...errors, purchaseRate: '' });
                                }}
                                className={inputClasses('purchaseRate')}
                                placeholder="0.00"
                                disabled={isSubmitting}
                            />
                            {errors.purchaseRate && <p className="text-[10px] text-red-500 mt-1">{errors.purchaseRate}</p>}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Supplier (Optional)</label>
                            <Link
                                href="/inventory/suppliers"
                                className="text-[10px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 uppercase tracking-tight"
                            >
                                <FiPlus size={10} /> Add New Supplier
                            </Link>
                        </div>
                        <div className="relative">
                            <SupplierSelect
                                value={selectedSupplier}
                                onChange={(s: any) => setSelectedSupplier(s)}
                            />
                            {selectedSupplier && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedSupplier(undefined)}
                                    className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                            <select
                                value={formData.gstRate}
                                onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                <option value={0}>0% (Exempt)</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rack Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                placeholder="e.g. A1-R2"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors text-sm"
                    disabled={isSubmitting}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    form="add-stock-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm text-sm"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving Batch...
                        </>
                    ) : (
                        <>
                            <FiCheck size={18} />
                            Add Stock Batch
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
