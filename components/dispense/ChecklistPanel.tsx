"use client";

import React, { useState } from "react";
import { FiCheck, FiSquare, FiCheckSquare } from "react-icons/fi";

export interface ChecklistItem {
    id: string;
    label: string;
    required: boolean;
    completed: boolean;
    description?: string;
}

interface ChecklistPanelProps {
    title: string;
    items: ChecklistItem[];
    onItemToggle: (itemId: string) => void;
    onComplete?: () => void;
    canComplete?: boolean;
}

export default function ChecklistPanel({
    title,
    items,
    onItemToggle,
    onComplete,
    canComplete = true
}: ChecklistPanelProps) {
    const requiredItems = items.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed).length;
    const allRequiredComplete = requiredItems.length === completedRequired;
    const totalCompleted = items.filter(item => item.completed).length;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <div className="text-sm">
                    <span className={`font-semibold ${allRequiredComplete ? "text-green-700" : "text-amber-700"}`}>
                        {completedRequired}/{requiredItems.length}
                    </span>
                    <span className="text-gray-500 ml-1">required</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${allRequiredComplete ? "bg-green-600" : "bg-blue-600"
                            }`}
                        style={{ width: `${(completedRequired / requiredItems.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${item.completed
                                ? "bg-green-50 border-green-200"
                                : "bg-white border-gray-200 hover:border-gray-300"
                            }`}
                        onClick={() => onItemToggle(item.id)}
                    >
                        <div className="mt-0.5">
                            {item.completed ? (
                                <FiCheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                                <FiSquare className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`font-medium ${item.completed ? "text-green-900 line-through" : "text-gray-900"
                                        }`}
                                >
                                    {item.label}
                                </span>
                                {item.required && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                        Required
                                    </span>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Complete Button */}
            {onComplete && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                        onClick={onComplete}
                        disabled={!allRequiredComplete || !canComplete}
                        className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${allRequiredComplete && canComplete
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        <FiCheck className="h-5 w-5" />
                        {allRequiredComplete ? "Complete Step" : "Complete Required Items First"}
                    </button>
                </div>
            )}
        </div>
    );
}
