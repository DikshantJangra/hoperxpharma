"use client";

import React from "react";
import { FiClock, FiAlertCircle } from "react-icons/fi";
import { DispenseStep } from "./QueueTabs";

interface QueueItem {
    id: string;
    patientName: string;
    rxId: string;
    timeInQueue: number; // minutes
    priority: "normal" | "urgent";
    isControlled?: boolean;
    drugCount: number;
}

interface QueueListProps {
    step: DispenseStep;
    items: QueueItem[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

export default function QueueList({ step, items, selectedId, onSelect }: QueueListProps) {
    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (items.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                    <FiAlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="font-medium">No items in queue</p>
                    <p className="text-sm mt-1">All prescriptions processed</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {items.map((item, index) => {
                const isSelected = item.id === selectedId;
                const isOverdue = item.timeInQueue > 60;

                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={`w-full px-4 py-3 border-b border-gray-200 text-left transition-all ${isSelected
                                ? "bg-blue-50 border-l-4 border-l-blue-600"
                                : "hover:bg-gray-50 border-l-4 border-l-transparent"
                            } ${item.priority === "urgent" ? "bg-red-50/50" : ""}`}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 text-sm mb-1">
                                    {item.patientName}
                                </div>
                                <div className="text-xs text-gray-600">Rx #{item.rxId}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {item.priority === "urgent" && (
                                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                                        URGENT
                                    </span>
                                )}
                                {item.isControlled && (
                                    <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded">
                                        CS
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{item.drugCount} items</span>
                            <div
                                className={`flex items-center gap-1 ${isOverdue ? "text-red-700 font-semibold" : "text-gray-600"
                                    }`}
                            >
                                <FiClock className="h-3 w-3" />
                                {formatTime(item.timeInQueue)}
                            </div>
                        </div>

                        {/* Position indicator */}
                        {!isSelected && (
                            <div className="text-xs text-gray-400 mt-1">#{index + 1} in queue</div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
