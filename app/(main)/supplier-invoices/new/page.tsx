'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supplierInvoiceApi, EligibleItem } from '@/lib/api/supplierInvoices';
import { HiOutlineCheckCircle, HiOutlineArrowRight } from 'react-icons/hi2';

export default function NewSupplierInvoicePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Select supplier & period
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');

    // Step 2: Select items
    const [eligibleItems, setEligibleItems] = useState<EligibleItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    //Step 3: Review & create
    const [reviewData, setReviewData] = useState<any>(null);

    useEffect(() => {
        // Set default period to current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setPeriodStart(firstDay.toISOString().split('T')[0]);
        setPeriodEnd(lastDay.toISOString().split('T')[0]);

        // Fetch suppliers
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('/api/v1/suppliers');
            const data = await response.json();
            setSuppliers(data.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleFetchItems = async () => {
        if (!selectedSupplier || !periodStart || !periodEnd) {
            alert('Please select supplier and period');
            return;
        }

        try {
            setLoading(true);

            const params = {
                supplierId: selectedSupplier,
                storeId: '1', // TODO: Get from user session
                periodStart: periodStart,
                periodEnd: periodEnd
            };

            console.log('Fetching eligible items with params:', params);

            const result = await supplierInvoiceApi.getEligibleItems(params);

            setEligibleItems(result.data || []);
            setStep(2);
        } catch (error: any) {
            console.error('Error fetching eligible items:', error);
            alert(error.response?.data?.message || error.message || 'Failed to fetch items');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedItems.size === eligibleItems.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(eligibleItems.map(i => i.grnItemId)));
        }
    };

    const handleReview = () => {
        const selectedItemsData = eligibleItems.filter(i => selectedItems.has(i.grnItemId));
        const subtotal = selectedItemsData.reduce((sum, i) => sum + Number(i.calculatedTotal), 0);

        setReviewData({
            items: selectedItemsData,
            count: selectedItemsData.length,
            subtotal
        });
        setStep(3);
    };

    const handleCreateInvoice = async () => {
        try {
            setLoading(true);
            const result = await supplierInvoiceApi.createDraftInvoice({
                supplierId: selectedSupplier,
                storeId: '1', // TODO: Get from user session
                periodStart,
                periodEnd,
                selectedGrnItemIds: Array.from(selectedItems)
            });

            router.push(`/supplier-invoices/${result.data.id}`);
        } catch (error: any) {
            console.error('Error creating invoice:', error);
            alert(error.response?.data?.message || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    const selectedSupplierName = suppliers.find(s => s.id === selectedSupplier)?.name || '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Supplier Invoice</h1>
                    <p className="text-slate-600">Compile monthly settlement from received orders</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative">
                        {[1, 2, 3].map((s, idx) => (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center relative z-10">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${step > s
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                            : step === s
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100'
                                                : 'bg-white text-slate-400 border-2 border-slate-200'
                                            }`}
                                    >
                                        {step > s ? <HiOutlineCheckCircle className="h-6 w-6" /> : s}
                                    </div>
                                    <div className={`mt-2 text-xs font-medium ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {s === 1 && 'Select Period'}
                                        {s === 2 && 'Choose Items'}
                                        {s === 3 && 'Review & Create'}
                                    </div>
                                </div>
                                {idx < 2 && (
                                    <div className={`flex-1 h-0.5 mx-4 ${step > s + 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step 1: Select Supplier & Period */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">Supplier & Billing Period</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Supplier</label>
                                <select
                                    value={selectedSupplier}
                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="">Select supplier...</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Period Start</label>
                                    <input
                                        type="date"
                                        value={periodStart}
                                        onChange={(e) => setPeriodStart(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Period End</label>
                                    <input
                                        type="date"
                                        value={periodEnd}
                                        onChange={(e) => setPeriodEnd(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFetchItems}
                                disabled={loading || !selectedSupplier}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Loading...' : 'Fetch Items'}
                                {!loading && <HiOutlineArrowRight className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Select Items */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Eligible Items ({eligibleItems.length})</h2>
                                <p className="text-sm text-slate-600 mt-1">{selectedSupplierName} • {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={handleSelectAll}
                                className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                            >
                                {selectedItems.size === eligibleItems.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        {eligibleItems.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No uninvoiced items found for this supplier and period.</p>
                                <button
                                    onClick={() => setStep(1)}
                                    className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                                >
                                    Try different period
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                                    {eligibleItems.map((item) => (
                                        <label
                                            key={item.grnItemId}
                                            className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.grnItemId)}
                                                onChange={() => handleToggleItem(item.grnItemId)}
                                                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                                            />
                                            <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                                                <div>
                                                    <div className="font-medium text-slate-900">{item.drugName}</div>
                                                    <div className="text-xs text-slate-500">Batch: {item.batchNumber}</div>
                                                </div>
                                                <div className="text-slate-600">
                                                    <div>Qty: {item.receivedQty}</div>
                                                    {item.freeQty > 0 && <div className="text-xs text-emerald-600">+{item.freeQty} free</div>}
                                                </div>
                                                <div className="text-slate-600">
                                                    ₹{Number(item.unitPrice).toFixed(2)}
                                                </div>
                                                <div className="text-slate-600">
                                                    {item.grnNumber}
                                                </div>
                                                <div className="font-semibold text-slate-900 text-right">
                                                    ₹{Number(item.calculatedTotal).toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleReview}
                                        disabled={selectedItems.size === 0}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Review ({selectedItems.size} items)
                                        <HiOutlineArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 3: Review & Create */}
                {step === 3 && reviewData && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">Review Invoice</h2>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl">
                                <div>
                                    <div className="text-sm text-slate-600">Supplier</div>
                                    <div className="font-semibold text-slate-900">{selectedSupplierName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-600">Billing Period</div>
                                    <div className="font-semibold text-slate-900">
                                        {new Date(periodStart).toLocaleDateString()} - {new Date(periodEnd).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-600">Total Items</div>
                                    <div className="font-semibold text-slate-900">{reviewData.count}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-slate-600">Total Amount</div>
                                    <div className="text-2xl font-bold text-emerald-600">
                                        ₹{reviewData.subtotal.toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateInvoice}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Creating...' : 'Create Draft Invoice'}
                                    {!loading && <HiOutlineCheckCircle className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
