'use client';

import { FiCopy, FiCheck } from 'react-icons/fi';
import { useState } from 'react';

interface PaymentReferenceProps {
    referenceId: string;
    label?: string;
    copyable?: boolean;
    className?: string;
}

export function PaymentReference({
    referenceId,
    label = 'Reference',
    copyable = true,
    className = '',
}: PaymentReferenceProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!copyable) return;

        try {
            await navigator.clipboard.writeText(referenceId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            <span className="text-xs text-gray-500">{label}:</span>
            <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {referenceId}
            </code>
            {copyable && (
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy reference ID"
                >
                    {copied ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                        <FiCopy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                </button>
            )}
        </div>
    );
}
