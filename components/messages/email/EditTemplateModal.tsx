'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiMail, FiSmartphone } from 'react-icons/fi';
import { MdWhatsapp } from 'react-icons/md';

interface EditTemplateModalProps {
    isOpen: boolean;
    template: any;
    onClose: () => void;
    onSuccess: () => void;
}

// Helper to get headers for requests (credentials: include handles auth)
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
});

export default function EditTemplateModal({ isOpen, template, onClose, onSuccess }: EditTemplateModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        channel: 'email',
        subject: '',
        bodyHtml: '',
        category: 'notification',
        variables: [] as string[],
    });
    const [newVariable, setNewVariable] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const channels = [
        { id: 'email', label: 'Email', icon: FiMail, color: 'bg-purple-500' },
        { id: 'whatsapp', label: 'WhatsApp', icon: MdWhatsapp, color: 'bg-green-500' },
        { id: 'sms', label: 'SMS', icon: FiSmartphone, color: 'bg-blue-500' }
    ];

    const categories = [
        { id: 'invoice', label: 'Invoice' },
        { id: 'appointment', label: 'Appointment' },
        { id: 'prescription', label: 'Prescription' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'welcome', label: 'Welcome' },
        { id: 'notification', label: 'Notification' },
        { id: 'follow-up', label: 'Follow-up' },
    ];

    const commonVariables = [
        'patientName',
        'doctorName',
        'appointmentDate',
        'appointmentTime',
        'storeName',
        'storePhone',
        'prescriptionId',
        'invoiceNumber',
        'totalAmount',
    ];

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name || '',
                channel: template.channel?.toLowerCase() || 'email',
                subject: template.subject || '',
                bodyHtml: template.bodyHtml || '',
                category: template.category || 'notification',
                variables: template.variables || [],
            });
        }
    }, [template]);

    const handleAddVariable = (variable: string) => {
        if (variable && !formData.variables.includes(variable)) {
            setFormData({
                ...formData,
                variables: [...formData.variables, variable],
            });
            setNewVariable('');
        }
    };

    const handleRemoveVariable = (variable: string) => {
        setFormData({
            ...formData,
            variables: formData.variables.filter(v => v !== variable),
        });
    };

    const getCharCount = () => {
        return formData.bodyHtml.length;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name || !formData.bodyHtml) {
            setError('Please fill in all required fields');
            return;
        }

        if (formData.channel === 'email' && !formData.subject) {
            setError('Subject is required for email templates');
            return;
        }

        if (formData.channel === 'sms' && formData.bodyHtml.length > 160) {
            setError('SMS content cannot exceed 160 characters');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`/api/v1/email/templates/${template.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update template');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !template) return null;

    const charCount = getCharCount();
    const showCharWarning = formData.channel === 'sms' && charCount > 160;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-[#0f172a]">Edit Template</h2>
                        <p className="text-sm text-[#64748b] mt-1">Update your message template</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-[#64748b]" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-5">
                        {/* Channel Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Channel <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                {channels.map((channel) => {
                                    const Icon = channel.icon;
                                    return (
                                        <button
                                            key={channel.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: channel.id })}
                                            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border-2 ${formData.channel === channel.id
                                                ? `${channel.color} text-white border-transparent`
                                                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {channel.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Template Name */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Template Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Welcome Email"
                                required
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject (Email Only) */}
                        {formData.channel === 'email' && (
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                    Subject Line <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Welcome to {{storeName}}!"
                                    required={formData.channel === 'email'}
                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Message Content */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-[#0f172a]">
                                    Message Content <span className="text-red-500">*</span>
                                </label>
                                {formData.channel === 'sms' && (
                                    <span className={`text-xs font-medium ${showCharWarning ? 'text-red-600' : 'text-[#64748b]'
                                        }`}>
                                        {charCount}/160 characters {showCharWarning && '(Warning: Exceeds SMS limit)'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                value={formData.bodyHtml}
                                onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                                placeholder="Dear {{patientName}},&#10;&#10;Welcome to our pharmacy..."
                                required
                                rows={formData.channel === 'sms' ? 4 : 10}
                                className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent resize-none font-mono text-sm"
                            />
                            <p className="text-xs text-[#64748b] mt-1">
                                Use {`{{variableName}}`} syntax for dynamic content
                                {formData.channel === 'whatsapp' && ' • WhatsApp supports *bold*, _italic_, ~strikethrough~'}
                            </p>
                        </div>

                        {/* Variables */}
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">Template Variables</label>

                            {/* Common Variables */}
                            <div className="mb-3">
                                <p className="text-xs text-[#64748b] mb-2">Quick add common variables:</p>
                                <div className="flex flex-wrap gap-2">
                                    {commonVariables.map((variable) => (
                                        <button
                                            key={variable}
                                            type="button"
                                            onClick={() => handleAddVariable(variable)}
                                            disabled={formData.variables.includes(variable)}
                                            className="px-3 py-1 text-xs bg-[#f8fafc] border border-[#e2e8f0] text-[#64748b] rounded hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            + {variable}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Variable */}
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newVariable}
                                    onChange={(e) => setNewVariable(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddVariable(newVariable);
                                        }
                                    }}
                                    placeholder="Add custom variable..."
                                    className="flex-1 px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleAddVariable(newVariable)}
                                    className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-sm font-medium"
                                >
                                    Add
                                </button>
                            </div>

                            {/* Selected Variables */}
                            {formData.variables.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.variables.map((variable) => (
                                        <span
                                            key={variable}
                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono bg-[#fef3c7] text-[#92400e]"
                                        >
                                            {`{{${variable}}}`}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveVariable(variable)}
                                                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                                            >
                                                <FiX className="w-3.5 h-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg text-sm text-[#dc2626]">
                                {error}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-[#e2e8f0] flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Updating...
                            </>
                        ) : (
                            <>
                                <FiCheckCircle className="w-4 h-4" />
                                Update Template
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
