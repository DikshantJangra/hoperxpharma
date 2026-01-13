import React, { useState } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

interface LiveSummaryPanelProps {
    totalItems: number;
    verifiedItems: number;
    totalValue?: number;
    showFinancials?: boolean;
}

export default function LiveSummaryPanel({ 
    totalItems, 
    verifiedItems, 
    totalValue = 0,
    showFinancials = false 
}: LiveSummaryPanelProps) {
    const [expanded, setExpanded] = useState(false);
    const progressPercent = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Progress</h3>
            
            {/* Progress */}
            <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Items Verified</span>
                    <span className="font-semibold text-gray-900">{verifiedItems} / {totalItems}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="text-right text-xs text-gray-500">{progressPercent}% complete</div>
            </div>

            {/* Financial Summary (Collapsible) */}
            {showFinancials && (
                <div className="border-t border-gray-200 pt-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center justify-between w-full text-xs text-gray-600 hover:text-gray-900"
                    >
                        <span className="font-medium">Financial Summary</span>
                        {expanded ? <HiChevronUp className="w-3 h-3" /> : <HiChevronDown className="w-3 h-3" />}
                    </button>
                    {expanded && (
                        <div className="mt-2 space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Value</span>
                                <span className="font-medium text-gray-900">₹{totalValue.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
