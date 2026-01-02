'use client';

import { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiSearch, FiEdit, FiTrash2, FiCopy, FiEye, FiX, FiCheckCircle, FiAlertCircle, FiMail, FiSmartphone, FiMessageSquare } from 'react-icons/fi';
import { MdWhatsapp } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import CreateTemplateModal from '@/components/messages/email/CreateTemplateModal';
import EditTemplateModal from '@/components/messages/email/EditTemplateModal';
import TemplatePreviewModal from '@/components/messages/email/TemplatePreviewModal';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

// Shimmer loading component
function TemplateShimmer() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-[#e2e8f0] rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-[#e2e8f0] rounded shimmer w-2/3"></div>
                            <div className="h-4 bg-[#f1f5f9] rounded shimmer w-1/2"></div>
                            <div className="h-20 bg-[#f8fafc] rounded shimmer"></div>
                            <div className="flex gap-2">
                                <div className="h-6 bg-[#fef3c7] rounded shimmer w-24"></div>
                                <div className="h-6 bg-[#fef3c7] rounded shimmer w-24"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #f8fafc 4%, #e2e8f0 25%, #f8fafc 36%);
          background-size: 1000px 100%;
        }
      `}</style>
        </div>
    );
}

export default function MessageTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChannel, setSelectedChannel] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const channels = [
        { id: 'all', label: 'All Channels', icon: FiMessageSquare, color: 'bg-[#10b981]' },
        { id: 'email', label: 'Email', icon: FiMail, color: 'bg-purple-500' },
        { id: 'whatsapp', label: 'WhatsApp', icon: MdWhatsapp, color: 'bg-green-500' },
        { id: 'sms', label: 'SMS', icon: FiSmartphone, color: 'bg-blue-500' }
    ];

    const categories = [
        { id: 'all', label: 'All Categories' },
        { id: 'invoice', label: 'Invoice' },
        { id: 'appointment', label: 'Appointment' },
        { id: 'prescription', label: 'Prescription' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'welcome', label: 'Welcome' },
        { id: 'notification', label: 'Notification' },
        { id: 'follow-up', label: 'Follow-up' }
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/email/templates', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });
            const data = await response.json();
            if (data.success) {
                setTemplates(data.data.templates || []);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            showMessage('error', 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setActionMessage({ type, text });
        setTimeout(() => setActionMessage(null), 3000);
    };

    const getChannelIcon = (channel: string) => {
        switch (channel?.toLowerCase()) {
            case 'whatsapp':
                return <MdWhatsapp className="w-5 h-5" />;
            case 'sms':
                return <FiSmartphone className="w-5 h-5" />;
            case 'email':
                return <FiMail className="w-5 h-5" />;
            default:
                return <FiMessageSquare className="w-5 h-5" />;
        }
    };

    const getChannelColor = (channel: string) => {
        switch (channel?.toLowerCase()) {
            case 'whatsapp':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'sms':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'email':
                return 'bg-purple-100 text-purple-700 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/v1/email/templates/${selectedTemplate.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (response.ok) {
                showMessage('success', 'Template deleted successfully');
                setShowDeleteConfirm(false);
                setSelectedTemplate(null);
                await fetchTemplates();
            } else {
                throw new Error('Failed to delete template');
            }
        } catch (error) {
            showMessage('error', 'Failed to delete template');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDuplicate = async (template: any) => {
        setActionLoading(true);
        try {
            const response = await fetch('/api/v1/email/templates', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    name: `${template.name} (Copy)`,
                    subject: template.subject,
                    bodyHtml: template.bodyHtml,
                    category: template.category,
                    variables: template.variables || [],
                }),
            });

            if (response.ok) {
                showMessage('success', 'Template duplicated successfully');
                await fetchTemplates();
            } else {
                throw new Error('Failed to duplicate template');
            }
        } catch (error) {
            showMessage('error', 'Failed to duplicate template');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredTemplates = templates.filter((template) => {
        // Default to 'email' if channel is not set (backward compatibility with existing templates)
        const templateChannel = template.channel?.toLowerCase() || 'email';
        const matchesChannel = selectedChannel === 'all' || templateChannel === selectedChannel;
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        const matchesSearch = !searchQuery ||
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesChannel && matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a]">Message Templates</h1>
                            <p className="text-sm text-[#64748b] mt-1">
                                Create and manage reusable templates for Email, WhatsApp, and SMS
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            New Template
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Channel Filter */}
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
                    <label className="block text-sm font-semibold text-[#0f172a] mb-3">Channel</label>
                    <div className="flex flex-wrap gap-2">
                        {channels.map((channel) => {
                            const Icon = channel.icon;
                            return (
                                <button
                                    key={channel.id}
                                    onClick={() => setSelectedChannel(channel.id)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedChannel === channel.id
                                        ? `${channel.color} text-white`
                                        : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {channel.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Category Filter & Search */}
                <div className="bg-white border border-[#e2e8f0] rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categories */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-3">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-3">Search</label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-3 w-5 h-5 text-[#64748b]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search templates..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Message */}
                {actionMessage && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${actionMessage.type === 'success' ? 'bg-[#d1fae5] border border-[#10b981]' : 'bg-[#fee2e2] border border-[#ef4444]'
                        }`}>
                        {actionMessage.type === 'success' ? (
                            <FiCheckCircle className="w-5 h-5 text-[#10b981]" />
                        ) : (
                            <FiAlertCircle className="w-5 h-5 text-[#ef4444]" />
                        )}
                        <p className={`text-sm font-medium ${actionMessage.type === 'success' ? 'text-[#065f46]' : 'text-[#dc2626]'
                            }`}>
                            {actionMessage.text}
                        </p>
                    </div>
                )}

                {/* Templates Grid */}
                {loading ? (
                    <TemplateShimmer />
                ) : filteredTemplates.length === 0 ? (
                    <div className="bg-white border border-[#e2e8f0] rounded-lg py-16 text-center">
                        <FiFileText className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <p className="text-[#64748b] mb-4">
                            {searchQuery || selectedChannel !== 'all' || selectedCategory !== 'all'
                                ? 'No templates match your filters'
                                : 'No templates yet'}
                        </p>
                        {!searchQuery && selectedChannel === 'all' && selectedCategory === 'all' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors inline-flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                Create Your First Template
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-white border border-[#e2e8f0] rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">
                                                {template.name}
                                            </h3>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getChannelColor(template.channel || 'email')}`}>
                                                <span className="mr-1">{getChannelIcon(template.channel || 'email')}</span>
                                                {((template.channel || 'email').charAt(0).toUpperCase() + (template.channel || 'email').slice(1))}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#065f46]">
                                                {template.category || 'General'}
                                            </span>
                                        </div>
                                        {template.subject && (
                                            <p className="text-sm text-[#64748b] mb-3 line-clamp-1">
                                                {template.subject}
                                            </p>
                                        )}
                                        <div
                                            className="text-sm text-[#64748b] bg-[#f8fafc] p-3 rounded border border-[#e2e8f0] line-clamp-3 mb-3"
                                            dangerouslySetInnerHTML={{ __html: template.bodyHtml || template.content || '' }}
                                        />
                                        {template.variables && template.variables.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {template.variables.slice(0, 3).map((variable: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#fef3c7] text-[#92400e]"
                                                    >
                                                        {`{{${variable}}}`}
                                                    </span>
                                                ))}
                                                {template.variables.length > 3 && (
                                                    <span className="text-xs text-[#64748b]">
                                                        +{template.variables.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-4 border-t border-[#e2e8f0]">
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowPreviewModal(true);
                                        }}
                                        className="flex-1 px-3 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <FiEye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(template)}
                                        disabled={actionLoading}
                                        className="px-3 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors disabled:opacity-50"
                                        title="Duplicate"
                                    >
                                        <FiCopy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowEditModal(true);
                                        }}
                                        className="px-3 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors"
                                        title="Edit"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedTemplate(template);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Delete"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-[#0f172a] mb-2">Delete Template?</h3>
                        <p className="text-sm text-[#64748b] mb-6">
                            Are you sure you want to delete "{selectedTemplate.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedTemplate(null);
                                }}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateTemplateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    showMessage('success', 'Template created successfully');
                    fetchTemplates();
                }}
            />

            <EditTemplateModal
                isOpen={showEditModal}
                template={selectedTemplate}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedTemplate(null);
                }}
                onSuccess={() => {
                    showMessage('success', 'Template updated successfully');
                    fetchTemplates();
                }}
            />

            <TemplatePreviewModal
                isOpen={showPreviewModal}
                template={selectedTemplate}
                onClose={() => {
                    setShowPreviewModal(false);
                    setSelectedTemplate(null);
                }}
            />
        </div>
    );
}
