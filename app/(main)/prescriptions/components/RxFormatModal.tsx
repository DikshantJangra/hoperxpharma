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
    const [format, setFormat] = useState(currentFormat || 'SXXX-PREFIX-NNNNNN');
    const [prefix, setPrefix] = useState(currentPrefix || 'RX');
    const [isSaving, setIsSaving] = useState(false);
    const [customFormat, setCustomFormat] = useState('');
    const templates = [
        { label: 'Store-Based (Default)', value: 'SXXX-PREFIX-NNNNNN', example: 'S012-RX-000047', desc: 'Recommended' },
        { label: 'Year-Based', value: 'PREFIX-YYYY-SXXX-NNNNNN', example: 'RX-2026-S012-000047' },
        { label: 'Simple Sequential', value: 'PREFIX-SXXX-NNNNNN', example: 'RX-S012-000047' },
        { label: 'Custom Pattern', value: 'custom', example: 'Use tokens below' }
    ];

    const getPreview = () => {
        const mockStore = { id: '123store456' };
        const mockCounter = 48;
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

        const formatToUse = format === 'custom' ? customFormat : format;
        if (!formatToUse) return 'Enter pattern...';

        // Replace all tokens with actual values
        let preview = formatToUse;

        // Replace braced tokens first
        preview = preview.replace(/\{PREFIX\}/g, prefix);
        preview = preview.replace(/\{YYYY\}/g, year.toString());
        preview = preview.replace(/\{YY\}/g, year.toString().slice(-2));
        preview = preview.replace(/\{MM\}/g, month);
        preview = preview.replace(/\{NNNNNN\}/g, mockCounter.toString().padStart(6, '0'));
        preview = preview.replace(/\{SXXX\}/g, mockStore.id.slice(-3));

        // Then replace non-braced tokens
        preview = preview.replace(/PREFIX/g, prefix);
        preview = preview.replace(/YYYY/g, year.toString());
        preview = preview.replace(/YY/g, year.toString().slice(-2));
        preview = preview.replace(/MM/g, month);
        preview = preview.replace(/N{6,}/g, (match) => mockCounter.toString().padStart(match.length, '0'));
        preview = preview.replace(/N+/g, (match) => mockCounter.toString().padStart(match.length, '0'));
        preview = preview.replace(/SXXX/g, mockStore.id.slice(-3));

        return preview;
    };

    const handleSave = async () => {
        const finalFormat = format === 'custom' ? customFormat : format;
        if (!finalFormat) {
            toast.error('Please select or define a format');
            return;
        }

        setIsSaving(true);
        try {
            await onSave({ format: finalFormat, prefix, yearlyReset: false });
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
                        <div onClick={(e) => e.stopPropagation()}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Custom Format Pattern
                            </label>
                            <input
                                type="text"
                                value={customFormat}
                                placeholder="e.g., {PREFIX}-{YYYY}-{NNNNNN}"
                                className="w-full px-3 py-2 border rounded text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                onChange={(e) => setCustomFormat(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                            <div className="text-xs text-gray-500 mt-2 space-y-1">
                                <div className="font-medium">Available Tokens:</div>
                                <div className="grid grid-cols-2 gap-1">
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{PREFIX}'}</code> = RX</span>
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{YYYY}'}</code> = 2026</span>
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{YY}'}</code> = 26</span>
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{MM}'}</code> = 01</span>
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{SXXX}'}</code> = Store ID</span>
                                    <span>• <code className="bg-gray-100 px-1 rounded">{'{NNNNNN}'}</code> = 000048</span>
                                </div>
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
