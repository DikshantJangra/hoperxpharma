"use client";

import React, { useState, useEffect } from "react";
import { FiX, FiCheckSquare, FiSquare, FiClock, FiUser, FiFileText } from "react-icons/fi";
import { DispenseStep } from "./QueueTabs";

interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

interface DispenseContextDrawerProps {
    prescription: any;
    step: DispenseStep;
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
}

const DrawerSkeleton = () => (
     <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col animate-pulse">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded-md w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
         {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Checklist */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="mb-4 h-2 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                </div>
            </div>
             {/* History */}
             <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="space-y-3">
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg h-16"></div>
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg h-12"></div>
                </div>
            </div>
        </div>
    </div>
)


export default function DispenseContextDrawer({ prescription, step, isOpen, onClose, isLoading }: DispenseContextDrawerProps) {
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [history, setHistory] = useState<any>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (prescription) {
            setIsDataLoading(true);
            const timer = setTimeout(() => {
                // Fetch checklist and history based on prescription and step
                setChecklist([]);
                setHistory(null);
                setIsDataLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setChecklist([]);
            setHistory(null);
        }
    }, [prescription, step]);


    const toggleItem = (id: string) => {
        setChecklist(prev =>
            prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
        );
    };

    if (!isOpen) return null;

    if (isLoading) {
        return <DrawerSkeleton />;
    }

    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;

    return (
        <div className="w-96 h-full bg-white border-l border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Context</h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiX className="h-5 w-5 text-gray-600" />
                </button>
            </div>

            {/* Content */}
             <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {!prescription ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <FiFileText className="h-12 w-12 mx-auto mb-3" />
                            <p>No prescription selected</p>
                        </div>
                    </div>
                ) : isDataLoading ? (
                     <div className="space-y-6 pt-4">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-12 bg-gray-100 rounded-lg"></div>
                            <div className="h-12 bg-gray-100 rounded-lg"></div>
                        </div>
                         <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-16 bg-gray-100 rounded-lg"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Checklist */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900 text-sm uppercase">Checklist</h4>
                                {totalCount > 0 && (
                                    <span className="text-sm">
                                        <span className="font-bold text-blue-700">{completedCount}</span>
                                        <span className="text-gray-500">/{totalCount}</span>
                                    </span>
                                )}
                            </div>
                            {totalCount > 0 &&
                                <div className="mb-4">
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            }
                            <div className="space-y-2">
                                {checklist.length > 0 ? checklist.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${item.completed
                                                ? "bg-green-50 border-green-200"
                                                : "bg-white border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <div className="mt-0.5">
                                            {item.completed ? (
                                                <FiCheckSquare className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <FiSquare className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${item.completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                )) : <p className="text-sm text-gray-500 text-center py-4">No checklist for this step.</p>}
                            </div>
                        </div>
                        {/* Patient History */}
                         <div>
                            <h4 className="font-semibold text-gray-900 text-sm uppercase mb-3">Patient History</h4>
                             {history ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                            <FiClock className="h-4 w-4" />
                                            <span>Last Visit: {history.lastVisit}</span>
                                        </div>
                                        <div className="text-sm text-gray-900">
                                            Previous Rx: {history.previousRx.join(', ')}
                                        </div>
                                    </div>
                                     {history.allergies.length > 0 &&
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="text-sm font-semibold text-red-900 mb-1">Known Allergies</div>
                                            <div className="text-sm text-red-800">{history.allergies.join(', ')}</div>
                                        </div>
                                    }
                                </div>
                             ) : <p className="text-sm text-gray-500 text-center py-4">No history found.</p>}
                        </div>
                         {/* Notes */}
                        <div>
                            <h4 className="font-semibold text-gray-900 text-sm uppercase mb-3">Notes</h4>
                            <textarea
                                placeholder="Add notes about this prescription..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={4}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
