'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaPaperPlane, FaBolt } from 'react-icons/fa';
import { whatsappApi, WhatsAppTemplate } from '@/lib/api/whatsapp';

interface TemplateSelectorProps {
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (template: WhatsAppTemplate) => void;
}

export default function TemplateSelector({ storeId, isOpen, onClose, onSelect }: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

    useEffect(() => {
        if (isOpen && storeId) {
            loadTemplates();
        }
    }, [isOpen, storeId]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await whatsappApi.getTemplates(storeId);
            // Filter only approved templates
            const approved = response.templates.filter(t => t.status === 'APPROVED');
            setTemplates(approved);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.components.some(c => c.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FaBolt className="text-amber-500" />
                            Select Template
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Start a conversation with a pre-approved message
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search templates..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* List */}
                    <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-2">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No templates found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`w-full text-left p-3 rounded-lg transition-colors ${selectedTemplate?.id === template.id
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                                            {template.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {template.category} • {template.language}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="w-1/2 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto flex flex-col">
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Preview
                        </h3>

                        {selectedTemplate ? (
                            <div className="flex-1">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 relative">
                                    {/* Tail */}
                                    <div className="absolute top-4 -left-2 w-4 h-4 bg-white dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700 transform rotate-45"></div>

                                    <div className="relative z-10 space-y-3">
                                        {/* Header */}
                                        {selectedTemplate.components.find(c => c.type === 'HEADER')?.text && (
                                            <div className="font-bold text-gray-900 dark:text-white">
                                                {selectedTemplate.components.find(c => c.type === 'HEADER')?.text}
                                            </div>
                                        )}

                                        {/* Body */}
                                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">
                                            {selectedTemplate.components.find(c => c.type === 'BODY')?.text}
                                        </div>

                                        {/* Footer */}
                                        {selectedTemplate.components.find(c => c.type === 'FOOTER')?.text && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                                                {selectedTemplate.components.find(c => c.type === 'FOOTER')?.text}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic">
                                Select a template to preview
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedTemplate && onSelect(selectedTemplate)}
                        disabled={!selectedTemplate}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                        <FaPaperPlane className="w-4 h-4" />
                        Send Template
                    </button>
                </div>
            </div>
        </div>
    );
}
