import { useState, useEffect } from 'react';
import { FaWhatsapp, FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface PreConnectionEducationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnectEmbedded: () => void;
    onConnectManual: () => void;
    onNeedHelp: () => void;
}

export default function PreConnectionEducationModal({
    isOpen,
    onClose,
    onConnectEmbedded,
    onConnectManual,
    onNeedHelp,
}: PreConnectionEducationModalProps) {
    const [step, setStep] = useState<'education' | 'selection'>('education');

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) setStep('education');
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <FaWhatsapp className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'education' ? 'How WhatsApp works in HopeRx' : 'Connect WhatsApp Business'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FaTimes className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {step === 'education' ? (
                        <>
                            {/* STEP 1: EDUCATION */}

                            {/* Important Note */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex gap-3">
                                    <FaExclamationCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-amber-900 mb-1">
                                            WhatsApp requires a Business account
                                        </h3>
                                        <p className="text-sm text-amber-800">
                                            Personal WhatsApp numbers are not supported. You'll need a WhatsApp Business account to continue.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* How it Works */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 text-lg">What you need to know:</h3>

                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600">1</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">Messages are sent from <strong>your WhatsApp Business number</strong></p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                HopeRx becomes your control panel, but customers see your business name and number.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600">2</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">Customers can reply and chat within 24 hours</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                After a customer replies, you have a 24-hour window for free-form conversation. After that, you'll need to use templates.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600">3</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">Some messages require <strong>WhatsApp approval</strong> (one-time)</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Templates for prescription alerts, invoices, etc. must be approved by WhatsApp before use. This usually takes a few hours.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600">4</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-700 font-medium">WhatsApp may charge per conversation (paid directly to WhatsApp)</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                HopeRx doesn't charge for messaging, but WhatsApp has its own pricing. Check Meta's pricing page for details.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                    <FaCheckCircle className="w-4 h-4" />
                                    Why use WhatsApp Business?
                                </h3>
                                <ul className="space-y-2 text-sm text-green-800">
                                    <li className="flex gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Send prescription ready notifications instantly</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Share invoices and payment reminders</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span>Chat with customers in real-time</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-green-600">✓</span>
                                        <span>All messages organized in one dashboard</span>
                                    </li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* STEP 2: SELECTION */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 text-lg">Choose how to connect:</h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Option 1: Embedded Signup */}
                                    <button
                                        onClick={onConnectEmbedded}
                                        className="flex flex-col items-start p-5 border-2 border-gray-100 hover:border-green-500 bg-white hover:bg-green-50/30 rounded-xl transition-all group text-left h-full"
                                    >
                                        <div className="mb-3 p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                            <FaWhatsapp className="w-6 h-6 text-green-700" />
                                        </div>
                                        <span className="font-bold text-gray-900 group-hover:text-green-800 mb-1 text-lg">
                                            Facebook Login
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-2">Recommended</span>
                                        <span className="text-sm text-gray-500 mb-4 flex-grow">
                                            Log in with Facebook to automatically create your account, verify your number, and connect instantly.
                                        </span>
                                        <span className="w-full text-center px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg group-hover:bg-green-700 transition-colors">
                                            Connect with Facebook
                                        </span>
                                    </button>

                                    {/* Option 2: Manual Setup */}
                                    <button
                                        onClick={onConnectManual}
                                        className="flex flex-col items-start p-5 border-2 border-gray-100 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-all group text-left h-full"
                                    >
                                        <div className="mb-3 p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                                            <FaCheckCircle className="w-6 h-6 text-gray-600" />
                                        </div>
                                        <span className="font-bold text-gray-900 group-hover:text-gray-800 mb-1 text-lg">
                                            Manual Setup
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Advanced</span>
                                        <span className="text-sm text-gray-500 mb-4 flex-grow">
                                            Already have a System User Token? Paste it manually to connect your existing WABA.
                                        </span>
                                        <span className="w-full text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg group-hover:bg-gray-200 transition-colors">
                                            Use System Token
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2 text-sm">Requirements:</h4>
                                <ul className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                                    <li className="flex items-center gap-1.5">• Facebook Business Manager</li>
                                    <li className="flex items-center gap-1.5">• Business Phone Number</li>
                                    <li className="flex items-center gap-1.5">• Credit Card (for Meta)</li>
                                    <li className="flex items-center gap-1.5">• Admin Access</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-xl z-10">
                    <button
                        onClick={onNeedHelp}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                        {step === 'education' ? "Don't have WhatsApp Business?" : "Need help deciding?"}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={step === 'selection' ? () => setStep('education') : onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            {step === 'selection' ? 'Back' : 'Cancel'}
                        </button>

                        {step === 'education' && (
                            <button
                                onClick={() => setStep('selection')}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                I understand, Proceed
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
