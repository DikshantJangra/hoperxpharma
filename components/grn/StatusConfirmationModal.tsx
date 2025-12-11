import { useState } from 'react';
import { HiX, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

interface StatusOption {
    value: 'COMPLETED' | 'PARTIALLY_RECEIVED';
    label: string;
    description: string;
    icon: React.ReactNode;
    recommended?: boolean;
}

interface StatusConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: 'COMPLETED' | 'PARTIALLY_RECEIVED') => void;
    currentStatus: string;
    recommendedStatus: 'COMPLETED' | 'PARTIALLY_RECEIVED';
    invoiceNo?: string;
    invoiceDate?: string;
    totalOrdered: number;
    totalReceived: number;
    hasShortages: boolean;
    isSubmitting: boolean;
}

export default function StatusConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    currentStatus,
    recommendedStatus,
    invoiceNo,
    invoiceDate,
    totalOrdered,
    totalReceived,
    hasShortages,
    isSubmitting
}: StatusConfirmationModalProps) {
    const [selectedStatus, setSelectedStatus] = useState<'COMPLETED' | 'PARTIALLY_RECEIVED'>(recommendedStatus);

    if (!isOpen) return null;

    const statusOptions: StatusOption[] = [
        {
            value: 'COMPLETED',
            label: 'Completed',
            description: hasShortages
                ? 'Mark as fully received (override - discrepancies resolved with supplier)'
                : 'All items fully received as ordered',
            icon: <HiCheckCircle className="h-5 w-5 text-green-500" />,
            recommended: recommendedStatus === 'COMPLETED'
        },
        {
            value: 'PARTIALLY_RECEIVED',
            label: 'Partially Received',
            description: 'Some items have discrepancies (shortages or overages)',
            icon: <HiExclamationCircle className="h-5 w-5 text-yellow-500" />,
            recommended: recommendedStatus === 'PARTIALLY_RECEIVED'
        }
    ];

    // Show all options - user can override if needed
    const availableOptions = statusOptions;

    const handleConfirm = () => {
        onConfirm(selectedStatus);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Confirm GRN Completion</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <HiX className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Current Status */}
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Current Status</p>
                        <p className="text-lg font-medium text-gray-900">{currentStatus}</p>
                    </div>

                    {/* Quantity Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Total Ordered</p>
                                <p className="text-lg font-semibold text-gray-900">{totalOrdered}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Total Received</p>
                                <p className="text-lg font-semibold text-gray-900">{totalReceived}</p>
                            </div>
                        </div>
                        {hasShortages && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-yellow-700 font-medium">
                                    ⚠️ {totalReceived > totalOrdered
                                        ? `Overage: ${totalReceived - totalOrdered} extra units received`
                                        : `Shortage: ${totalOrdered - totalReceived} units short`
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Status Selection - Only show if there are shortages/issues */}
                    {hasShortages ? (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">Select New Status</p>
                            <div className="space-y-3">
                                {availableOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedStatus === option.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="status"
                                            value={option.value}
                                            checked={selectedStatus === option.value}
                                            onChange={(e) => setSelectedStatus(e.target.value as any)}
                                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center gap-2">
                                                {option.icon}
                                                <span className="font-medium text-gray-900">{option.label}</span>
                                                {option.recommended && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                                        Recommended
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Override Warning */}
                            {selectedStatus === 'COMPLETED' && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        <span className="font-medium">⚠️ Override:</span> You are marking this as completed despite shortages.
                                        Only do this if discrepancies have been resolved with the supplier.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* No shortages - Show simple transition message */
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3">
                            <HiCheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-emerald-900">Ready to Complete</p>
                                <p className="text-sm text-emerald-700">
                                    All items matched. Changing status from <span className="font-semibold">{currentStatus}</span> → <span className="font-semibold">Completed</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Invoice Summary */}
                    {(invoiceNo || invoiceDate) && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <p className="text-sm font-medium text-blue-900 mb-2">Invoice Details</p>
                            <div className="space-y-1 text-sm">
                                {invoiceNo && (
                                    <p className="text-blue-700">
                                        <span className="font-medium">Number:</span> {invoiceNo}
                                    </p>
                                )}
                                {invoiceDate && (
                                    <p className="text-blue-700">
                                        <span className="font-medium">Date:</span> {invoiceDate}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedStatus || isSubmitting}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            'Confirm & Complete'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
