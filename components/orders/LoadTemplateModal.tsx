import React, { useState, useEffect } from 'react';
import { FiX, FiCopy, FiTrash2, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Template {
    id: string;
    name: string;
    description?: string;
    supplierId?: string;
    items: any[];
    usageCount: number;
    lastUsedAt?: string;
    createdAt: string;
}

interface LoadTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (templateId: string) => Promise<void>;
    storeId: string;
}

export default function LoadTemplateModal({ isOpen, onClose, onLoad, storeId }: LoadTemplateModalProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders/templates`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                setTemplates(result.data || result || []);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleLoad = async (templateId: string) => {
        try {
            await onLoad(templateId);
            onClose();
            toast.success('Template loaded successfully');
        } catch (error) {
            console.error('Failed to load template:', error);
            toast.error('Failed to load template');
        }
    };

    const handleDuplicate = async (templateId: string) => {
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders/templates/${templateId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                toast.success('Template duplicated');
                loadTemplates();
            }
        } catch (error) {
            console.error('Failed to duplicate template:', error);
            toast.error('Failed to duplicate template');
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (response.ok) {
                toast.success('Template deleted');
                loadTemplates();
            }
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Failed to delete template');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

                {/* Modal */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Load Template</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-6 py-4">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading templates...</div>
                        ) : templates.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No templates found</p>
                                <p className="text-sm mt-2">Create a template by saving your current PO</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${selectedTemplate === template.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                                            }`}
                                        onClick={() => setSelectedTemplate(template.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                                {template.description && (
                                                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>{template.items.length} items</span>
                                                    <span className="flex items-center gap-1">
                                                        <FiClock size={12} />
                                                        Used {template.usageCount} times
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDuplicate(template.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="Duplicate"
                                                >
                                                    <FiCopy size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(template.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => selectedTemplate && handleLoad(selectedTemplate)}
                            disabled={!selectedTemplate}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Load Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
