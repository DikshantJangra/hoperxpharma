'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';

export default function NewPurchaseOrderPage() {
    const router = useRouter();
    const { primaryStore } = useAuthStore();
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [drugs, setDrugs] = useState<any[]>([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        supplierId: '',
        expectedDeliveryDate: '',
        notes: '',
        deliveryAddress: '',
    });

    const [items, setItems] = useState<any[]>([
        { drugId: '', quantity: 1, unitPrice: 0, gstRate: 12, discount: 0, packUnit: 'unit', packSize: 1 }
    ]);

    // Auto-fill delivery address with store address
    useEffect(() => {
        if (primaryStore) {
            const address = [
                primaryStore.addressLine1,
                primaryStore.addressLine2,
                primaryStore.city,
                primaryStore.state,
                primaryStore.pinCode
            ].filter(Boolean).join(', ');

            setFormData(prev => ({ ...prev, deliveryAddress: address }));
        }
    }, [primaryStore]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingSuppliers(true);
            try {
                const [{ supplierApi }, { inventoryApi }] = await Promise.all([
                    import('@/lib/api/supplier'),
                    import('@/lib/api/inventory'),
                ]);

                const [suppliersResponse, drugsResponse] = await Promise.all([
                    supplierApi.getSuppliers({ limit: 100 }),
                    inventoryApi.getDrugs({ limit: 500 }),
                ]);

                if (suppliersResponse.success) {
                    setSuppliers(suppliersResponse.data || []);
                }
                if (drugsResponse.success) {
                    setDrugs(drugsResponse.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoadingSuppliers(false);
            }
        };

        fetchData();
    }, []);

    const addItem = () => {
        setItems([...items, { drugId: '', quantity: 1, unitPrice: 0, gstRate: 12, discount: 0, packUnit: 'unit', packSize: 1 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const calculateItemTotal = (item: any) => {
        const subtotal = item.quantity * item.unitPrice;
        const discountAmount = (subtotal * (item.discount || 0)) / 100;
        const taxableAmount = subtotal - discountAmount;
        const gstAmount = (taxableAmount * item.gstRate) / 100;
        return taxableAmount + gstAmount;
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let discountAmount = 0;
        let taxAmount = 0;

        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = (itemSubtotal * (item.discount || 0)) / 100;
            const taxableAmount = itemSubtotal - itemDiscount;
            const itemTax = (taxableAmount * item.gstRate) / 100;

            subtotal += itemSubtotal;
            discountAmount += itemDiscount;
            taxAmount += itemTax;
        });

        return {
            subtotal,
            discountAmount,
            taxAmount,
            total: subtotal - discountAmount + taxAmount,
        };
    };

    const totals = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplierId) {
            alert('Please select a supplier');
            return;
        }

        if (items.length === 0 || items.some(item => !item.drugId || item.quantity <= 0)) {
            alert('Please add at least one valid item');
            return;
        }

        setIsSubmitting(true);
        try {
            const { purchaseOrderApi } = await import('@/lib/api/purchaseOrders');

            const poData = {
                supplierId: formData.supplierId,
                expectedDeliveryDate: formData.expectedDeliveryDate || undefined,
                notes: formData.notes || undefined,
                items: items.map(item => ({
                    drugId: item.drugId,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    discount: Number(item.discount || 0),
                    gstRate: Number(item.gstRate),
                    packUnit: item.packUnit || 'unit',
                    packSize: Number(item.packSize || 1),
                    totalAmount: calculateItemTotal(item),
                })),
            };

            const response = await purchaseOrderApi.createPO(poData);

            if (response.success) {
                alert('Purchase order created successfully!');
                router.push('/procurement/purchase-orders');
            } else {
                alert('Failed to create purchase order: ' + (response.message || 'Unknown error'));
            }
        } catch (error: any) {
            console.error('Failed to create PO:', error);
            alert('Failed to create purchase order: ' + (error.message || 'Please try again'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a]">New Purchase Order</h1>
                        <p className="text-sm text-[#64748b]">Procurement › Purchase Orders › New</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm"
                    >
                        <FiX className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
                        <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Order Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">
                                    Supplier <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    required
                                    disabled={isLoadingSuppliers}
                                >
                                    <option value="">Select supplier...</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name} - {supplier.city}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#64748b] mb-2">
                                    Expected Delivery Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expectedDeliveryDate}
                                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-[#64748b] mb-2">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                placeholder="Add any notes or special instructions..."
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-[#64748b] mb-2">
                                Delivery Address <span className="text-xs text-emerald-600">(Fixed - Store Address)</span>
                            </label>
                            <div className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg bg-gray-50 text-sm text-gray-700 min-h-[60px]">
                                {formData.deliveryAddress || 'Loading store address...'}
                            </div>
                            <p className="text-xs text-[#94a3b8] mt-1">
                                📍 Medicines will be delivered to your registered store address.
                            </p>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[#0f172a]">Items</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm"
                            >
                                <FiPlus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-[#f8fafc] rounded-lg">
                                    <div className="flex-1 grid grid-cols-8 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-[#64748b] mb-1">Drug</label>
                                            <select
                                                value={item.drugId}
                                                onChange={(e) => updateItem(index, 'drugId', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                                required
                                            >
                                                <option value="">Select drug...</option>
                                                {drugs.map(drug => (
                                                    <option key={drug.id} value={drug.id}>
                                                        {drug.name} - {drug.strength} {drug.form}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#64748b] mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                min="1"
                                                className="w-full px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-emerald-600 mb-1">Pack Unit</label>
                                            <select
                                                value={item.packUnit || 'unit'}
                                                onChange={(e) => updateItem(index, 'packUnit', e.target.value)}
                                                className="w-full px-2 py-1.5 text-sm border border-emerald-200 bg-emerald-50 rounded focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                            >
                                                <option value="unit">Unit</option>
                                                <option value="strip">Strip</option>
                                                <option value="bottle">Bottle</option>
                                                <option value="box">Box</option>
                                                <option value="tube">Tube</option>
                                                <option value="vial">Vial</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-emerald-600 mb-1">Pack Size</label>
                                            <input
                                                type="number"
                                                value={item.packSize || 1}
                                                onChange={(e) => updateItem(index, 'packSize', e.target.value)}
                                                min="1"
                                                placeholder="e.g. 10"
                                                className="w-full px-2 py-1.5 text-sm border border-emerald-200 bg-emerald-50 rounded focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                                title="How many base units per pack (e.g., 10 tablets per strip)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#64748b] mb-1">Unit Price</label>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#64748b] mb-1">GST %</label>
                                            <input
                                                type="number"
                                                value={item.gstRate}
                                                onChange={(e) => updateItem(index, 'gstRate', e.target.value)}
                                                min="0"
                                                max="100"
                                                className="w-full px-2 py-1.5 text-sm border border-[#cbd5e1] rounded focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[#64748b] mb-1">Total</label>
                                            <div className="px-2 py-1.5 text-sm font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] rounded">
                                                ₹{calculateItemTotal(item).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded"
                                        disabled={items.length === 1}
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
                        <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Order Summary</h2>
                        <div className="space-y-2 max-w-md ml-auto">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Subtotal:</span>
                                <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">Discount:</span>
                                <span className="font-medium text-red-600">-₹{totals.discountAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#64748b]">GST:</span>
                                <span className="font-medium">₹{totals.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-[#e2e8f0] pt-2 flex justify-between">
                                <span className="font-semibold text-[#0f172a]">Total:</span>
                                <span className="font-bold text-xl text-[#0ea5a3]">₹{totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSave className="w-4 h-4" />
                            {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
