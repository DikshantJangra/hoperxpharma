'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSync, FaTrash, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';
import { whatsappApi, WhatsAppTemplate } from '@/lib/api/whatsapp';
import CreateTemplateModal from './CreateTemplateModal';

interface TemplateManagerProps {
    storeId: string;
}

export default function TemplateManager({ storeId }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, [storeId]);

    const loadTemplates = async () => {
        try {
            const response = await whatsappApi.getTemplates(storeId);
            setTemplates(response.templates);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await whatsappApi.syncTemplates(storeId);
            await loadTemplates();
        } catch (error: any) {
            alert(`Sync failed: ${error.message}`);
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Delete this template?')) return;

        try {
            await whatsappApi.deleteTemplate(templateId);
            await loadTemplates();
        } catch (error: any) {
            alert(`Delete failed: ${error.message}`);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <FaCheckCircle className="w-4 h-4 text-green-600" />;
            case 'PENDING':
                return <FaClock className="w-4 h-4 text-yellow-600" />;
            case 'REJECTED':
                return <FaTimesCircle className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Message Templates
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Pre-approved templates for business-initiated messages (required for &gt;24hr conversations)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <FaSync className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            Sync from Meta
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            <FaPlus className="w-4 h-4" />
                            Create Template
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            No templates yet. Create one to send business-initiated messages.
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Create Your First Template
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Language</th>
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Category</th>
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Usage</th>
                                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map((template) => (
                                    <tr key={template.id} className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                    {template.body}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {template.language.toUpperCase()}
                                        </td>
                                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {template.category}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(template.status)}
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {template.status}
                                                </span>
                                            </div>
                                            {template.status === 'REJECTED' && template.rejectedReason && (
                                                <p className="text-xs text-red-600 mt-1">{template.rejectedReason}</p>
                                            )}
                                        </td>
                                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {template.usageCount}
                                        </td>
                                        <td className="py-4">
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="text-red-600 hover:text-red-700 dark:text-red-400 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Delete template"
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Template Modal */}
            <CreateTemplateModal
                storeId={storeId}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    loadTemplates();
                }}
            />
        </div>
    );
}
