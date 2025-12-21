"use client";

import React from "react";
import { FiAlertCircle, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

interface Drug {
    id: string;
    name: string;
    dosage: string;
    quantity: number;
    instructions: string;
    stockAvailable: boolean;
    stockLevel?: "high" | "low" | "out";
    batchNumber?: string;  // Add batch info
    expiryDate?: string;   // Add expiry info
}

interface DrugListProps {
    drugs: Drug[];
    showStock?: boolean;
    compact?: boolean;
}

export default function DrugList({ drugs, showStock = true, compact = false }: DrugListProps) {
    const getStockIndicator = (drug: Drug) => {
        if (!drug.stockAvailable) {
            return {
                icon: FiAlertCircle,
                color: "text-red-600",
                bg: "bg-red-50",
                label: "Out of Stock"
            };
        }

        if (drug.stockLevel === "low") {
            return {
                icon: FiAlertTriangle,
                color: "text-amber-600",
                bg: "bg-amber-50",
                label: "Low Stock"
            };
        }

        return {
            icon: FiCheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
            label: "In Stock"
        };
    };

    if (compact) {
        return (
            <div className="space-y-2">
                {drugs.map((drug) => {
                    const stock = getStockIndicator(drug);
                    const StockIcon = stock.icon;

                    return (
                        <div key={drug.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1">
                                {showStock && (
                                    <StockIcon className={`h-4 w-4 ${stock.color} shrink-0`} />
                                )}
                                <span className="font-medium text-gray-900">{drug.name}</span>
                                <span className="text-gray-500">×{drug.quantity}</span>
                            </div>
                            <span className="text-gray-600 text-xs">{drug.dosage}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {drugs.map((drug) => {
                const stock = getStockIndicator(drug);
                const StockIcon = stock.icon;

                return (
                    <div
                        key={drug.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{drug.name}</h4>
                                <p className="text-sm text-gray-600">{drug.dosage}</p>
                                {/* Display batch information if available */}
                                {(drug.batchNumber || drug.expiryDate) && (
                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                        {drug.batchNumber && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                <span className="font-semibold mr-1">Batch:</span> {drug.batchNumber}
                                            </span>
                                        )}
                                        {drug.expiryDate && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                                <span className="font-semibold mr-1">Exp:</span> {new Date(drug.expiryDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">×{drug.quantity}</div>
                                {showStock && (
                                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${stock.bg} ${stock.color}`}>
                                        <StockIcon className="h-3 w-3" />
                                        {stock.label}
                                    </div>
                                )}
                            </div>
                        </div>
                        {drug.instructions && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Instructions:</span> {drug.instructions}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
