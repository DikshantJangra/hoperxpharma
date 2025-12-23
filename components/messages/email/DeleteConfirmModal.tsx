'use client';

import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    accountEmail: string;
    isPrimary: boolean;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    accountEmail,
    isPrimary
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiAlertTriangle className="w-8 h-8 text-[#dc2626]" />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-[#0f172a] text-center mb-3">
                            Delete Email Account?
                        </h2>

                        {/* Description */}
                        <div className="space-y-3 mb-6">
                            <p className="text-[#64748b] text-center">
                                Are you sure you want to delete this email account?
                            </p>
                            <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                                <p className="text-sm font-mono text-[#0f172a] text-center break-all">
                                    {accountEmail}
                                </p>
                            </div>

                            {isPrimary && (
                                <div className="p-3 bg-[#fef3c7] border border-[#fbbf24] rounded-lg">
                                    <p className="text-sm text-[#78350f]">
                                        <strong>Warning:</strong> This is your primary account. Another account will automatically become primary after deletion.
                                    </p>
                                </div>
                            )}

                            <p className="text-sm text-[#94a3b8] text-center">
                                This action cannot be undone.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-[#e2e8f0] text-[#64748b] font-medium rounded-lg hover:bg-[#f8fafc] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-2.5 bg-[#dc2626] text-white font-medium rounded-lg hover:bg-[#b91c1c] transition-colors"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
