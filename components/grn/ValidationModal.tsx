'use client';

import React from 'react';
import { HiOutlineXMark, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

interface ValidationError {
    field: string;
    message: string;
    itemId?: string;
    drugName?: string;
}

interface ValidationModalProps {
    errors: ValidationError[];
    onClose: () => void;
}

export default function ValidationModal({ errors, onClose }: ValidationModalProps) {
    // Group errors by type
    const invoiceErrors = errors.filter(e => ['invoiceNo', 'invoiceDate'].includes(e.field));
    const itemErrors = errors.filter(e => e.itemId);
    const generalErrors = errors.filter(e => !e.itemId && !['invoiceNo', 'invoiceDate'].includes(e.field));

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onKeyDown={handleKeyDown}
            data-focus-trap="true"
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <HiOutlineExclamationTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Validation Errors</h2>
                            <p className="text-sm text-gray-600">Please fix the following issues before completing</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <HiOutlineXMark className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Invoice Errors */}
                    {invoiceErrors.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Invoice Details</h3>
                            <div className="space-y-2">
                                {invoiceErrors.map((error, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                        <span className="font-medium">•</span>
                                        <span>{error.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* General Errors */}
                    {generalErrors.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">General Issues</h3>
                            <div className="space-y-2">
                                {generalErrors.map((error, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                        <span className="font-medium">•</span>
                                        <span>{error.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Item Errors */}
                    {itemErrors.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Item Issues ({itemErrors.length})</h3>
                            <div className="space-y-2">
                                {itemErrors.map((error, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                        <span className="font-medium">•</span>
                                        <div>
                                            {error.drugName && <span className="font-medium">{error.drugName}: </span>}
                                            <span>{error.message}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            {errors.length} {errors.length === 1 ? 'issue' : 'issues'} found
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Fix Issues
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
