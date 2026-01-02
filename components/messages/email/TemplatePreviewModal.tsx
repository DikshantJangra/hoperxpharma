'use client';

import { useRouter } from 'next/navigation';
import { FiX, FiSend, FiMail, FiSmartphone } from 'react-icons/fi';
import { MdWhatsapp } from 'react-icons/md';

interface TemplatePreviewModalProps {
    isOpen: boolean;
    template: any;
    onClose: () => void;
}

export default function TemplatePreviewModal({ isOpen, template, onClose }: TemplatePreviewModalProps) {
    const router = useRouter();

    const getChannelIcon = (channel: string) => {
        switch (channel?.toLowerCase()) {
            case 'whatsapp':
                return <MdWhatsapp className="w-5 h-5" />;
            case 'sms':
                return <FiSmartphone className="w-5 h-5" />;
            case 'email':
            default:
                return <FiMail className="w-5 h-5" />;
        }
    };

    const getChannelColor = (channel: string) => {
        switch (channel?.toLowerCase()) {
            case 'whatsapp':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'sms':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'email':
            default:
                return 'bg-purple-100 text-purple-700 border-purple-200';
        }
    };

    const handleUseTemplate = () => {
        // Store template in localStorage and redirect based on channel
        if (template) {
            localStorage.setItem('selectedTemplate', JSON.stringify(template));

            const channel = template.channel?.toLowerCase() || 'email';
            switch (channel) {
                case 'whatsapp':
                    router.push('/messages/whatsapp'); // Future WhatsApp composer
                    break;
                case 'sms':
                    router.push('/messages/sms'); // Future SMS composer
                    break;
                case 'email':
                default:
                    router.push('/messages/email');
                    break;
            }
        }
    };

    if (!isOpen || !template) return null;

    const channel = template.channel?.toLowerCase() || 'email';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-xl font-bold text-[#0f172a]">{template.name}</h2>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getChannelColor(channel)}`}>
                                {getChannelIcon(channel)}
                                {channel.charAt(0).toUpperCase() + channel.slice(1)}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f0fdf4] text-[#065f46]">
                                {template.category || 'General'}
                            </span>
                        </div>
                        <p className="text-sm text-[#64748b] mt-1">Template preview</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#f1f5f9] rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5 text-[#64748b]" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Subject (Email only) */}
                        {channel === 'email' && template.subject && (
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Subject Line</label>
                                <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[#0f172a]">
                                    {template.subject}
                                </div>
                            </div>
                        )}

                        {/* Message Body */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                                {channel === 'email' ? 'Email Body' : channel === 'whatsapp' ? 'WhatsApp Message' : 'SMS Content'}
                            </label>
                            <div className="px-4 py-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg min-h-[200px]">
                                {channel === 'email' ? (
                                    <div
                                        className="text-sm text-[#0f172a] prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: template.bodyHtml || '' }}
                                    />
                                ) : (
                                    <pre className="text-sm text-[#0f172a] whitespace-pre-wrap font-sans">
                                        {template.bodyHtml || ''}
                                    </pre>
                                )}
                            </div>
                            {channel === 'sms' && (
                                <p className="text-xs text-[#64748b] mt-2">
                                    Character count: {(template.bodyHtml || '').length}/160
                                    {(template.bodyHtml || '').length > 160 && (
                                        <span className="text-red-600 ml-1">(Exceeds SMS limit)</span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Variables */}
                        {template.variables && template.variables.length > 0 && (
                            <div>
                                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Template Variables</label>
                                <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {template.variables.map((variable: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-[#fef3c7] text-[#92400e]"
                                            >
                                                {`{{${variable}}}`}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-[#64748b] mt-3">
                                        These variables will be replaced with actual values when you send the {channel === 'email' ? 'email' : 'message'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Template Info</label>
                            <div className="px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm text-[#64748b] space-y-1">
                                <div className="flex items-center justify-between">
                                    <span>Template ID:</span>
                                    <span className="font-mono text-[#0f172a]">{template.id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Channel:</span>
                                    <span className="text-[#0f172a] capitalize">{channel}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Category:</span>
                                    <span className="text-[#0f172a]">{template.category || 'General'}</span>
                                </div>
                                {template.createdAt && (
                                    <div className="flex items-center justify-between">
                                        <span>Created:</span>
                                        <span className="text-[#0f172a]">{new Date(template.createdAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#e2e8f0] flex gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors font-medium"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleUseTemplate}
                        className="flex-1 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        <FiSend className="w-4 h-4" />
                        Use This Template
                    </button>
                </div>
            </div>
        </div>
    );
}
