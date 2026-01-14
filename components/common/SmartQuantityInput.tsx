import React from 'react';
import { formatUnitName } from '@/lib/utils/stock-display';

interface SmartQuantityInputProps {
    value: number; // Total quantity in base units (e.g., total tablets)
    onChange: (newValue: number) => void;
    conversionFactor: number;
    baseUnitName: string; // e.g., "Tablet"
    stripUnitName: string; // e.g., "Strip"
    maxQuantity?: number; // Optional max limit in base units
    disabled?: boolean;
    compact?: boolean; // For tight spaces like tables
}

export default function SmartQuantityInput({
    value,
    onChange,
    conversionFactor,
    baseUnitName,
    stripUnitName,
    maxQuantity,
    disabled = false,
    compact = false
}: SmartQuantityInputProps) {
    // Use effective conversion factor (default to 10 if not set, for display purposes)
    const effectiveConversionFactor = conversionFactor && conversionFactor > 1 ? conversionFactor : 10;
    
    // Derived state for display
    const currentStrips = Math.floor(value / effectiveConversionFactor);
    // Use Math.round to handle floating point errors when dealing with decimals
    const currentRemainder = Math.round((value % effectiveConversionFactor) * 100) / 100;

    // Determine display unit names
    const displayStripUnit = stripUnitName || 'Strip';
    const displayBaseUnit = baseUnitName || 'Tablet';

    const handleStripsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStrips = Math.max(0, parseInt(e.target.value) || 0);
        const newTotal = (newStrips * effectiveConversionFactor) + currentRemainder;
        if (maxQuantity !== undefined && newTotal > maxQuantity) return;
        onChange(newTotal);
    };

    const handleRemainderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newRemainder = val === '' ? 0 : parseFloat(val);

        // AUTO-ROLLOVER LOGIC:
        const newTotal = (currentStrips * effectiveConversionFactor) + Math.max(0, newRemainder);
        if (maxQuantity !== undefined && newTotal > maxQuantity) return;
        onChange(newTotal);
    };

    return (
        <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
            {/* STRIPS INPUT (Primary) */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        value={currentStrips || ''}
                        onChange={handleStripsChange}
                        disabled={disabled}
                        className={`border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 font-medium ${compact ? 'w-12 h-7 text-xs px-0.5' : 'w-20 py-1.5 text-sm'
                            }`}
                        placeholder="0"
                    />
                </div>
                {!compact && <span className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase">{formatUnitName(displayStripUnit)}</span>}
            </div>

            {/* SEPARATOR */}
            <span className={`text-gray-300 font-bold ${compact ? 'text-[10px]' : 'text-sm mb-4'}`}>+</span>

            {/* REMAINDER INPUT */}
            <div className="flex flex-col items-center">
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        max={effectiveConversionFactor - 1}
                        value={currentRemainder === 0 ? '' : currentRemainder}
                        onChange={handleRemainderChange}
                        disabled={disabled}
                        className={`border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 ${compact ? 'w-10 h-7 text-xs px-0.5 bg-gray-50' : 'w-16 py-1.5 text-sm bg-gray-50'
                            }`}
                        placeholder="0"
                    />
                </div>
                {!compact && <span className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase">{formatUnitName(displayBaseUnit)}</span>}
            </div>

            {/* Total Hint (Only in non-compact mode or on hover) */}
            {!compact && value > 0 && (
                <div className="ml-2 text-xs text-gray-400 mb-4">
                    = {value} {formatUnitName(displayBaseUnit)}
                </div>
            )}
        </div>
    );
}
