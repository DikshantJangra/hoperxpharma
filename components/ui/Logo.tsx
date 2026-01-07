import React from 'react';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    subtitle?: string;
    className?: string;
    textClassName?: string;
}

export default function Logo({
    size = 'md',
    showText = true,
    subtitle,
    className = '',
    textClassName = '',
    isWhite = false
}: LogoProps & { isWhite?: boolean }) {

    const sizeClasses = {
        sm: {
            container: 'w-8 h-8',
            text: 'text-sm',
            subText: 'text-[10px]',
            gap: 'gap-2'
        },
        md: {
            container: 'w-10 h-10',
            text: 'text-lg',
            subText: 'text-xs',
            gap: 'gap-3'
        },
        lg: {
            container: 'w-12 h-12',
            text: 'text-xl',
            subText: 'text-sm',
            gap: 'gap-3'
        },
        xl: {
            container: 'w-16 h-16',
            text: 'text-2xl',
            subText: 'text-base',
            gap: 'gap-4'
        }
    };

    const currentSize = sizeClasses[size];

    return (
        <div className={`flex items-center ${currentSize.gap} ${className}`}>
            <div className={`${currentSize.container} rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-sm ${isWhite ? 'ring-2 ring-white/20' : ''}`}>
                <span className={`text-white font-bold ${currentSize.text}`}>Rx</span>
            </div>
            {showText && (
                <div className="flex flex-col">
                    <span className={`font-bold ${isWhite ? 'text-white' : 'text-gray-900'} ${currentSize.text} ${textClassName}`}>
                        Hope<span className={isWhite ? 'text-emerald-200' : 'text-emerald-500'}>Rx</span>Pharma
                    </span>
                    {subtitle && (
                        <span className={`${currentSize.subText} ${isWhite ? 'text-emerald-50/80' : 'text-gray-500'}`}>{subtitle}</span>
                    )}
                </div>
            )}
        </div>
    );
}
