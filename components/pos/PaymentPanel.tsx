'use client';

import { useState } from 'react';
import { FiUser, FiCreditCard, FiSmartphone, FiDollarSign, FiPrinter } from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';

export default function PaymentPanel({ basketItems, customer, onCustomerChange, onFinalize, onOpenCustomer, onSplitPayment }: any) {
  const [invoiceType, setInvoiceType] = useState<'receipt' | 'gst' | 'credit'>('receipt');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const subtotal = basketItems.reduce((sum: number, item: any) =>
    sum + (item.qty * item.mrp - (item.discount || 0)), 0
  );

  const taxAmount = basketItems.reduce((sum: number, item: any) => {
    const lineTotal = item.qty * item.mrp - (item.discount || 0);
    return sum + (lineTotal * item.gstRate / (100 + item.gstRate));
  }, 0);

  const total = subtotal;
  const roundOff = Math.round(total) - total;
  const finalTotal = Math.round(total);

  const handleFinalize = () => {
    if (basketItems.length === 0) return;
    setShowFinalizeModal(true);
  };

  const confirmFinalize = () => {
    setShowFinalizeModal(false);
    onFinalize(paymentMethod.toUpperCase());
  };


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Customer Section */}
        <div className="bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#64748b]">Customer</span>
            <button onClick={onOpenCustomer} className="text-xs text-[#0ea5a3] hover:underline">+ Add</button>
          </div>
          {customer ? (
            <div className="flex items-center gap-2">
              <FiUser className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#0f172a]">{customer.name}</span>
            </div>
          ) : (
            <div className="text-xs text-[#94a3b8]">Walk-in customer</div>
          )}
        </div>

        {/* Invoice Type */}
        <div>
          <label className="text-sm font-medium text-[#64748b] mb-2 block">Invoice Type</label>
          <select
            value={invoiceType}
            onChange={(e) => setInvoiceType(e.target.value as any)}
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
          >
            <option value="receipt">Regular Receipt</option>
            <option value="gst">Tax Invoice (GST)</option>
            <option value="credit">Credit Note</option>
          </select>
        </div>

        {/* Summary */}
        <div className="bg-white border border-[#e2e8f0] rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Subtotal</span>
            <span className="text-[#0f172a]">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Tax (GST)</span>
            <span className="text-[#0f172a]">₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Round-off</span>
            <span className="text-[#0f172a]">₹{roundOff.toFixed(2)}</span>
          </div>
          <div className="border-t border-[#e2e8f0] pt-2 flex justify-between">
            <span className="font-semibold text-[#0f172a]">Total</span>
            <span className="font-bold text-xl text-[#0ea5a3]">₹{finalTotal}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="text-sm font-medium text-[#64748b] mb-2 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${paymentMethod === 'cash'
                  ? 'border-[#0ea5a3] bg-[#f0fdfa]'
                  : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
            >
              <FiDollarSign className="w-5 h-5" />
              <span className="text-xs font-medium">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${paymentMethod === 'card'
                  ? 'border-[#0ea5a3] bg-[#f0fdfa]'
                  : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
            >
              <FiCreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${paymentMethod === 'upi'
                  ? 'border-[#0ea5a3] bg-[#f0fdfa]'
                  : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
            >
              <FiSmartphone className="w-5 h-5" />
              <span className="text-xs font-medium">UPI</span>
            </button>
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${paymentMethod === 'wallet'
                  ? 'border-[#0ea5a3] bg-[#f0fdfa]'
                  : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
            >
              <BsWallet2 className="w-5 h-5" />
              <span className="text-xs font-medium">Wallet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-[#e2e8f0] p-4 bg-white space-y-2">
        <button
          onClick={handleFinalize}
          disabled={basketItems.length === 0}
          className="w-full py-4 bg-[#0ea5a3] text-white rounded-lg font-semibold text-lg hover:bg-[#0d9391] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
        >
          Collect ₹{finalTotal}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSplitPayment}
            disabled={basketItems.length === 0}
            className="flex-1 py-2 text-sm border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50"
          >
            Split (F9)
          </button>
          <button className="flex-1 py-2 text-sm border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-1">
            <FiPrinter className="w-4 h-4" />
            Print (F12)
          </button>
        </div>
      </div>

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4">Confirm Sale</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Items</span>
                <span className="font-medium">{basketItems.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Payment Method</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-[#0ea5a3]">₹{finalTotal}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalize}
                className="flex-1 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391]"
              >
                Confirm & Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
