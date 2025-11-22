"use client";

import React, { useState, useEffect } from "react";
import { FiEdit2, FiSave, FiPlus } from "react-icons/fi";

interface TaxSlab {
    id: string;
    hsnCode: string;
    category: string;
    gstRate: number;
    description: string;
}

const SlabRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-md w-24 mx-auto"></div></td>
    </tr>
)

export default function TaxSlabManagementPage() {
    const [taxSlabs, setTaxSlabs] = useState<TaxSlab[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setTaxSlabs([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const handleEdit = (id: string) => {
        setEditingId(id);
    };

    const handleSave = () => {
        setEditingId(null);
        alert("Tax slab updated successfully!");
    };

    const handleUpdate = (id: string, field: keyof TaxSlab, value: any) => {
        setTaxSlabs(taxSlabs.map(slab =>
            slab.id === id ? { ...slab, [field]: value } : slab
        ));
    };

    const addNewSlab = () => {
        const newSlab: TaxSlab = {
            id: Date.now().toString(),
            hsnCode: "",
            category: "",
            gstRate: 12,
            description: ""
        };
        setTaxSlabs([...taxSlabs, newSlab]);
        setEditingId(newSlab.id);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tax Slab Management</h1>
                            <p className="text-sm text-gray-500">Manage GST rates for different medicine categories</p>
                        </div>
                        <button
                            onClick={addNewSlab}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <FiPlus className="h-4 w-4" />
                            Add Tax Slab
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Info Banner */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">GST Rates for Medicines in India</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• <strong>0%</strong>: Life-saving drugs (37 specific drugs), contraceptives, blood products</li>
                        <li>• <strong>5%</strong>: Essential medicines, vaccines, insulin, ORS, AYUSH (unbranded)</li>
                        <li>• <strong>12%</strong>: Standard medicines, general pharmaceutical products</li>
                        <li>• <strong>18%</strong>: Medical devices, diagnostic tools, AYUSH (branded)</li>
                    </ul>
                </div>

                {/* Tax Slabs Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HSN Code</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">GST Rate</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <>
                                    <SlabRowSkeleton/>
                                    <SlabRowSkeleton/>
                                    <SlabRowSkeleton/>
                                </>
                            ) : taxSlabs.length > 0 ? (
                                taxSlabs.map((slab) => (
                                    <tr key={slab.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            {editingId === slab.id ? (
                                                <input
                                                    type="text"
                                                    value={slab.hsnCode}
                                                    onChange={(e) => handleUpdate(slab.id, "hsnCode", e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded font-mono text-sm"
                                                />
                                            ) : (
                                                <span className="font-mono font-semibold text-gray-900">{slab.hsnCode}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === slab.id ? (
                                                <input
                                                    type="text"
                                                    value={slab.category}
                                                    onChange={(e) => handleUpdate(slab.id, "category", e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-900">{slab.category}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === slab.id ? (
                                                <input
                                                    type="text"
                                                    value={slab.description}
                                                    onChange={(e) => handleUpdate(slab.id, "description", e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-600">{slab.description}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === slab.id ? (
                                                <select
                                                    value={slab.gstRate}
                                                    onChange={(e) => handleUpdate(slab.id, "gstRate", parseInt(e.target.value))}
                                                    className="px-3 py-1 border border-gray-300 rounded font-semibold"
                                                >
                                                    <option value={0}>0%</option>
                                                    <option value={5}>5%</option>
                                                    <option value={12}>12%</option>
                                                    <option value={18}>18%</option>
                                                </select>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${slab.gstRate === 0 ? "bg-gray-100 text-gray-700" :
                                                        slab.gstRate === 5 ? "bg-green-100 text-green-700" :
                                                            slab.gstRate === 12 ? "bg-blue-100 text-blue-700" :
                                                                "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {slab.gstRate}%
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {editingId === slab.id ? (
                                                <button
                                                    onClick={handleSave}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                                                >
                                                    <FiSave className="h-4 w-4" />
                                                    Save
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(slab.id)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
                                                >
                                                    <FiEdit2 className="h-4 w-4" />
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">No tax slabs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
