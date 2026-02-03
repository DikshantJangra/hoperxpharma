'use client';

import React from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import ModalWrapper from './ModalWrapper';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    type = 'warning'
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const typeStyles = {
        danger: {
            icon: 'text-red-600',
            iconBg: 'bg-red-100',
            button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        },
        warning: {
            icon: 'text-amber-600',
            iconBg: 'bg-amber-100',
            button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
        },
        info: {
            icon: 'text-blue-600',
            iconBg: 'bg-blue-100',
            button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        }
    };

    const styles = typeStyles[type];

    return (
        <ModalWrapper
            isOpen={isOpen}
            onClose={onCancel}
            width="max-w-md"
            className="overflow-hidden" // Basic override if needed
        >
            <div className="p-6">
                {/* Close button - ModalWrapper has one but checking if we want custom positioning or style.
                     ModalWrapper header puts it in a flex row.
                     ConfirmDialog had it absolute positioned. 
                     We can reuse ModalWrapper's close button if we pass a title, or we can just custom render content.
                     The original ConfirmDialog didn't have a standard header line, just a close button.
                     So let's put content in directly.
                 */}

                {/* Custom Close Button absolute top-4 right-4 as per original design if we want exact match, 
                     but ModalWrapper's close button is in a header usually. 
                     Let's stick to the content design but use ModalWrapper for trapping. 
                 */}

                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <FiX size={20} />
                </button>

                {/* Icon */}
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
                    <FiAlertCircle className={`h-6 w-6 ${styles.icon}`} />
                </div>

                {/* Content */}
                <div className="mt-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
}
