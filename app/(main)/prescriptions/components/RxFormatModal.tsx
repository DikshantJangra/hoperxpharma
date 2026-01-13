'use client';

import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { toast } from 'sonner';

interface RxFormatModalProps {
    currentFormat?: string;
    currentPrefix?: string;
    onSave: (config: { format: string; prefix: string; yearlyReset: boolean }) => Promise<void>;
    onClose: () => void;
}

export default function RxFormatModal({ currentFormat, currentPrefix, onSave, onClose }: RxFormatModalProps) {
    const [format, setFormat] = useState(currentFormat || 'RX-NNNNNN');
    const [prefix, setPrefix] = useState(currentPrefix || 'RX');
    const [yearlyReset, setYearlyReset] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const templates = [
        { label: 'Simple Sequential', value: 'RX-NNNNNN', example: 'RX-000047' },
        { label: 'Year-Based', value: 'PREFIX-YYYY-NNNNNN', example: 'RX-2026-000047' },
        { label: 'Store-Based', value: 'SXXX-PREFIX-NNNNNN', example: 'S012-RX-000047', desc: 'SXXX = Store ID' },
        { label: 'Custom', value: 'custom', example: 'Define your own pattern' }
    ];

    const getPreview = () => {
        if (format === 'custom') return 'Enter custom format...';

        // Mock preview
        const mockStore = { id: '123store456', rxNumberPrefix: prefix };
        const mockCounter = 48;
        const year = new Date().getFullYear();

        return format
            .replace('YYYY', year.toString())
            .replace('YY', year.toString().slice(-2))
            .replace(/N+/g, (match) => mockCounter.toString().padStart(match.length, '0'))
            .replace('SXXX', mockStore.id.slice(-3))
            .replace('PREFIX', prefix);
    };

    const handleSave = async () => {
        if (!format || format === 'custom') {
            toast.error('Please select or define a format');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ format, prefix, yearlyReset });
            toast.success('RX number format updated');
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update format');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">RX Number Format</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Format Templates */}
                    {templates.map((t) => (
                        <label
                            key={t.value}
                            className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <input
                                type="radio"
                                checked={format === t.value}
                                onChange={() => setFormat(t.value)}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-sm">{t.label}</div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">{t.example}</div>
                                {t.desc && <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>}
                            </div>
                        </label>
                    ))}

                    {/* Custom Format Input */}
                    {format === 'custom' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Custom Format Pattern
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., PREFIX-YYYY-NNNNNN"
                                className="w-full px-3 py-2 border rounded  text-sm font-mono"
                                onChange={(e) => setFormat(e.target.value)}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                Tokens: YYYY (year), NNNNNN (counter), PREFIX (from below), SXXX (store ID)
                            </div>
                        </div>
                    )}

                    {/* Prefix Input */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Prefix
                        </label>
                        <input
                            type="text"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                            placeholder="RX"
                            className="w-full px-3 py-2 border rounded text-sm font-mono"
                            maxLength={10}
                        />
                    </div>

                    {/* Yearly Reset Option */}
                    <label className="flex items-center gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                            type="checkbox"
                            checked={yearlyReset}
                            onChange={(e) => setYearlyReset(e.target.checked)}
                        />
                        <div className="flex-1">
                            <div className="font-medium text-sm">Reset counter yearly</div>
                            <div className="text-xs text-gray-500">Counter resets to 1 each January</div>
                        </div>
                    </label>

                    {/* Preview */}
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium mb-1">Preview (Next Number)</div>
                        <div className="font-mono text-sm font-semibold text-blue-900">{getPreview()}</div>
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Format'}
                    </button>
                </div>
            </div>
        </div>
    );
}
