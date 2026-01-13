import React from 'react';
import { HiOutlineDocumentText, HiOutlineCalendar, HiOutlineUser } from 'react-icons/hi2';

interface POSummaryCardProps {
    poNumber: string;
    supplierName: string;
    orderDate?: string;
    expectedDate?: string;
    totalItems: number;
}

export default function POSummaryCard({ 
    poNumber, 
    supplierName, 
    orderDate,
    expectedDate,
    totalItems 
}: POSummaryCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sticky top-4">
            {/* Compact header with icon */}
            <div className="flex items-center gap-2 mb-3">
                <HiOutlineDocumentText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900">Purchase Order</h3>
            </div>
            
            {/* PO Number prominently displayed */}
            <div className="mb-3">
                <div className="text-xs text-gray-500 mb-1">PO Number</div>
                <div className="text-base font-bold text-gray-900 truncate">{poNumber}</div>
            </div>

            {/* Summary details below PO Number */}
            <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-medium text-gray-900 truncate ml-2 max-w-[120px]" title={supplierName}>
                        {supplierName}
                    </span>
                </div>

                {orderDate && (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500">Order Date</span>
                        <span className="font-medium text-gray-900">
                            {new Date(orderDate).toLocaleDateString()}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Total Items</span>
                    <span className="font-semibold text-gray-900">{totalItems}</span>
                </div>
            </div>
        </div>
    );
}
