import { useState, useEffect } from 'react';
import { whatsappApi, WhatsAppTemplate } from '@/lib/api/whatsapp';
import { useCurrentStore } from '@/hooks/useCurrentStore';
import { FaPaperPlane, FaSearch, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: WhatsAppTemplate) => void;
}

export default function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
    const { storeId } = useCurrentStore();
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

    useEffect(() => {
        if (storeId) {
            loadTemplates();
        }
    }, [storeId]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await whatsappApi.getTemplates(storeId!);
            // Only show approved templates
            setTemplates(data.filter(t => t.status === 'APPROVED'));
        } catch (error) {
            console.error('Failed to load templates', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.body?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSendClick = () => {
        if (!selectedTemplate) return;
        onSelect(selectedTemplate);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Select Template</h3>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">×</button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center py-8">Loading templates...</div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No approved templates found.</div>
                ) : (
                    <div className="grid gap-3">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                                    : 'border-gray-200 hover:border-emerald-300 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400 uppercase">
                                        {template.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{template.body}</p>
                                {template.header && (
                                    <p className="text-xs text-gray-500 mt-1">Header: {template.header}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cost Disclosure Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-start gap-3 mb-4">
                    <FaMoneyBillWave className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">Cost Disclosure</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            WhatsApp may charge for this message if it opens a new 24h conversation window.
                            Charges (approx ₹0.80 - ₹4.50 depending on category) are billed directly by WhatsApp to your Business Account.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendClick}
                        disabled={!selectedTemplate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <FaPaperPlane className="w-4 h-4" />
                        Confirm & Send Template
                    </button>
                </div>
            </div>
        </div>
    );
}
