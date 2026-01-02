'use client';

import { useState, useRef } from 'react';
import { FiX, FiCheckCircle, FiMail, FiSmartphone, FiInfo, FiEye } from 'react-icons/fi';
import { MdWhatsapp } from 'react-icons/md';

interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };
};

export default function CreateTemplateModal({ isOpen, onClose, onSuccess }: CreateTemplateModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        channel: 'email',
        subject: '',
        bodyHtml: '',
        category: 'notification',
        variables: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const channels = [
        { id: 'email', label: 'Email', icon: FiMail, color: 'bg-purple-500' },
        { id: 'whatsapp', label: 'WhatsApp', icon: MdWhatsapp, color: 'bg-green-500' },
        { id: 'sms', label: 'SMS', icon: FiSmartphone, color: 'bg-blue-500' }
    ];

    const categories = [
        { id: 'invoice', label: 'Invoice', desc: 'Payment receipts, bills' },
        { id: 'appointment', label: 'Appointment', desc: 'Booking confirmations, reminders' },
        { id: 'prescription', label: 'Prescription', desc: 'Ready for pickup, refills' },
        { id: 'marketing', label: 'Marketing', desc: 'Promotions, offers' },
        { id: 'welcome', label: 'Welcome', desc: 'New customer greetings' },
        { id: 'notification', label: 'Notification', desc: 'Order updates, alerts' },
        { id: 'follow-up', label: 'Follow-up', desc: 'Post-purchase, feedback' },
    ];

    // Define variables for each category
    const variablesByCategory: Record<string, Array<{ name: string; example: string; desc: string }>> = {
        invoice: [
            { name: 'patientName', example: 'John Doe', desc: 'Customer name' },
            { name: 'invoiceNumber', example: 'INV-001', desc: 'Invoice number' },
            { name: 'totalAmount', example: '₹1,250', desc: 'Total bill amount' },
            { name: 'paymentMethod', example: 'Card', desc: 'Payment method used' },
            { name: 'invoiceDate', example: 'Jan 15, 2025', desc: 'Invoice date' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
            { name: 'storeAddress', example: '123 Main St, Mumbai', desc: 'Your address' },
        ],
        appointment: [
            { name: 'patientName', example: 'John Doe', desc: 'Patient\'s name' },
            { name: 'doctorName', example: 'Dr. Smith', desc: 'Doctor\'s name' },
            { name: 'appointmentDate', example: 'Jan 15, 2025', desc: 'Appointment date' },
            { name: 'appointmentTime', example: '10:30 AM', desc: 'Appointment time' },
            { name: 'appointmentType', example: 'Consultation', desc: 'Type of appointment' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
            { name: 'storeAddress', example: '123 Main St, Mumbai', desc: 'Your address' },
        ],
        prescription: [
            { name: 'patientName', example: 'John Doe', desc: 'Patient\'s name' },
            { name: 'prescriptionId', example: 'RX-12345', desc: 'Prescription number' },
            { name: 'doctorName', example: 'Dr. Smith', desc: 'Prescribing doctor' },
            { name: 'medicationCount', example: '3', desc: 'Number of medications' },
            { name: 'pickupDate', example: 'Jan 15, 2025', desc: 'Ready for pickup date' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
            { name: 'storeAddress', example: '123 Main St, Mumbai', desc: 'Your address' },
        ],
        marketing: [
            { name: 'patientName', example: 'John Doe', desc: 'Customer name' },
            { name: 'offerTitle', example: '20% Off', desc: 'Promotion title' },
            { name: 'offerDetails', example: 'On all medicines', desc: 'Offer description' },
            { name: 'validUntil', example: 'Jan 31, 2025', desc: 'Offer expiry date' },
            { name: 'couponCode', example: 'SAVE20', desc: 'Discount code' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
        ],
        welcome: [
            { name: 'patientName', example: 'John Doe', desc: 'New customer name' },
            { name: 'welcomeOffer', example: '10% off first purchase', desc: 'Welcome discount' },
            { name: 'loyaltyPoints', example: '100', desc: 'Bonus points earned' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
            { name: 'storeAddress', example: '123 Main St, Mumbai', desc: 'Your address' },
        ],
        notification: [
            { name: 'patientName', example: 'John Doe', desc: 'Customer name' },
            { name: 'notificationTitle', example: 'Order Update', desc: 'Notification subject' },
            { name: 'notificationBody', example: 'Your order is ready', desc: 'Notification message' },
            { name: 'actionRequired', example: 'Pick up within 7 days', desc: 'Action needed' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
        ],
        'follow-up': [
            { name: 'patientName', example: 'John Doe', desc: 'Customer name' },
            { name: 'lastVisitDate', example: 'Jan 10, 2025', desc: 'Last purchase date' },
            { name: 'prescriptionId', example: 'RX-12345', desc: 'Previous prescription' },
            { name: 'nextRefillDate', example: 'Feb 10, 2025', desc: 'Refill due date' },
            { name: 'feedbackLink', example: 'https://survey.link', desc: 'Feedback form URL' },
            { name: 'storeName', example: 'HopeRx Pharmacy', desc: 'Your pharmacy name' },
            { name: 'storePhone', example: '+91 98765 43210', desc: 'Your phone number' },
        ],
    };

    // Get variables for current category
    const getAvailableVariables = () => {
        return variablesByCategory[formData.category] || variablesByCategory.notification;
    };

    const commonVariables = getAvailableVariables();

    // Insert variable into textarea at cursor position
    const insertVariable = (variableName: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.bodyHtml;
        const variableText = `{{${variableName}}}`;

        const newText = text.substring(0, start) + variableText + text.substring(end);
        setFormData({ ...formData, bodyHtml: newText });

        // Track which variables are being used
        if (!formData.variables.includes(variableName)) {
            setFormData(prev => ({
                ...prev,
                variables: [...prev.variables, variableName]
            }));
        }

        // Set cursor position after inserted variable
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variableText.length, start + variableText.length);
        }, 0);
    };

    const getPreviewText = () => {
        let preview = formData.bodyHtml;
        commonVariables.forEach(variable => {
            const regex = new RegExp(`{{${variable.name}}}`, 'g');
            preview = preview.replace(regex, variable.example);
        });
        return preview;
    };

    const getCharCount = () => formData.bodyHtml.length;

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
            const response = await fetch('/api/v1/email/templates', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create template');
            }

            // Reset form
            setFormData({
                name: '',
                channel: 'email',
                subject: '',
                bodyHtml: '',
                category: 'notification',
                variables: [],
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create template');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const charCount = getCharCount();
    const showCharWarning = formData.channel === 'sms' && charCount > 160;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-[#0f172a]">Create Message Template</h2>
                        <p className="text-sm text-[#64748b] mt-1">Build a reusable template that you can use anytime</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-[#64748b]" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        {/* Left Column - Form */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Channel Selection */}
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                    Channel <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {channels.map((channel) => {
                                        const Icon = channel.icon;
                                        return (
                                            <button
                                                key={channel.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, channel: channel.id })}
                                                className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border-2 ${formData.channel === channel.id
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
                                    placeholder="e.g., Prescription Ready Notification"
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
                                        <option key={cat.id} value={cat.id}>{cat.label} - {cat.desc}</option>
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
                                        placeholder="e.g., Your Prescription is Ready for Pickup"
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
                                            {charCount}/160
                                        </span>
                                    )}
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={formData.bodyHtml}
                                    onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                                    placeholder={`Click variables on the right to insert them into your message...\n\nExample:\nDear {{patientName}},\n\nYour prescription is ready for pickup at {{storeName}}.\n\nThank you!`}
                                    required
                                    rows={formData.channel === 'sms' ? 4 : 8}
                                    className="w-full px-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent resize-none font-mono text-sm"
                                />
                                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <FiInfo className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-blue-900">
                                        <strong>Tip:</strong> Click any variable from the list on the right to insert it at your cursor position.
                                        Variables like <code className="bg-blue-100 px-1 rounded">{'{{patientName}}'}</code> will be replaced with real data when you send the message.
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-[#fee2e2] border border-[#ef4444] rounded-lg text-sm text-[#dc2626]">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Right Column - Variables & Preview */}
                        <div className="space-y-4">
                            {/* Variables Panel */}
                            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
                                <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                                    <FiInfo className="w-4 h-4" />
                                    Available Variables
                                </h3>
                                <p className="text-xs text-[#64748b] mb-3">
                                    Click any variable to insert it into your message
                                </p>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                    {commonVariables.map((variable) => (
                                        <button
                                            key={variable.name}
                                            type="button"
                                            onClick={() => insertVariable(variable.name)}
                                            className="w-full text-left px-3 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:border-[#10b981] hover:bg-[#f0fdf4] transition-colors group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <code className="text-xs font-mono text-[#10b981] font-medium break-all">
                                                        {`{{${variable.name}}}`}
                                                    </code>
                                                    <p className="text-xs text-[#64748b] mt-0.5">{variable.desc}</p>
                                                </div>
                                                <span className="text-xs text-[#10b981] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    Insert
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Toggle */}
                            {formData.bodyHtml && (
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="w-full px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#64748b]"
                                >
                                    <FiEye className="w-4 h-4" />
                                    {showPreview ? 'Hide' : 'Show'} Preview
                                </button>
                            )}

                            {/* Live Preview */}
                            {showPreview && formData.bodyHtml && (
                                <div className="bg-white border border-[#e2e8f0] rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-[#0f172a] mb-2">Preview</h3>
                                    <p className="text-xs text-[#64748b] mb-3">How it will look with sample data:</p>
                                    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-3">
                                        <pre className="text-sm text-[#0f172a] whitespace-pre-wrap font-sans">
                                            {getPreviewText()}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-[#e2e8f0] flex gap-3 shrink-0 bg-[#f8fafc]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] bg-white rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
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
                                Creating...
                            </>
                        ) : (
                            <>
                                <FiCheckCircle className="w-4 h-4" />
                                Create Template
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
