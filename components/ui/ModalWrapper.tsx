'use client';

import React from 'react';
import FocusLock from 'react-focus-lock';
import { FiX } from 'react-icons/fi';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

interface ModalWrapperProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // For additional styling of the modal container
    width?: string; // e.g. 'max-w-2xl'
}

export default function ModalWrapper({
    isOpen,
    onClose,
    title,
    children,
    className = '',
    width = 'max-w-md'
}: ModalWrapperProps) {
    const { isPremium } = usePremiumTheme();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 transition-all duration-300 ${isPremium ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black bg-opacity-50'
                    }`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Container */}
            <div className="flex min-h-full items-center justify-center p-4">
                <FocusLock returnFocus>
                    <div
                        className={`relative rounded-lg w-full ${width} ${className} transform transition-all duration-300 scale-100 ${isPremium
                                ? 'bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-emerald-500/10'
                                : 'bg-white shadow-xl'
                            }`}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? "modal-title" : undefined}
                    >
                        {/* Header (Optional) */}
                        {title && (
                            <div className={`flex items-center justify-between p-4 border-b ${isPremium ? 'border-emerald-500/10' : 'border-gray-200'}`}>
                                {title && (
                                    <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                                        {title}
                                    </h2>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                                    aria-label="Close modal"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-0">
                            {children}
                        </div>
                    </div>
                </FocusLock>
            </div>
        </div>
    );
}
