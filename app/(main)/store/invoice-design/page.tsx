'use client';
import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiAlertCircle, FiCheck, FiLayout, FiInfo, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { toast } from 'sonner';
import { storeApi } from '@/lib/api/store';

export default function InvoiceDesignPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState('');
    const [formData, setFormData] = useState({
        invoiceFormat: 'INV/{YYYY}/{SEQ:4}',
        headerText: '',
        footerText: ''
    });

    // Analysis state
    const [analysis, setAnalysis] = useState({
        preview: '',
        capacity: 0,
        resetPeriod: 'Never',
        isInfinite: false
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await storeApi.getMyStore();
                const store = response.data || response;

                console.log('Frontend: API Response for getMyStore:', store);

                if (store) {
                    setStoreId(store.id); // Ensure storeId is set from API
                    if (store.settings) {
                        console.log('Frontend: Found settings:', store.settings);
                        setFormData(prev => ({
                            ...prev,
                            invoiceFormat: store.settings.invoiceFormat || 'INV/{YYYY}/{SEQ:4}',
                            footerText: store.settings.footerText || ''
                        }));
                    } else {
                        console.warn('Frontend: No settings found in store object:', store);
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                toast.error('Failed to load invoice settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Analyze format and generate preview
    useEffect(() => {
        const analyzeFormat = () => {
            const format = formData.invoiceFormat;
            const now = new Date();
            const year = now.getFullYear().toString();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');

            // Generate Preview
            let preview = format
                .replace('{YYYY}', year)
                .replace('{MM}', month)
                .replace('{DD}', day);

            // Handle SEQ and limit analysis
            const seqMatch = preview.match(/{SEQ(?::(\d+))?}/);
            let seqDigits = 4;
            let capacity = 9999;
            let isInfinite = false;

            if (seqMatch) {
                seqDigits = seqMatch[1] ? parseInt(seqMatch[1]) : 4;
                capacity = Math.pow(10, seqDigits) - 1;
                preview = preview.replace(seqMatch[0], '1'.padStart(seqDigits, '0'));
            } else {
                // If no SEQ, it's problematic unless purely time based (collisions likely)
                capacity = 1;
            }

            // Determine Reset Period
            let resetPeriod = 'Never (Continuous)';
            if (format.includes('{DD}')) {
                resetPeriod = 'Daily';
            } else if (format.includes('{MM}')) {
                resetPeriod = 'Monthly';
            } else if (format.includes('{YYYY}')) {
                resetPeriod = 'Yearly';
            }

            setAnalysis({
                preview,
                capacity,
                resetPeriod,
                isInfinite
            });
        };

        analyzeFormat();
    }, [formData.invoiceFormat]);

    const handleSave = async () => {
        if (!storeId) {
            toast.error('Store ID missing. Please refresh the page.');
            return;
        }

        setSaving(true);
        try {
            await storeApi.updateStore(storeId, {
                settings: {
                    invoiceFormat: formData.invoiceFormat,
                    footerText: formData.footerText
                }
            });
            toast.success('Invoice settings saved successfully');
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex items-center justify-center">Loading settings...</div>;
    }

    return (
        <div className="h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="border-b border-gray-100 p-8 bg-gradient-to-r from-teal-50 to-white">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                                    <FiLayout className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Invoice Customization</h1>
                                    <p className="text-gray-500 mt-1">Design your invoice numbering scheme and content.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                            >
                                {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>

                    <div className="p-8 grid gap-10 lg:grid-cols-2">
                        {/* Settings Form */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Invoice Number Pattern
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.invoiceFormat}
                                            onChange={(e) => setFormData({ ...formData, invoiceFormat: e.target.value })}
                                            className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-gray-700"
                                            placeholder="INV/{YYYY}/{SEQ:4}"
                                        />
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {[
                                            { token: '{YYYY}', desc: 'Year (2025)' },
                                            { token: '{MM}', desc: 'Month (12)' },
                                            { token: '{DD}', desc: 'Day (10)' },
                                            { token: '{SEQ:4}', desc: 'Sequence (0001)' }
                                        ].map((item) => (
                                            <button
                                                key={item.token}
                                                onClick={() => setFormData(prev => ({ ...prev, invoiceFormat: prev.invoiceFormat + item.token }))}
                                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 rounded-md border border-gray-200 transition-colors font-mono"
                                                title={`Add ${item.desc}`}
                                            >
                                                {item.token}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Analysis Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <div className="flex items-center gap-2 text-indigo-800 mb-1">
                                            <FiTrendingUp className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Capacity</span>
                                        </div>
                                        <div className="text-indigo-900 font-semibold text-sm">
                                            {analysis.capacity.toLocaleString()} invites
                                        </div>
                                        <div className="text-xs text-indigo-600 mt-1">
                                            per {analysis.resetPeriod.toLowerCase()}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                                        <div className="flex items-center gap-2 text-purple-800 mb-1">
                                            <FiCalendar className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Reset Period</span>
                                        </div>
                                        <div className="text-purple-900 font-semibold text-sm">
                                            {analysis.resetPeriod}
                                        </div>
                                        <div className="text-xs text-purple-600 mt-1">
                                            Sequence restarts
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Invoice Footer Note
                                </label>
                                <textarea
                                    value={formData.footerText}
                                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                                    placeholder="Enter terms, thank you message, or payment details..."
                                />
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col h-full">
                            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <FiCheck className="text-teal-500" /> Live Preview
                            </h3>

                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <FiLayout className="w-32 h-32" />
                                </div>

                                <div className="border-b-2 border-dashed border-gray-100 pb-6 mb-6 flex justify-between items-start z-10">
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Invoice No</div>
                                        <div className="text-2xl font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1 -ml-3 rounded-lg border border-transparent group-hover:border-gray-200 group-hover:bg-gray-100 transition-all inline-block">
                                            {analysis.preview}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Date: {new Date().toLocaleDateString()}</div>
                                    </div>
                                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase tracking-wide">
                                        Paid
                                    </div>
                                </div>

                                <div className="space-y-4 opacity-40 z-10 flex-1">
                                    <div className="flex justify-between">
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                                    </div>
                                    <div className="flex justify-between">
                                        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/6"></div>
                                    </div>
                                    <div className="h-4 bg-gray-50 rounded w-1/2 mt-4"></div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 text-center z-10">
                                    {formData.footerText ? (
                                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.footerText}</p>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Footer text will appear here...</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 text-xs text-gray-500 bg-white/50 p-3 rounded-lg border border-gray-100">
                                <FiInfo className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                <p>
                                    Changes apply to <strong>new invoices only</strong>.
                                    Historical records remain unchanged for audit compliance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
