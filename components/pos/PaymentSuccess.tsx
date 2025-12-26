'use client';

import { useEffect, useState } from 'react';
import { FiDownload, FiPrinter, FiX } from 'react-icons/fi';

interface PaymentSuccessProps {
    invoiceNumber: string;
    amount: number;
    customerName?: string;
    onClose: () => void;
    onPrint?: () => void;
}

export default function PaymentSuccess({ invoiceNumber, amount, customerName, onClose, onPrint }: PaymentSuccessProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger animation start
        const timer = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div
                className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'
                    }`}
            >
                <div className="relative mb-6">
                    <div className={`w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 transition-all duration-700 delay-200 ${show ? 'scale-100' : 'scale-0'}`}>
                        <svg
                            className={`w-10 h-10 text-green-600 ${show ? 'animate-checkmark' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful</h2>
                    <p className="text-sm text-gray-500">Transaction Completed</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                    <div className="text-3xl font-bold text-gray-900 mb-1">₹{amount.toFixed(2)}</div>
                    <div className="text-sm font-medium text-gray-600 mb-3">{customerName || 'Walk-in Customer'}</div>

                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Invoice No</span>
                        <span className="font-mono font-bold text-gray-700">{invoiceNumber}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onPrint}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                        <FiPrinter className="w-4 h-4" />
                        Print
                    </button>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md shadow-teal-200 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Done
                    </button>
                </div>

                <style jsx>{`
          .animate-checkmark path {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            animation: draw 0.6s 0.3s cubic-bezier(0.65, 0, 0.45, 1) forwards;
          }
          @keyframes draw {
            100% { stroke-dashoffset: 0; }
          }
        `}</style>
            </div>
        </div>
    );
}
