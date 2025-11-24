'use client';

import { FiCheckCircle, FiPrinter, FiMessageSquare, FiShoppingCart } from 'react-icons/fi';

export default function SuccessScreen({ saleData, onNewSale, onClose }: any) {
  // Get the actual sale data from window if available
  const actualSale = typeof window !== 'undefined' ? (window as any).lastSale : null;
  const sale = actualSale || saleData;

  const invoiceNumber = sale?.invoiceNumber || saleData?.invoiceNo || 'INV-XXXX';
  const total = sale?.total || saleData?.total || 0;
  const paymentMethod = sale?.paymentSplits?.[0]?.paymentMethod || saleData?.method || 'CASH';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d1fae5] flex items-center justify-center">
            <FiCheckCircle className="w-10 h-10 text-[#10b981]" />
          </div>

          <h3 className="text-2xl font-bold text-[#0f172a] mb-2">Sale Completed!</h3>
          <p className="text-[#64748b] mb-4">Invoice #{invoiceNumber}</p>

          <div className="bg-[#f8fafc] rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[#64748b]">Amount Paid</span>
              <span className="font-semibold text-[#0f172a]">₹{Number(total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[#64748b]">Payment Method</span>
              <span className="font-semibold text-[#0f172a] capitalize">{paymentMethod.toLowerCase()}</span>
            </div>
            {sale?.items && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="text-sm text-[#64748b]">Items</span>
                <span className="font-semibold text-[#0f172a]">{sale.items.length}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] flex items-center justify-center gap-2"
            >
              <FiPrinter className="w-4 h-4" />
              Print Receipt
            </button>

            <button className="w-full py-3 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2">
              <FiMessageSquare className="w-4 h-4" />
              WhatsApp Invoice
            </button>

            <button
              onClick={onNewSale}
              className="w-full py-3 border-2 border-[#0ea5a3] text-[#0ea5a3] rounded-lg font-medium hover:bg-[#f0fdfa] flex items-center justify-center gap-2"
            >
              <FiShoppingCart className="w-4 h-4" />
              New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
