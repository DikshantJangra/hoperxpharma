import React, { useState, useEffect } from 'react';
import { formatUnitName } from '@/lib/utils/stock-display';
import { FiRepeat } from 'react-icons/fi';

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
    // Mode state: 'tablets' (total base units) or 'strips' (strips + remainder)
    // Default to 'tablets' as per user request
    const [mode, setMode] = useState<'tablets' | 'strips'>('tablets');

    // Use effective conversion factor (default to 10 if not set, for display purposes)
    const effectiveConversionFactor = conversionFactor && conversionFactor > 1 ? conversionFactor : 10;

    // Derived state for 'strips' mode
    const currentStrips = Math.floor(value / effectiveConversionFactor);
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

    const handleTotalTabletsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const newTotal = val === '' ? 0 : Math.max(0, parseInt(val));

        if (maxQuantity !== undefined && newTotal > maxQuantity) {
            // Optional: flash warning or toast could happen here via parent
            return;
        }
        onChange(newTotal);
    };

    const toggleMode = () => {
        setMode(prev => prev === 'tablets' ? 'strips' : 'tablets');
    };

    // Render Tablet Mode (Default)
    if (mode === 'tablets') {
        const stripsCalc = Math.floor(value / effectiveConversionFactor);
        const remCalc = value % effectiveConversionFactor;

        // Simpler breakdown string
        const breakdown = stripsCalc > 0
            ? `${stripsCalc} ${formatUnitName(displayStripUnit)} + ${remCalc} ${formatUnitName(displayBaseUnit)}`
            : '';

        return (
            <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
                <div className="relative group">
                    <div className="flex items-center">
                        <input
                            type="number"
                            min="0"
                            value={value || ''}
                            onChange={handleTotalTabletsChange}
                            disabled={disabled}
                            className={`border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 font-bold text-gray-900 ${compact ? 'w-16 h-7 text-xs px-0.5' : 'w-24 py-1.5 text-sm'}`}
                            placeholder="0"
                        />
                        <button
                            onClick={toggleMode}
                            className="ml-1 p-1 text-gray-400 hover:text-teal-600 transition-colors"
                            title={`Switch to ${displayStripUnit} mode`}
                        >
                            <FiRepeat className="w-3 h-3" />
                        </button>
                    </div>
                    {/* Helper text showing breakdown */}
                    {!compact && value > 0 && breakdown && (
                        <div className="absolute top-full left-0 mt-0.5 text-[10px] text-gray-500 whitespace-nowrap bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100 z-10 font-medium">
                            = {breakdown}
                        </div>
                    )}
                </div>
                {!compact && <span className="text-xs text-gray-500 font-medium">{formatUnitName(displayBaseUnit)}s</span>}
            </div>
        );
    }

    // Render Strips Mode (Legacy/Alternative)
    return (
        <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                {/* STRIPS INPUT */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <input
                            type="number"
                            min="0"
                            value={currentStrips || ''}
                            onChange={handleStripsChange}
                            disabled={disabled}
                            className={`bg-white border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 font-medium ${compact ? 'w-10 h-6 text-xs px-0.5' : 'w-14 py-1 text-sm'}`}
                            placeholder="0"
                        />
                    </div>
                    {!compact && <span className="text-[9px] text-gray-400 mt-0.5 font-medium uppercase tracking-tight">{formatUnitName(displayStripUnit)}</span>}
                </div>

                <span className={`text-gray-400 font-bold mx-1 ${compact ? 'text-[10px]' : 'text-xs mb-3'}`}>+</span>

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
                            className={`bg-white border border-gray-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 ${compact ? 'w-8 h-6 text-xs px-0.5' : 'w-12 py-1 text-sm'}`}
                            placeholder="0"
                        />
                    </div>
                    {!compact && <span className="text-[9px] text-gray-400 mt-0.5 font-medium uppercase tracking-tight">{formatUnitName(displayBaseUnit)}</span>}
                </div>

                <button
                    onClick={toggleMode}
                    className="ml-1 p-1 text-gray-400 hover:text-teal-600 transition-colors self-center"
                    title={`Switch to total ${baseUnitName} mode`}
                >
                    <FiRepeat className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
