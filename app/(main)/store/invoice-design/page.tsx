'use client';
import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiLayout, FiDollarSign, FiFileText } from 'react-icons/fi';
import { toast } from 'sonner';
import { storeApi } from '@/lib/api/store';
import AssetUploader from '@/components/store/profile/AssetUploader';
import UPIQRPreview from '@/components/store/profile/UPIQRPreview';

export default function InvoiceDesignPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState('');
    const [storeName, setStoreName] = useState('');
    const [formData, setFormData] = useState({
        invoiceFormat: 'INV/{YYYY}/{SEQ:4}',
        footerText: '',
        logoUrl: '',
        signatureUrl: '',
        upiId: ''
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await storeApi.getMyStore();
                const store = response.data || response;

                console.log('=== FETCHED STORE DATA ===');
                console.log('Full store object:', store);
                console.log('logoUrl:', store.logoUrl);
                console.log('signatureUrl:', store.signatureUrl);
                console.log('bankDetails:', store.bankDetails);
                console.log('settings:', store.settings);

                if (store) {
                    setStoreId(store.id);
                    setStoreName(store.displayName || store.name);
                    const newFormData = {
                        invoiceFormat: store.settings?.invoiceFormat || 'INV/{YYYY}/{SEQ:4}',
                        footerText: store.settings?.footerText || '',
                        logoUrl: store.logoUrl || '',
                        signatureUrl: store.signatureUrl || '',
                        upiId: store.bankDetails?.upiId || ''
                    };
                    console.log('Setting formData to:', newFormData);
                    setFormData(newFormData);
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

    const handleSave = async () => {
        if (!storeId) {
            toast.error('Store ID missing. Please refresh the page.');
            return;
        }

        setSaving(true);
        try {
            // Prepare update payload
            const updatePayload: any = {
                settings: {
                    invoiceFormat: formData.invoiceFormat,
                    footerText: formData.footerText
                }
            };

            // Only include bankDetails if UPI ID is provided
            if (formData.upiId) {
                updatePayload.bankDetails = {
                    upiId: formData.upiId
                };
            }

            console.log('=== SAVING INVOICE SETTINGS ===');
            console.log('Store ID:', storeId);
            console.log('Current formData:', formData);
            console.log('Payload being sent:', updatePayload);

            const result = await storeApi.updateStore(storeId, updatePayload);
            console.log('Save result:', result);

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
        <div className="h-[calc(100vh-64px)] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="border-b border-gray-100 p-8 bg-gradient-to-r from-teal-50 via-white to-purple-50">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <FiLayout className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Invoice Design</h1>
                                    <p className="text-gray-600 mt-1">Customize your invoice branding and payment options.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-medium hover:from-teal-700 hover:to-teal-800 transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl"
                            >
                                {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Branding Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                <FiFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Branding Assets</h2>
                                <p className="text-sm text-gray-500">Upload your store logo and signature</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <AssetUploader
                                type="logo"
                                currentUrl={formData.logoUrl}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
                                storeId={storeId}
                            />

                            <AssetUploader
                                type="signature"
                                currentUrl={formData.signatureUrl}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, signatureUrl: url }))}
                                storeId={storeId}
                            />
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                <FiDollarSign className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Payment Configuration</h2>
                                <p className="text-sm text-gray-500">Enable UPI QR code payments</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                                    placeholder="merchant@paytm"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    QR code will be generated automatically on invoices with payment amount
                                </p>
                            </div>

                            {/* QR Code Preview */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    QR Code Preview
                                </label>
                                <UPIQRPreview
                                    upiId={formData.upiId}
                                    amount={100}
                                    storeName={storeName}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Format Section - Full Width */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                <FiLayout className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Invoice Format</h2>
                                <p className="text-sm text-gray-500">Customize numbering and footer</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Invoice Number Pattern
                                </label>
                                <input
                                    type="text"
                                    value={formData.invoiceFormat}
                                    onChange={(e) => setFormData({ ...formData, invoiceFormat: e.target.value })}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-sm"
                                    placeholder="INV/{YYYY}/{SEQ:4}"
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[
                                        { token: '{YYYY}', desc: 'Year' },
                                        { token: '{MM}', desc: 'Month' },
                                        { token: '{DD}', desc: 'Day' },
                                        { token: '{SEQ:4}', desc: 'Sequence' }
                                    ].map((item) => (
                                        <button
                                            key={item.token}
                                            onClick={() => setFormData(prev => ({ ...prev, invoiceFormat: prev.invoiceFormat + item.token }))}
                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 rounded-lg border border-gray-200 transition-colors font-mono"
                                            title={`Add ${item.desc}`}
                                        >
                                            {item.token}
                                        </button>
                                    ))}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
