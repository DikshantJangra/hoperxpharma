'use client';

import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const { isPremium } = usePremiumTheme();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const typeStyles = {
        success: {
            bg: isPremium ? 'bg-emerald-50/80 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
            icon: isPremium ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-emerald-600',
            text: isPremium ? 'text-emerald-900' : 'text-emerald-900',
            IconComponent: FiCheckCircle
        },
        error: {
            bg: isPremium ? 'bg-rose-50/80 border-rose-500/30' : 'bg-red-50 border-red-200',
            icon: isPremium ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-red-600',
            text: isPremium ? 'text-rose-900' : 'text-red-900',
            IconComponent: FiAlertCircle
        },
        info: {
            bg: isPremium ? 'bg-slate-50/80 border-slate-500/30' : 'bg-blue-50 border-blue-200',
            icon: isPremium ? 'text-slate-500 drop-shadow-[0_0_8px_rgba(100,116,139,0.5)]' : 'text-blue-600',
            text: isPremium ? 'text-slate-900' : 'text-blue-900',
            IconComponent: FiInfo
        }
    };

    const styles = typeStyles[type];
    const IconComponent = styles.IconComponent;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in-right ${styles.bg} ${isPremium ? 'backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-l-4' : ''
            }`}>
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
