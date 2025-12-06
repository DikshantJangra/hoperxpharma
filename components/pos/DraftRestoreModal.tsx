'use client';

import { FiClock, FiX } from 'react-icons/fi';

interface DraftRestoreModalProps {
    draftDate: string;
    onRestore: () => void;
    onDiscard: () => void;
}

export default function DraftRestoreModal({ draftDate, onRestore, onDiscard }: DraftRestoreModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                        <FiClock className="w-5 h-5 text-[#0ea5a3]" />
                        <h3 className="text-lg font-bold text-[#0f172a]">Unsaved Draft Found</h3>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-[#64748b] mb-2">
                        You have an unsaved draft from:
                    </p>
                    <p className="text-[#0f172a] font-semibold mb-4">
                        {new Date(draftDate).toLocaleString()}
                    </p>
                    <p className="text-sm text-[#64748b]">
                        Would you like to restore this draft and continue where you left off?
                    </p>
                </div>

                <div className="flex gap-3 p-4 bg-[#f8fafc] rounded-b-lg">
                    <button
                        onClick={onDiscard}
                        className="flex-1 px-4 py-2 border border-[#cbd5e1] rounded-lg text-sm font-medium text-[#64748b] hover:border-[#94a3b8] hover:bg-white transition-colors"
                    >
                        Discard Draft
                    </button>
                    <button
                        onClick={onRestore}
                        className="flex-1 px-4 py-2 bg-[#0ea5a3] text-white rounded-lg text-sm font-medium hover:bg-[#0d9391] transition-colors"
                    >
                        Restore Draft
                    </button>
                </div>
            </div>
        </div>
    );
}
