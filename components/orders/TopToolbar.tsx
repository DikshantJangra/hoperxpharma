import React from 'react';
import { FiSave, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { SaveStatus } from '@/hooks/useEfficientPOComposer';

interface TopToolbarProps {
    poNumber?: string;
    status: string;
    saveStatus: SaveStatus;
    loading: boolean;
    onSave: () => void;
    onSend: () => void;
    onRequestApproval: () => void;
    total: number;
    needsApproval: boolean;
}

export default function TopToolbar({
    poNumber,
    status,
    saveStatus,
    loading,
    onSave,
    onSend,
    onRequestApproval,
    total,
    needsApproval
}: TopToolbarProps) {
    const getSaveStatusIcon = () => {
        switch (saveStatus) {
            case 'saved':
                return <FiCheckCircle className="text-green-600" size={16} />;
            case 'syncing':
                return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />;
            case 'unsaved':
                return <div className="h-2 w-2 rounded-full bg-orange-500" />;
        }
    };

    const getSaveStatusText = () => {
        switch (saveStatus) {
            case 'saved':
                return 'All changes saved';
            case 'syncing':
                return 'Saving...';
            case 'unsaved':
                return 'Unsaved changes';
        }
    };

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="px-6 py-3 flex items-center justify-between">
                {/* Left: PO Info */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {poNumber ? `PO #${poNumber}` : 'New Purchase Order'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                                {status === 'draft' ? 'Draft' : status}
                            </span>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                {getSaveStatusIcon()}
                                <span>{getSaveStatusText()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Save Draft */}
                    <button
                        onClick={onSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all"
                        title="Save Draft (Ctrl+S)"
                    >
                        <FiSave size={16} />
                        Save Draft
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                            ⌘S
                        </kbd>
                    </button>

                    {/* Request Approval or Send */}
                    {needsApproval ? (
                        <button
                            onClick={onRequestApproval}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all"
                            title="Request Approval (Ctrl+Shift+Enter)"
                        >
                            <FiAlertCircle size={16} />
                            Request Approval
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-blue-700 border border-blue-800 rounded">
                                ⌘⇧↵
                            </kbd>
                        </button>
                    ) : (
                        <button
                            onClick={onSend}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all"
                            title="Send Order (Ctrl+Enter)"
                        >
                            <FiSend size={16} />
                            Send Order
                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono bg-emerald-700 border border-emerald-800 rounded">
                                ⌘↵
                            </kbd>
                        </button>
                    )}

                    {/* Total Amount Badge */}
                    <div className="ml-2 px-4 py-2 bg-gray-100 rounded-lg">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-lg font-bold text-gray-900">
                            ₹{total.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
