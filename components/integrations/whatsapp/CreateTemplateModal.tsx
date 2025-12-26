'use client';

import { useState } from 'react';
import { FaTimes, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { whatsappApi } from '@/lib/api/whatsapp';

interface CreateTemplateModalProps {
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'basic' | 'content' | 'variables' | 'review';

export default function CreateTemplateModal({
    storeId,
    isOpen,
    onClose,
    onSuccess,
}: CreateTemplateModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('basic');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [language, setLanguage] = useState('en_IN');
    const [category, setCategory] = useState('TRANSACTIONAL');
    const [headerType, setHeaderType] = useState<'none' | 'text'>('none');
    const [headerText, setHeaderText] = useState('');
    const [body, setBody] = useState('');
    const [footer, setFooter] = useState('');

    if (!isOpen) return null;

    const extractVariables = (text: string): string[] => {
        const matches = text.match(/\{\{(\d+)\}\}/g);
        return matches ? matches.map((m) => m) : [];
    };

    const bodyVariables = extractVariables(body);
    const headerVariables = headerType === 'text' ? extractVariables(headerText) : [];

    const renderPreview = () => {
        const renderText = (text: string) => {
            return text.replace(/\{\{(\d+)\}\}/g, (match) => {
                return `<span class="bg-blue-100 text-blue-800 px-1 rounded font-mono text-sm">${match}</span>`;
            });
        };

        return (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm">
                    {headerType === 'text' && headerText && (
                        <div
                            className="font-semibold text-gray-900 mb-2"
                            dangerouslySetInnerHTML={{ __html: renderText(headerText) }}
                        />
                    )}
                    <div
                        className="text-gray-800 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: renderText(body) }}
                    />
                    {footer && (
                        <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            await whatsappApi.createTemplate({
                storeId,
                name,
                language,
                category,
                body,
                headerType: headerType === 'none' ? undefined : headerType,
                headerText: headerType === 'text' ? headerText : undefined,
                footer: footer || undefined,
            });
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setBody('');
            setFooter('');
            setHeaderText('');
            setCurrentStep('basic');
        } catch (error: any) {
            alert(`Failed to create template: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const canProceedToContent = name.trim() !== '' && /^[a-z0-9_]+$/.test(name);
    const canProceedToVariables = body.trim() !== '';
    const canSubmit = name && body;

    const renderStepIndicator = () => {
        const steps: { id: Step; label: string }[] = [
            { id: 'basic', label: 'Basic Info' },
            { id: 'content', label: 'Content' },
            { id: 'variables', label: 'Variables' },
            { id: 'review', label: 'Review' },
        ];

        const stepIndex = steps.findIndex((s) => s.id === currentStep);

        return (
            <div className="flex items-center justify-between mb-8">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${idx <= stepIndex
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {idx < stepIndex ? <FaCheckCircle className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span
                                className={`text-xs mt-1 ${idx <= stepIndex ? 'text-emerald-600 font-medium' : 'text-gray-500'
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div
                                className={`h-0.5 flex-1 -mx-4 ${idx < stepIndex ? 'bg-emerald-600' : 'bg-gray-200'
                                    }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-900">Create WhatsApp Template</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                    {renderStepIndicator()}

                    {/* Step 1: Basic Info */}
                    {currentStep === 'basic' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    placeholder="rx_ready_notification"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use lowercase letters, numbers, and underscores only
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Language *</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="en">English</option>
                                    <option value="en_IN">English (India)</option>
                                    <option value="hi">Hindi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="TRANSACTIONAL">Transactional</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="MARKETING">Marketing</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {category === 'TRANSACTIONAL' && 'For order updates, prescriptions, invoices'}
                                    {category === 'UTILITY' && 'For account updates, alerts, reminders'}
                                    {category === 'MARKETING' && 'For promotions and offers'}
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                <div className="flex gap-3">
                                    <FaExclamationTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Template Approval Required</p>
                                        <p>WhatsApp will review your template. Approval usually takes a few hours.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Content */}
                    {currentStep === 'content' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Header (Optional)
                                </label>
                                <select
                                    value={headerType}
                                    onChange={(e) => setHeaderType(e.target.value as 'none' | 'text')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                                >
                                    <option value="none">No Header</option>
                                    <option value="text">Text Header</option>
                                </select>
                                {headerType === 'text' && (
                                    <input
                                        type="text"
                                        value={headerText}
                                        onChange={(e) => setHeaderText(e.target.value)}
                                        placeholder="Prescription Ready!"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message Body *
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Hello {{1}}, your prescription {{2}} is ready for pickup at {{3}}."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use {`{{1}}, {{2}}, {{3}}`} for variables. They will be replaced with actual values when sending.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Footer (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={footer}
                                    onChange={(e) => setFooter(e.target.value)}
                                    placeholder="– HopeRx Pharmacy"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Variables */}
                    {currentStep === 'variables' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Variables Preview</h3>
                                {[...headerVariables, ...bodyVariables].length === 0 ? (
                                    <p className="text-gray-500">No variables in your template.</p>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Found {[...headerVariables, ...bodyVariables].length} variable(s):
                                        </p>
                                        {[...new Set([...headerVariables, ...bodyVariables])].map((variable, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                            >
                                                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">
                                                    {variable}
                                                </code>
                                                <span className="text-sm text-gray-600">
                                                    Will be replaced with dynamic content when sending
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h4 className="text-md font-semibold text-gray-900 mb-3">Sample Preview</h4>
                                    {renderPreview()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 'review' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <FaCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-green-900 mb-1">Ready to Submit</h3>
                                        <p className="text-sm text-green-800">
                                            Your template will be submitted to WhatsApp for approval.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Template Details</h4>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Name:</span>
                                            <span className="font-medium text-gray-900">{name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Language:</span>
                                            <span className="font-medium text-gray-900">{language}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Category:</span>
                                            <span className="font-medium text-gray-900">{category}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                                    {renderPreview()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-xl">
                    <button
                        onClick={() => {
                            if (currentStep === 'basic') {
                                onClose();
                            } else if (currentStep === 'content') {
                                setCurrentStep('basic');
                            } else if (currentStep === 'variables') {
                                setCurrentStep('content');
                            } else if (currentStep === 'review') {
                                setCurrentStep('variables');
                            }
                        }}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                    >
                        {currentStep === 'basic' ? 'Cancel' : 'Back'}
                    </button>

                    <button
                        onClick={() => {
                            if (currentStep === 'basic') {
                                setCurrentStep('content');
                            } else if (currentStep === 'content') {
                                setCurrentStep('variables');
                            } else if (currentStep === 'variables') {
                                setCurrentStep('review');
                            } else if (currentStep === 'review') {
                                handleSubmit();
                            }
                        }}
                        disabled={
                            (currentStep === 'basic' && !canProceedToContent) ||
                            (currentStep === 'content' && !canProceedToVariables) ||
                            (currentStep === 'review' && submitting)
                        }
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        {currentStep === 'review'
                            ? submitting
                                ? 'Submitting...'
                                : 'Submit for Approval'
                            : 'Next'}
                        {currentStep !== 'review' && <FaArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
