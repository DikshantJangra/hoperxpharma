import React from 'react';
import { FiTrash2, FiAlertCircle, FiAlertTriangle } from 'react-icons/fi';
import type { POLine } from '@/lib/calculations/poCalculations';
import type { ValidationResult } from '@/hooks/useEfficientPOComposer';

interface LineItemsTableProps {
    lines: POLine[];
    onUpdate: (lineId: string, updates: Partial<POLine>) => void;
    onRemove: (lineId: string) => void;
    validation: ValidationResult;
}

export default function LineItemsTable({ lines, onUpdate, onRemove, validation }: LineItemsTableProps) {
    const getLineError = (lineId: string) => {
        return validation.errors.find(e => e.lineId === lineId);
    };

    const getLineWarning = (lineId: string) => {
        return validation.warnings.find(w => w.lineId === lineId);
    };

    if (lines.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <p className="text-lg font-medium">No items added yet</p>
                    <p className="text-sm mt-1">Search for products above to add items</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                        <th className="w-8 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                        </th>
                        <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                        </th>
                        <th className="w-32 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                        </th>
                        <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Disc %
                        </th>
                        <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GST %
                        </th>
                        <th className="w-32 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Line Total
                        </th>
                        <th className="w-12 px-3 py-3"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {lines.map((line, index) => {
                        const error = getLineError(line.lineId);
                        const warning = getLineWarning(line.lineId);
                        const lineTotal = line.qty * line.pricePerUnit * (1 - line.discountPercent / 100);

                        return (
                            <tr
                                key={line.lineId}
                                className={`hover:bg-gray-50 ${error ? 'bg-red-50' : warning ? 'bg-yellow-50' : ''}`}
                            >
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        {index + 1}
                                        {error && (
                                            <FiAlertCircle className="text-red-600" size={16} title={error.message} />
                                        )}
                                        {warning && !error && (
                                            <FiAlertTriangle className="text-yellow-600" size={16} title={warning.message} />
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-900">
                                    <div className="font-medium">{line.drugId}</div>
                                    {error && (
                                        <div className="text-xs text-red-600 mt-1">{error.message}</div>
                                    )}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={line.qty}
                                        onChange={(e) => onUpdate(line.lineId, { qty: Number(e.target.value) })}
                                        className={`w-full px-2 py-1 text-right border rounded focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        min="1"
                                    />
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={line.pricePerUnit}
                                        onChange={(e) => onUpdate(line.lineId, { pricePerUnit: Number(e.target.value) })}
                                        className={`w-full px-2 py-1 text-right border rounded focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        min="0"
                                        step="0.01"
                                    />
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <input
                                        type="number"
                                        value={line.discountPercent}
                                        onChange={(e) => onUpdate(line.lineId, { discountPercent: Number(e.target.value) })}
                                        className="w-full px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    <select
                                        value={line.gstPercent}
                                        onChange={(e) => onUpdate(line.lineId, { gstPercent: Number(e.target.value) })}
                                        className={`w-full px-2 py-1 text-right border rounded focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={5}>5%</option>
                                        <option value={12}>12%</option>
                                        <option value={18}>18%</option>
                                        <option value={28}>28%</option>
                                    </select>
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                    ₹{lineTotal.toFixed(2)}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-right">
                                    <button
                                        onClick={() => onRemove(line.lineId)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        title="Remove item"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
