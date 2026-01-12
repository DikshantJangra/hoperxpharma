import React, { useState, useEffect } from 'react';
import { HiEye, HiEyeSlash, HiLockClosed } from 'react-icons/hi2';
import { useAuthStore } from '@/lib/store/auth-store';

interface SecureMarginRevealProps {
    value: number;
    label?: string;
    isCurrency?: boolean;
    blurIntensity?: 'low' | 'medium' | 'high';
}

const getBlurClass = (intensity: 'low' | 'medium' | 'high' = 'high') => {
    switch (intensity) {
        case 'low': return 'blur-sm';
        case 'medium': return 'blur-md';
        case 'high': return 'blur-lg';
        default: return 'blur-lg';
    }
};

/**
 * Secure component to display sensitive margin data.
 * Features:
 * - Hidden by default (Blurred)
 * - Click to Reveal
 * - Auto-hide after 15 seconds
 * - Restricted to OWNER/ADMIN (Client-side check, robust check should still be API/Server side)
 */
const SecureMarginReveal: React.FC<SecureMarginRevealProps> = ({
    value,
    label = 'Margin',
    isCurrency = true,
    blurIntensity = 'high'
}) => {
    const { user } = useAuthStore();
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const isAuthorized = user?.role === 'OWNER' || user?.role === 'ADMIN';

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isVisible && timeLeft > 0) {
            timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsVisible(false);
        }
        return () => clearTimeout(timer);
    }, [isVisible, timeLeft]);

    const handleReveal = () => {
        if (!isAuthorized) return;
        setIsVisible(true);
        setTimeLeft(15); // 15 seconds visibility
    };

    if (!isAuthorized) {
        return null; // Or render nothing/locked icon
    }

    return (
        <div className="flex flex-col items-start p-2 bg-gray-50/50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <span className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                {label}
                {isVisible ? (
                    <span className="text-[10px] text-amber-600 font-normal ml-auto animate-pulse">
                        Hiding in {timeLeft}s
                    </span>
                ) : (
                    <HiLockClosed size={10} className="ml-1 text-gray-400" />
                )}
            </span>

            <div
                onClick={handleReveal}
                className={`
                    relative cursor-pointer group select-none transition-all duration-300
                    ${isVisible ? 'bg-transparent' : 'bg-gray-200/50 rounded'}
                `}
            >
                {/* Content Layer */}
                <div className={`
                    text-sm font-bold font-mono tracking-tight
                    transition-all duration-300
                    ${isVisible ? 'opacity-100 blur-0' : `opacity-40 ${getBlurClass(blurIntensity)}`}
                    ${value < 0 ? 'text-red-600' : 'text-emerald-700'}
                `}>
                    {isCurrency ? new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(value) : value + '%'}
                </div>

                {/* Mask Layer */}
                {!isVisible && (
                    <div className="absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-80">
                        <HiEye size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecureMarginReveal;
