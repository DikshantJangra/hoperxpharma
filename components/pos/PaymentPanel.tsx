'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FiUser, FiCreditCard, FiSmartphone, FiDollarSign, FiUserPlus, FiClock } from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';

export default function PaymentPanel({
  basketItems,
  customer,
  onCustomerChange,
  onFinalize,
  onOpenCustomer,
  onOpenLedger, // New Prop
  onSplitPayment,
  onClear,
  onApplyDiscount,
  totals // Receive calculated totals from parent
}: any) {
  const [invoiceType, setInvoiceType] = useState<'RECEIPT' | 'GST_INVOICE' | 'ESTIMATE'>('RECEIPT');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet' | 'credit'>('cash');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [processing, setProcessing] = useState(false);

  // Use passed totals or fallback to safe defaults
  const safeTotals = totals || {
    totalMrp: 0,
    totalDiscount: 0,
    taxableValue: 0,
    taxAmount: 0,
    roundOff: 0,
    total: 0
  };

  const handleFinalize = () => {
    // Validation 1: Empty basket
    if (basketItems.length === 0) {
      toast.error('Cannot complete sale with empty basket!');
      return;
    }

    // Validation 2: Customer Check - OPTIONAL for standard receipts
    if (invoiceType === 'GST_INVOICE' && !customer) {
      toast.error('Customer Details Required for Tax Invoice (GST)!');
      onOpenCustomer();
      return;
    }

    // Validation: Credit Sales require Customer
    if (paymentMethod === 'credit' && !customer) {
      toast.error('Customer Details Required for Credit/Pay Later!');
      onOpenCustomer();
      return;
    }
    // Warn but allow for regular receipts
    if (!customer && invoiceType !== 'RECEIPT') {
      toast.error('Customer required for this invoice type');
      return;
    }

    // Validation 3: Check for stock issues
    const stockIssues = basketItems.filter((item: any) =>
      item.qty > (item.stock || item.totalStock || 0)
    );

    if (stockIssues.length > 0) {
      const itemNames = stockIssues.map((item: any) => item.name).join(', ');
      toast.error(`Stock issue: ${itemNames}. Quantity exceeds available stock.`);
      return;
    }

    setShowFinalizeModal(true);
  };

  const confirmFinalize = async () => {
    try {
      setProcessing(true);
      setShowFinalizeModal(false);
      // Pass invoice type along with payment method
      await onFinalize(paymentMethod.toUpperCase(), undefined, invoiceType);
    } catch {
      // Error handled in parent
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f9ff]/30">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Top Actions Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Customer Selector */}
          <div className={`rounded-lg p-3 border transition-colors ${customer ? 'bg-white border-indigo-200' : 'bg-gray-50 border-dashed border-gray-300'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</span>
              {customer && <button onClick={() => onCustomerChange(null)} className="text-xs text-red-400 hover:text-red-600">Clear</button>}
            </div>
            {customer ? (
              <div className="flex items-center gap-2" role="button" onClick={onOpenCustomer}>
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                  {customer.firstName[0]}
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-900 truncate text-sm">{customer.firstName} {customer.lastName}</div>
                    {Number(customer.currentBalance) > 0 && (
                      <div className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Due: ₹{Number(customer.currentBalance).toFixed(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="text-[11px] text-gray-500">{customer.phoneNumber}</div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenLedger(); }}
                      className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-colors ${Number(customer.currentBalance) > 0
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                        }`}
                    >
                      {Number(customer.currentBalance) > 0 ? 'Pay Dues' : 'History'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 h-full">
                <div className="flex-1 flex flex-col items-center justify-center bg-teal-50 border border-teal-100 rounded-lg p-2 text-center group transition-colors hover:bg-teal-100 cursor-default" title="Current Mode: Walk-in / OTC">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Current Mode</span>
                  <div className="text-sm font-bold text-teal-800">Walk-in / OTC</div>
                </div>
                <button onClick={onOpenCustomer} className="flex-1 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all p-2 rounded-lg border border-dashed border-gray-300 hover:border-indigo-300 group">
                  <div className="w-6 h-6 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center transition-colors">
                    <FiUserPlus className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold">Add Customer</span>
                </button>
              </div>
            )}
          </div>

          {/* Invoice Type Selector */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Invoice Type</span>
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-1.5"
            >
              <option value="RECEIPT">Standard Receipt</option>
              <option value="GST_INVOICE">Tax Invoice (GST)</option>
              <option value="ESTIMATE">Estimate / Quote</option>
            </select>

            {/* Minimal Helper Text */}
            <div className="mt-1.5 text-[10px] leading-tight text-gray-500 px-1">
              {invoiceType === 'RECEIPT' && "Standard sale. Deducts stock & records revenue."}
              {invoiceType === 'GST_INVOICE' && <span className="text-orange-600">⚠ Requires Customer. Deducts stock.</span>}
              {invoiceType === 'ESTIMATE' && <span className="text-blue-600">ℹ Quotation only. Does NOT deduct stock.</span>}
            </div>
          </div>
        </div >

        {/* Financial Summary Card */}
        < div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" >
          <div className="p-4 space-y-3">

            {/* 1. Total MRP */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total MRP</span>
              <span className="font-medium text-gray-900">₹{safeTotals.totalMrp.toFixed(2)}</span>
            </div>

            {/* Overall Discount Input */}
            <div className="bg-green-50 rounded-lg p-2 border border-green-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-green-700 uppercase">Apply Discount</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setDiscountType('amount')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'amount' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-green-600 border border-green-200'}`}
                  >
                    ₹
                  </button>
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${discountType === 'percentage' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-green-600 border border-green-200'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={overallDiscount || ''}
                  onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                  placeholder={discountType === 'percentage' ? 'Ex: 10%' : 'Ex: 500'}
                  className="flex-1 px-2 py-1.5 text-sm rounded border border-green-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onApplyDiscount(discountType, overallDiscount);
                    }
                  }}
                />
                <button
                  onClick={() => onApplyDiscount(discountType, overallDiscount)}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* 2. Discounts */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Discount</span>
              <span className="font-medium text-green-600">-₹{safeTotals.totalDiscount.toFixed(2)}</span>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            {/* 3. Tax Breakdown (Info Only) */}
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Taxable Value</span>
              <span>₹{safeTotals.taxableValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>GST (Included)</span>
              <span>₹{safeTotals.taxAmount.toFixed(2)}</span>
            </div>

            <div className="h-px bg-gray-100 my-2"></div>

            {/* 4. Final Total */}
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Net Payable</span>
              <span className="text-2xl font-bold text-teal-600">₹{safeTotals.total}</span>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 text-xs text-center text-gray-500 border-t border-gray-100">
            {safeTotals.roundOff !== 0 && `Rounded off by ₹${safeTotals.roundOff.toFixed(2)}`}
          </div>
        </div >

        {/* Payment Methods */}
        < div >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Payment Mode</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', icon: FiDollarSign, label: 'Cash' },
              { id: 'upi', icon: FiSmartphone, label: 'UPI' },
              { id: 'card', icon: FiCreditCard, label: 'Card' },
              { id: 'wallet', icon: BsWallet2, label: 'Wallet' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === method.id
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                  : 'border-transparent bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <method.icon className="w-5 h-5" />
                <span className="text-xs font-semibold">{method.label}</span>
              </button>
            ))}
          </div>
        </div >
      </div >

      {/* Bottom Actions */}
      < div className="border-t border-gray-200 p-4 bg-white space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" >
        <div className="grid grid-cols-[1fr,1fr] gap-3">
          <button
            onClick={async () => {
              if (!customer) {
                toast.error('Customer Required for Pay Later!', { description: 'Please select a customer to add credit.' });
                onOpenCustomer();
                return;
              }
              setProcessing(true);
              try {
                await onFinalize('CREDIT', undefined, invoiceType);
              } finally {
                setProcessing(false);
              }
            }}
            disabled={basketItems.length === 0 || processing}
            className="w-full py-4 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-lg hover:bg-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing && paymentMethod === 'credit' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700"></div>
            ) : (
              <FiClock className="w-5 h-5" />
            )}
            <span>{processing && paymentMethod === 'credit' ? 'Processing...' : 'Pay Later'}</span>
          </button>

          <button
            onClick={handleFinalize}
            disabled={basketItems.length === 0 || processing}
            className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold text-lg hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
          >
            {processing && paymentMethod !== 'credit' ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : null}
            <span>{processing && paymentMethod !== 'credit' ? 'Processing...' : 'Collect'}</span>
            {!processing && <span>₹{safeTotals.total}</span>}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onSplitPayment}
            className="py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Split (F9)
          </button>
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }))}
            className="py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Draft (F2)
          </button>
        </div>
      </div >

      {/* Finalize Modal */}
      {
        showFinalizeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Confirm Sale</h3>

              <div className="space-y-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500 text-sm">Customer</span>
                    <span className="font-medium text-gray-900">{customer ? `${customer.firstName} ${customer.lastName}` : 'Guest (Walk-in)'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Total Items</span>
                    <span className="font-medium text-gray-900">{basketItems.length}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Payable</div>
                  <div className="text-4xl font-black text-teal-600">₹{safeTotals.total}</div>
                  <div className="text-sm text-gray-400 mt-1 capitalize">via {paymentMethod}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmFinalize}
                  className="py-3 px-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
                >
                  Complete
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
