import React, { useState, useEffect } from 'react';
import { IoClose, IoWarningOutline, IoCheckmarkCircleOutline, IoFlaskOutline, IoFlash } from 'react-icons/io5';
import { FiAlertTriangle } from 'react-icons/fi';
import { saltApi } from '@/lib/api/salt';

interface SaltAlternativesPanelProps {
    originalDrug: any; // The drug that is out of stock
    storeId: string;
    onSelectAlternative: (product: any) => void;
    onClose: () => void;
}

export default function SaltAlternativesPanel({
    originalDrug,
    storeId,
    onSelectAlternative,
    onClose
}: SaltAlternativesPanelProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAlternatives = async () => {
            try {
                setLoading(true);
                const result = await saltApi.getAlternatives(originalDrug.id, storeId);
                setData(result);
            } catch (err: any) {
                console.error('Failed to fetch alternatives:', err);
                setError('Could not load alternatives. Please try again.');
                // Fallback or retry logic could go here
            } finally {
                setLoading(false);
            }
        };

        if (originalDrug?.id && storeId) {
            fetchAlternatives();
        }
    }, [originalDrug, storeId]);

    if (!originalDrug) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-emerald-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <IoFlaskOutline className="w-6 h-6 text-emerald-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Molecule Intelligence</h2>
                            <p className="text-sm text-emerald-800">
                                Found alternatives for <span className="font-semibold">{originalDrug.name}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-emerald-100 rounded-full transition-colors">
                        <IoClose className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            <p className="text-gray-500 animate-pulse">Analyzing chemical composition...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FiAlertTriangle className="w-12 h-12 text-red-400 mb-3" />
                            <p className="text-gray-900 font-medium">{error}</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Original Drug Context */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Requested Medicine (Out of Stock)</div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{data?.originalDrug?.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {data?.originalDrug?.salts?.map((salt: any, i: number) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    {salt.name} <span className="ml-1 text-gray-500">({salt.strength})</span>
                                                </span>
                                            ))}
                                            {(!data?.originalDrug?.salts || data.originalDrug.salts.length === 0) && (
                                                <span className="text-sm text-red-500 italic flex items-center gap-1">
                                                    <FiAlertTriangle className="w-3 h-3" /> No salt data available
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">OUT OF STOCK</span>
                                    </div>
                                </div>
                            </div>

                            {/* Alternatives List */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                                    <span>Safe Alternatives ({data?.alternatives?.length || 0})</span>
                                    <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded border">
                                        Filtered by: Exact Salt Match • In Stock
                                    </span>
                                </h3>

                                {data?.alternatives?.length === 0 ? (
                                    <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
                                        <p className="text-gray-500">No safe alternatives found in stock.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data?.alternatives?.map((alt: any) => (
                                            <div
                                                key={alt.drugId}
                                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow hover:border-emerald-300 group"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-lg text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                                {alt.name}
                                                            </h4>
                                                            {alt.isGeneric && (
                                                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Generic</span>
                                                            )}
                                                        </div>

                                                        <div className="text-sm text-gray-500 mt-0.5">{alt.manufacturer}</div>

                                                        <div className="flex items-center gap-4 mt-2">
                                                            {/* Strength Check */}
                                                            {alt.strengthMatch === 'EXACT' ? (
                                                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                    <IoCheckmarkCircleOutline /> Exact Strength
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                                    <IoWarningOutline /> Different Strength
                                                                </span>
                                                            )}

                                                            {/* Form Check */}
                                                            {alt.formMatch ? (
                                                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                    <IoCheckmarkCircleOutline /> Same Form ({alt.form})
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                                                                    <FiAlertTriangle /> Form Mismatch ({alt.form})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        <div>
                                                            <span className="text-xl font-bold text-gray-900">₹{alt.mrp}</span>
                                                            {alt.priceDifference !== 0 && (
                                                                <div className={`text-xs font-medium ${alt.priceDifference > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                                    {alt.priceDifference > 0 ? '+' : ''}{alt.priceDifference.toFixed(2)} ({alt.priceDifference > 0 ? '+' : ''}{alt.priceDifferencePercent}%)
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {alt.totalStock} in stock • {alt.batches.length} batches
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                onSelectAlternative({
                                                                    ...alt,
                                                                    id: alt.drugId, // Map drugId to id for POS compatibility
                                                                    batches: alt.batches.length,
                                                                    batchCount: alt.batches.length,
                                                                    batchId: alt.batches[0]?.id, // Auto-select first batch (FEFO)
                                                                    batchNumber: alt.batches[0]?.batchNumber,
                                                                    expiryDate: alt.batches[0]?.expiryDate,
                                                                    stock: alt.totalStock // Ensure stock is mapped
                                                                });
                                                                onClose();
                                                            }}
                                                            className="bg-[#0ea5a3] hover:bg-[#0d9391] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm active:scale-95"
                                                        >
                                                            Select Substitute
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                    <span className="flex items-center gap-1">
                        <IoFlash className="w-3 h-3 text-amber-500" /> Powered by Salt Intelligence™
                    </span>
                    <span>Always verify dosage and strength before dispensing.</span>
                </div>

            </div>
        </div>
    );
}
