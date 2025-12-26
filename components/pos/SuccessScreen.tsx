'use client';

import { useEffect, useState } from 'react';
import { FiPrinter, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function SuccessScreen({ saleData, onNewSale, onClose }: any) {
  const [show, setShow] = useState(false);

  // Get the actual sale data associated with this success screen
  const sale = saleData;
  const invoiceNumber = sale?.invoiceNumber || saleData?.invoiceNo || 'INV-XXXX';
  const total = sale?.total || saleData?.total || 0;
  const paymentMethod = sale?.paymentSplits?.[0]?.paymentMethod || saleData?.method || 'CASH';

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
          <div className={`w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 transition-all duration-700 delay-200 ${show ? 'scale-100' : 'scale-0'}`}>
            <svg
              className={`w-12 h-12 text-green-600 ${show ? 'animate-checkmark' : ''}`}
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
          <div className="text-3xl font-bold text-gray-900 mb-1">₹{Number(total).toFixed(2)}</div>
          <div className="text-sm font-medium text-gray-600 mb-3 capitalize">{paymentMethod.toLowerCase()}</div>

          <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-xs">
            <span className="text-gray-500">Invoice No</span>
            <span className="font-mono font-bold text-gray-700">{invoiceNumber}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-[#0ea5a3] text-white rounded-xl font-bold hover:bg-[#0d9391] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
          >
            <FiPrinter className="w-4 h-4" />
            Print Receipt
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 border border-[#cbd5e1] rounded-xl hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 transition-all">
              <FaWhatsapp className="w-4 h-4 text-[#25D366]" />
              WhatsApp
            </button>

            <button
              onClick={onNewSale}
              className="py-2.5 border-2 border-[#0ea5a3] text-[#0ea5a3] rounded-xl font-bold hover:bg-[#f0fdfa] flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
            >
              <FiShoppingCart className="w-4 h-4" />
              New Sale
            </button>
          </div>
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
