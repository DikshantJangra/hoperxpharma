'use client';

import React, { useState } from 'react';
import { FiLock, FiX, FiCheck } from 'react-icons/fi';

interface ManagerOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (managerId: string) => void;
    reason: string; // Why override is needed (e.g. "High Value Refund", "Restricted Item")
}

export default function ManagerOverrideModal({ isOpen, onClose, onApprove, reason }: ManagerOverrideModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // In a real app, verify PIN against backend API
            // For MVP/Demo, simple check or mock delay
            await new Promise(resolve => setTimeout(resolve, 500));

            if (pin === '1234') { // Mock PIN
                onApprove('user_manager_123'); // Mock Manager ID
                onClose();
            } else {
                setError('Invalid PIN. Please try again.');
            }
        } catch (err) {
            setError('Verification failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <FiX size={20} />
                </button>

                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                        <FiLock className="text-amber-600 text-xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Manager Approval Required</h3>
                    <p className="text-sm text-gray-500 mt-1">{reason}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide uppercase">
                            Enter Manager PIN
                        </label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={4}
                            className="w-full text-center text-3xl tracking-[1em] font-bold py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-gray-800 placeholder-gray-300 transition-colors"
                            placeholder="••••"
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-red-500 mt-2 text-center font-medium animate-in slide-in-from-top-1">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={pin.length < 4 || isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Verifying...' : (
                                <>
                                    <FiCheck /> Approve
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
