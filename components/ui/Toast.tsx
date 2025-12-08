'use client';

import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeStyles = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200',
            icon: 'text-emerald-600',
            text: 'text-emerald-900',
            IconComponent: FiCheckCircle
        },
        error: {
            bg: 'bg-red-50 border-red-200',
            icon: 'text-red-600',
            text: 'text-red-900',
            IconComponent: FiAlertCircle
        },
        info: {
            bg: 'bg-blue-50 border-blue-200',
            icon: 'text-blue-600',
            text: 'text-blue-900',
            IconComponent: FiInfo
        }
    };

    const styles = typeStyles[type];
    const IconComponent = styles.IconComponent;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles.bg} animate-slide-in-right`}>
            <IconComponent className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
            <p className={`text-sm font-medium flex-1 ${styles.text}`}>{message}</p>
            <button
                onClick={onClose}
                className={`flex-shrink-0 ${styles.icon} hover:opacity-70`}
            >
                <FiX size={18} />
            </button>
        </div>
    );
}
