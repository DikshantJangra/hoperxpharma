"use client";

import { useState } from "react";
import { FiPlus, FiTrash2, FiSend, FiPackage, FiTruck, FiCheckCircle, FiXCircle } from "react-icons/fi";

type TransferStatus = "pending" | "in-transit" | "received" | "rejected";

interface TransferItem {
    id: string;
    medicineId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    available: number;
    expiryDate: string;
}

interface Transfer {
    id: string;
    transferNumber: string;
    fromStore: string;
    toStore: string;
    items: TransferItem[];
    reason: string;
    status: TransferStatus;
    createdAt: Date;
    createdBy: string;
}

const STORES = [
    { id: "1", name: "HopeRx Main Branch" },
    { id: "2", name: "HopeRx Andheri" },
    { id: "3", name: "HopeRx Thane" },
    { id: "4", name: "HopeRx Pune" }
];

const MOCK_TRANSFERS: Transfer[] = [
    {
        id: "1",
        transferNumber: "TRF-2024-001",
        fromStore: "HopeRx Main Branch",
        toStore: "HopeRx Andheri",
        items: [
            {
                id: "1",
                medicineId: "m1",
                medicineName: "Paracetamol 500mg",
                batchNumber: "B2024-001",
                quantity: 100,
                available: 500,
                expiryDate: "2025-06"
            }
        ],
        reason: "Stock balancing",
        status: "in-transit",
        createdAt: new Date("2024-11-20"),
        createdBy: "Admin"
    },
    {
        id: "2",
        transferNumber: "TRF-2024-002",
        fromStore: "HopeRx Thane",
        toStore: "HopeRx Main Branch",
        items: [
            {
                id: "2",
                medicineId: "m2",
                medicineName: "Amoxicillin 250mg",
                batchNumber: "B2024-045",
                quantity: 50,
                available: 200,
                expiryDate: "2025-03"
            }
        ],
        reason: "Expiry management",
        status: "received",
        createdAt: new Date("2024-11-18"),
        createdBy: "Manager"
    }
];

const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        icon: FiPackage,
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200"
    },
    "in-transit": {
        label: "In Transit",
        icon: FiTruck,
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200"
    },
    received: {
        label: "Received",
        icon: FiCheckCircle,
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200"
    },
    rejected: {
        label: "Rejected",
        icon: FiXCircle,
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200"
    }
};

export default function TransferPage() {
    const [fromStore, setFromStore] = useState("");
    const [toStore, setToStore] = useState("");
    const [items, setItems] = useState<TransferItem[]>([]);
    const [reason, setReason] = useState("Stock balancing");
    const [showHistory, setShowHistory] = useState(true);

    const addItem = () => {
        const newItem: TransferItem = {
            id: Date.now().toString(),
            medicineId: "",
            medicineName: "",
            batchNumber: "",
            quantity: 0,
            available: 0,
            expiryDate: ""
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof TransferItem, value: any) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleCreateTransfer = () => {
        if (!fromStore || !toStore || items.length === 0) {
            alert("Please fill all required fields");
            return;
        }
        alert("Transfer created successfully!");
        // Reset form
        setFromStore("");
        setToStore("");
        setItems([]);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Inter-Store Transfer</h1>
                    <p className="text-sm text-[#64748b]">Multi-Store › Transfer</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Transfer Form */}
                    <div>
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-xl font-bold text-[#0f172a] mb-6">New Transfer</h2>

                            {/* Store Selection */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">From Store *</label>
                                    <select
                                        value={fromStore}
                                        onChange={(e) => setFromStore(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    >
                                        <option value="">Select store</option>
                                        {STORES.map((store) => (
                                            <option key={store.id} value={store.name} disabled={store.name === toStore}>
                                                {store.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">To Store *</label>
                                    <select
                                        value={toStore}
                                        onChange={(e) => setToStore(e.target.value)}
                                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                    >
                                        <option value="">Select store</option>
                                        {STORES.map((store) => (
                                            <option key={store.id} value={store.name} disabled={store.name === fromStore}>
                                                {store.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Reason</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                >
                                    <option>Stock balancing</option>
                                    <option>Expiry management</option>
                                    <option>Customer request</option>
                                    <option>Emergency requirement</option>
                                </select>
                            </div>

                            {/* Items */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-semibold text-[#0f172a]">Items to Transfer</label>
                                    <button
                                        onClick={addItem}
                                        className="px-3 py-1.5 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Add Item
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <div className="p-8 border-2 border-dashed border-[#cbd5e1] rounded-lg text-center text-[#94a3b8]">
                                        No items added yet. Click "Add Item" to start.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="p-4 border-2 border-[#e2e8f0] rounded-lg">
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className="text-sm font-semibold text-[#0f172a]">Item #{index + 1}</span>
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="col-span-2">
                                                        <input
                                                            type="text"
                                                            value={item.medicineName}
                                                            onChange={(e) => updateItem(item.id, "medicineName", e.target.value)}
                                                            placeholder="Medicine name"
                                                            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm"
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={item.batchNumber}
                                                        onChange={(e) => updateItem(item.id, "batchNumber", e.target.value)}
                                                        placeholder="Batch #"
                                                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={item.quantity || ""}
                                                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                                        placeholder="Quantity"
                                                        className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                onClick={handleCreateTransfer}
                                className="w-full px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2"
                            >
                                <FiSend className="w-5 h-5" />
                                Create Transfer
                            </button>
                        </div>
                    </div>

                    {/* Transfer History */}
                    <div>
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                            <h2 className="text-xl font-bold text-[#0f172a] mb-6">Recent Transfers</h2>

                            <div className="space-y-4">
                                {MOCK_TRANSFERS.map((transfer) => {
                                    const config = STATUS_CONFIG[transfer.status];
                                    const Icon = config.icon;

                                    return (
                                        <div key={transfer.id} className="p-4 border-2 border-[#e2e8f0] rounded-lg hover:border-[#cbd5e1] transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="font-mono font-semibold text-[#0f172a] mb-1">{transfer.transferNumber}</div>
                                                    <div className="text-sm text-[#64748b]">
                                                        {transfer.fromStore} → {transfer.toStore}
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 ${config.bg} ${config.text} rounded-full text-xs font-bold flex items-center gap-1`}>
                                                    <Icon className="w-3 h-3" />
                                                    {config.label}
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                {transfer.items.map((item) => (
                                                    <div key={item.id} className="text-sm">
                                                        <span className="font-medium text-[#0f172a]">{item.medicineName}</span>
                                                        <span className="text-[#64748b]"> × {item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                                                <span>{transfer.reason}</span>
                                                <span>{transfer.createdAt.toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
