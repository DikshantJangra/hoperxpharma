"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from "react-icons/fi";
import HSNCodeSelector from "@/components/gst/HSNCodeSelector";

interface InvoiceItem {
    id: string;
    medicineName: string;
    hsnCode: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    mrp: number;
    discount: number;
    gstRate: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
}

export default function NewGSTInvoice() {
    const [invoiceType, setInvoiceType] = useState<"B2B" | "B2C" | "Export">("B2B");
    const [customerGSTIN, setCustomerGSTIN] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [placeOfSupply, setPlaceOfSupply] = useState("27"); // Maharashtra
    const [items, setItems] = useState<InvoiceItem[]>([]);

    const addItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            medicineName: "",
            hsnCode: "",
            batchNumber: "",
            expiryDate: "",
            quantity: 1,
            mrp: 0,
            discount: 0,
            gstRate: 12,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalAmount: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                // Recalculate amounts
                const taxableValue = (updated.mrp * updated.quantity) - updated.discount;
                const isInterstate = placeOfSupply !== "27"; // Assuming pharmacy is in Maharashtra (27)

                if (isInterstate) {
                    updated.igst = (taxableValue * updated.gstRate) / 100;
                    updated.cgst = 0;
                    updated.sgst = 0;
                } else {
                    updated.cgst = (taxableValue * updated.gstRate) / 200; // Half of GST
                    updated.sgst = (taxableValue * updated.gstRate) / 200; // Half of GST
                    updated.igst = 0;
                }

                updated.taxableValue = taxableValue;
                updated.totalAmount = taxableValue + updated.cgst + updated.sgst + updated.igst;

                return updated;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        return items.reduce((acc, item) => ({
            taxableValue: acc.taxableValue + item.taxableValue,
            cgst: acc.cgst + item.cgst,
            sgst: acc.sgst + item.sgst,
            igst: acc.igst + item.igst,
            totalAmount: acc.totalAmount + item.totalAmount
        }), { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalAmount: 0 });
    };

    const totals = calculateTotals();

    const handleSave = () => {
        alert("Invoice saved! IRN generation will be triggered for B2B invoices.");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/gst/invoices"
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">New GST Invoice</h1>
                            <p className="text-sm text-gray-500">Create GST-compliant invoice with HSN codes</p>
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <FiSave className="h-4 w-4" />
                            Save & Generate IRN
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Invoice Type & Customer Details */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">Invoice Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Invoice Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Invoice Type
                            </label>
                            <select
                                value={invoiceType}
                                onChange={(e) => setInvoiceType(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="B2B">B2B (Business to Business)</option>
                                <option value="B2C">B2C (Business to Consumer)</option>
                                <option value="Export">Export</option>
                            </select>
                        </div>

                        {/* Customer Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Name *
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Enter customer name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Customer GSTIN */}
                        {invoiceType === "B2B" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Customer GSTIN *
                                </label>
                                <input
                                    type="text"
                                    value={customerGSTIN}
                                    onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                                    placeholder="27AAAAA0000A1Z5"
                                    maxLength={15}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    {/* Place of Supply */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Place of Supply (State Code) *
                            </label>
                            <select
                                value={placeOfSupply}
                                onChange={(e) => setPlaceOfSupply(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="27">27 - Maharashtra</option>
                                <option value="07">07 - Delhi</option>
                                <option value="29">29 - Karnataka</option>
                                <option value="33">33 - Tamil Nadu</option>
                                <option value="19">19 - West Bengal</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Invoice Items */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Invoice Items</h3>
                        <button
                            onClick={addItem}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <FiPlus className="h-4 w-4" />
                            Add Item
                        </button>
                    </div>

                    {items.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No items added yet. Click "Add Item" to start.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={item.id} className="p-4 border-2 border-gray-200 rounded-lg">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="font-semibold text-gray-900">Item #{index + 1}</span>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <FiTrash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Medicine Name */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Medicine Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={item.medicineName}
                                                onChange={(e) => updateItem(item.id, "medicineName", e.target.value)}
                                                placeholder="e.g., Paracetamol 500mg"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* HSN Code */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                HSN Code *
                                            </label>
                                            <HSNCodeSelector
                                                value={item.hsnCode}
                                                onChange={(hsn) => {
                                                    updateItem(item.id, "hsnCode", hsn.code);
                                                    updateItem(item.id, "gstRate", hsn.gstRate);
                                                }}
                                            />
                                        </div>

                                        {/* Batch & Expiry */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Batch Number
                                            </label>
                                            <input
                                                type="text"
                                                value={item.batchNumber}
                                                onChange={(e) => updateItem(item.id, "batchNumber", e.target.value)}
                                                placeholder="B2024-001"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expiry Date
                                            </label>
                                            <input
                                                type="month"
                                                value={item.expiryDate}
                                                onChange={(e) => updateItem(item.id, "expiryDate", e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Quantity & Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity *
                                            </label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                MRP (₹) *
                                            </label>
                                            <input
                                                type="number"
                                                value={item.mrp}
                                                onChange={(e) => updateItem(item.id, "mrp", parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {/* Tax Summary */}
                                        <div className="md:col-span-4 mt-2 p-3 bg-gray-50 rounded-lg">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                                <div>
                                                    <div className="text-gray-600">Taxable Value</div>
                                                    <div className="font-bold text-gray-900">₹{item.taxableValue.toFixed(2)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-600">GST Rate</div>
                                                    <div className="font-bold text-blue-700">{item.gstRate}%</div>
                                                </div>
                                                {placeOfSupply === "27" ? (
                                                    <>
                                                        <div>
                                                            <div className="text-gray-600">CGST</div>
                                                            <div className="font-bold text-gray-900">₹{item.cgst.toFixed(2)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-600">SGST</div>
                                                            <div className="font-bold text-gray-900">₹{item.sgst.toFixed(2)}</div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div>
                                                        <div className="text-gray-600">IGST</div>
                                                        <div className="font-bold text-gray-900">₹{item.igst.toFixed(2)}</div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-gray-600">Total</div>
                                                    <div className="font-bold text-green-700">₹{item.totalAmount.toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Invoice Summary */}
                {items.length > 0 && (
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Invoice Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm text-gray-600 mb-1">Taxable Value</div>
                                <div className="text-xl font-bold text-gray-900">₹{totals.taxableValue.toFixed(2)}</div>
                            </div>
                            {placeOfSupply === "27" ? (
                                <>
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="text-sm text-gray-600 mb-1">CGST</div>
                                        <div className="text-xl font-bold text-blue-900">₹{totals.cgst.toFixed(2)}</div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg">
                                        <div className="text-sm text-gray-600 mb-1">SGST</div>
                                        <div className="text-xl font-bold text-green-900">₹{totals.sgst.toFixed(2)}</div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 bg-amber-50 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">IGST</div>
                                    <div className="text-xl font-bold text-amber-900">₹{totals.igst.toFixed(2)}</div>
                                </div>
                            )}
                            <div className="p-4 bg-green-50 rounded-lg md:col-span-2">
                                <div className="text-sm text-gray-600 mb-1">Grand Total</div>
                                <div className="text-2xl font-bold text-green-900">₹{totals.totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
