import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiCheck, FiInfo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { formatStockQuantity, formatUnitName } from '@/lib/utils/stock-display';

interface AdjustStockViewProps {
    item: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AdjustStockView({ item, onClose, onSuccess }: AdjustStockViewProps) {
    const [selectedBatchId, setSelectedBatchId] = useState(item.batches[0]?.id || '');
    const [delta, setDelta] = useState(0);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Advanced fields - Batch level
    const [mrp, setMrp] = useState(0);
    const [cost, setCost] = useState(0);
    const [expiry, setExpiry] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [receivedUnit, setReceivedUnit] = useState('');
    const [tabletsPerStrip, setTabletsPerStrip] = useState(1);
    const [supplierId, setSupplierId] = useState('');

    // Advanced fields - Drug level
    const [gst, setGst] = useState(0);
    const [hsnCode, setHsnCode] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [schedule, setSchedule] = useState('');
    const [requiresPrescription, setRequiresPrescription] = useState(false);
    const [lowStockThreshold, setLowStockThreshold] = useState(0);
    const [description, setDescription] = useState('');

    // Suppliers list
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const batch = item.batches.find((b: any) => b.id === selectedBatchId);

    // Update fields when batch changes
    useEffect(() => {
        if (batch) {
            setMrp(Number(batch.mrp) || 0);
            setCost(Number(batch.purchasePrice || batch.cost || batch.unitCost) || 0);
            setLocation(batch.location || '');
            setReceivedUnit(batch.receivedUnit || batch.drug?.displayUnit || item.displayUnit || 'Strip');
            setTabletsPerStrip(Number(batch.tabletsPerStrip || batch.unitsPerPack) || 1);
            setSupplierId(batch.supplierId || '');

            // Format date to YYYY-MM for month input
            if (batch.expiryDate) {
                const date = new Date(batch.expiryDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                setExpiry(`${year}-${month}`);
            } else if (batch.expiry) {
                try {
                    const date = new Date(batch.expiry);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    setExpiry(`${year}-${month}`);
                } catch {
                    setExpiry('');
                }
            } else {
                setExpiry('');
            }
        }
    }, [selectedBatchId, batch]);

    // Load drug-level fields on mount
    useEffect(() => {
        if (item) {
            setGst(Number(item.gstRate) || 0);
            setHsnCode(item.hsnCode || item.hsnCodeId || '');
            setManufacturer(item.manufacturer || '');
            setSchedule(item.schedule || '');
            setRequiresPrescription(Boolean(item.requiresPrescription));
            setLowStockThreshold(Number(item.lowStockThreshold || item.lowStockThresholdBase) || 0);
            setDescription(item.description || '');
        }
    }, [item]);

    // Load suppliers
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const { supplierApi } = await import('@/lib/api/supplier');
                const response = await supplierApi.getSuppliers({ limit: 1000 });
                if (response.success) {
                    setSuppliers(response.data || []);
                }
            } catch (error) {
                console.error('Failed to load suppliers:', error);
            }
        };
        loadSuppliers();
    }, []);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    const currentQty = batch ? (Number(batch.baseUnitQuantity || 0)) : 0;
    const deltaInBaseUnits = delta; // Delta is ALREADY in base units (user adjusts base units directly)
    const resultingQty = currentQty + deltaInBaseUnits;

    // Get proper unit for display (always base unit)
    const displayUnit = batch?.drug?.baseUnit || batch?.baseUnit || item.baseUnit || 'Tablet';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!selectedBatchId) {
            toast.error('Please select a batch');
            return;
        }

        if (delta !== 0 && !reason) {
            toast.error('Please provide a reason for stock adjustment');
            return;
        }

        if (resultingQty < 0) {
            toast.error('Resulting quantity cannot be negative');
            return;
        }

        setIsSubmitting(true);

        try {
            const { inventoryApi } = await import('@/lib/api/inventory');

            const promises = [];

            // 1. Quantity Adjustment (if changed)
            if (delta !== 0) {
                // Delta is ALREADY in base units - send directly to backend
                promises.push(inventoryApi.adjustStock({
                    batchId: selectedBatchId,
                    quantityAdjusted: delta, // Already in BASE UNITS
                    reason,
                    notes: notes || undefined
                }));
            }

            // 2. Batch Properties Update (if any changed)
            const getExpiryISO = (dateStr: string) => {
                if (!dateStr) return '';
                const [y, m] = dateStr.split('-');
                return new Date(parseInt(y), parseInt(m), 0).toISOString();
            };

            const currentExpiryMonth = batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0].substring(0, 7) : '';
            const hasBatchChanges =
                mrp !== Number(batch.mrp) ||
                cost !== Number(batch.purchasePrice || batch.cost) ||
                expiry !== currentExpiryMonth ||
                location !== (batch.location || '') ||
                receivedUnit !== (batch.receivedUnit || '') ||
                tabletsPerStrip !== Number(batch.tabletsPerStrip || 1) ||
                supplierId !== (batch.supplierId || '');

            if (hasBatchChanges) {
                promises.push(inventoryApi.updateBatch(selectedBatchId, {
                    mrp,
                    purchasePrice: cost,
                    expiryDate: getExpiryISO(expiry),
                    location,
                    receivedUnit,
                    tabletsPerStrip,
                    supplierId: supplierId || undefined
                }));
            }

            // 3. Drug Property Updates
            const hasDrugChanges =
                gst !== Number(item.gstRate) ||
                manufacturer !== (item.manufacturer || '') ||
                schedule !== (item.schedule || '') ||
                requiresPrescription !== Boolean(item.requiresPrescription) ||
                lowStockThreshold !== Number(item.lowStockThreshold || item.lowStockThresholdBase || 0) ||
                description !== (item.description || '');

            if (hasDrugChanges) {
                promises.push(inventoryApi.updateDrug(item.id, {
                    gstRate: gst,
                    manufacturer: manufacturer || undefined,
                    schedule: schedule || undefined,
                    requiresPrescription,
                    lowStockThreshold: lowStockThreshold || undefined,
                    description: description || undefined
                }));
            }

            if (promises.length === 0) {
                toast.error('No changes detected');
                setIsSubmitting(false);
                return;
            }

            await Promise.all(promises);

            toast.success('Inventory updated successfully');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (error: any) {
            console.error('Failed to update inventory:', error);
            toast.error(error.message || 'Failed to update inventory');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <h3 className="text-lg font-bold text-gray-900">Advanced Adjustment</h3>
                    <p className="text-xs text-gray-500">{item.name}</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <form id="adjust-stock-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
                    {/* Batch Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                            disabled={isSubmitting}
                        >
                            {item.batches.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                    {b.batchNumber} • Qty: {formatStockQuantity(b)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quantity Adjustment */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2 pr-2">
                                Stock Adjustment
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDelta(delta - 1)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold text-lg transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        value={delta || ''}
                                        onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm text-center font-semibold"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setDelta(delta + 1)}
                                        className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 font-bold text-lg transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 min-w-[120px]">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">New Qty</p>
                                    <p className={`text-sm font-bold ${resultingQty < 0 ? 'text-red-500' : 'text-teal-600'}`}>
                                        {resultingQty} {formatUnitName(displayUnit)}{resultingQty !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reason (Conditional) */}
                        <div className={`col-span-2 transition-all duration-300 ${delta !== 0 ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Quantity Change *</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                                required={delta !== 0}
                            >
                                <option value="">Select reason...</option>
                                <option value="count">Count correction</option>
                                <option value="damage">Damage</option>
                                <option value="expiry">Expiry write-off</option>
                                <option value="return">Return to supplier</option>
                                <option value="lost">Lost/Theft</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Drug-Level Properties */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Drug Information</h4>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code</label>
                            <input
                                type="text"
                                value={hsnCode}
                                readOnly
                                placeholder="Not set"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                                title="HSN codes are standardized and cannot be edited here"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                            <select
                                value={gst}
                                onChange={(e) => setGst(parseFloat(e.target.value))}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                            <input
                                type="text"
                                value={manufacturer}
                                onChange={(e) => setManufacturer(e.target.value)}
                                placeholder="e.g., Sun Pharma"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                            <select
                                value={schedule}
                                onChange={(e) => setSchedule(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="">Not Scheduled</option>
                                <option value="H">Schedule H</option>
                                <option value="H1">Schedule H1</option>
                                <option value="X">Schedule X</option>
                                <option value="G">Schedule G</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Alert</label>
                            <input
                                type="number"
                                min="0"
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                                placeholder="Minimum quantity"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="requiresPrescription"
                                checked={requiresPrescription}
                                onChange={(e) => setRequiresPrescription(e.target.checked)}
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="requiresPrescription" className="text-sm font-medium text-gray-700">
                                Requires Prescription
                            </label>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional drug information..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Batch Properties */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Batch Properties</h4>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">MRP (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={mrp}
                                onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                            <input
                                type="month"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                            <select
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="">No supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Shelf A3, Rack 5"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="col-span-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-2">Unit Configuration</h4>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Pack Unit</label>
                            <select
                                value={receivedUnit}
                                onChange={(e) => setReceivedUnit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white transition-all text-sm"
                                disabled={isSubmitting}
                            >
                                <option value="Strip">Strip</option>
                                <option value="Box">Box</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Vial">Vial</option>
                                <option value="Tablet">Tablet</option>
                                <option value="Capsule">Capsule</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {displayUnit}s per {receivedUnit}
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={tabletsPerStrip}
                                onChange={(e) => setTabletsPerStrip(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                                disabled={isSubmitting}
                            />
                        </div>

                        {delta !== 0 && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional details about this adjustment..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>
                        )}
                    </div>

                    {delta < 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                            <FiAlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800 font-medium">
                                Audit Required: Quantity reductions will be logged as {reason || 'adjustment'}.
                            </p>
                        </div>
                    )}
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
                    form="adjust-stock-form"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm text-sm"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving Changes...
                        </>
                    ) : (
                        <>
                            <FiCheck size={18} />
                            Save All Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
