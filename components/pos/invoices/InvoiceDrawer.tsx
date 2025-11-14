'use client';

import { useState } from 'react';
import { FiX, FiPrinter, FiMail, FiMessageSquare, FiRotateCcw, FiDownload, FiClock } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';

const MOCK_ITEMS = [
  { name: 'Paracetamol', strength: '500mg', pack: '10 tabs', qty: 2, batch: 'B-2025-01', expiry: 'Dec 2025', price: 45, gst: 12, total: 90 },
  { name: 'Atorvastatin', strength: '10mg', pack: '15 tabs', qty: 1, batch: 'B-2024-33', expiry: 'Nov 2025', price: 150, gst: 12, total: 150 },
];

export default function InvoiceDrawer({ invoice, onClose }: any) {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  return (
    <>
      <div className="w-[40%] bg-white border-l border-[#e2e8f0] flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">{invoice.id}</h2>
            <p className="text-sm text-[#64748b]">{invoice.date} at {invoice.time}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f8fafc] rounded-lg">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#d1fae5] text-[#065f46] text-sm font-medium rounded-full">
              {invoice.status}
            </span>
            {invoice.type === 'GST' && (
              <span className="px-3 py-1 bg-[#fef3c7] text-[#92400e] text-sm font-medium rounded-full">
                GST Invoice
              </span>
            )}
            {invoice.hasEInvoice && (
              <span className="px-3 py-1 bg-[#e9d5ff] text-[#6b21a8] text-sm font-medium rounded-full">
                E-Invoice
              </span>
            )}
          </div>

          {/* Customer */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Customer Details</h3>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#0f172a]">{invoice.customer.name}</p>
              <p className="text-sm text-[#64748b]">{invoice.customer.phone}</p>
              {invoice.type === 'GST' && (
                <p className="text-xs text-[#64748b]">GSTIN: 29ABCDE1234F1Z5</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Payment Details</h3>
            <div className="space-y-2">
              {invoice.paymentModes.includes('Cash') && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Cash</span>
                  <span className="font-medium text-[#0f172a]">₹500</span>
                </div>
              )}
              {invoice.paymentModes.includes('UPI') && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">UPI (GPay)</span>
                  <span className="font-medium text-[#0f172a]">₹350</span>
                </div>
              )}
              {invoice.paymentModes.includes('Card') && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748b]">Card (HDFC)</span>
                  <span className="font-medium text-[#0f172a]">₹{invoice.amount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Items</h3>
            <div className="space-y-2">
              {MOCK_ITEMS.map((item, idx) => (
                <div key={idx} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0f172a]">
                        {item.name} • {item.strength} • {item.pack}
                      </p>
                      <p className="text-xs text-[#64748b] mt-1">
                        Batch: {item.batch} • Expiry: {item.expiry} • GST: {item.gst}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#0f172a]">₹{item.total}</p>
                      <p className="text-xs text-[#64748b]">₹{item.price} × {item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="text-[#0f172a]">₹800</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Discount</span>
                <span className="text-[#10b981]">-₹50</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">GST</span>
                <span className="text-[#0f172a]">₹102</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Round-off</span>
                <span className="text-[#0f172a]">-₹2</span>
              </div>
              <div className="border-t border-[#e2e8f0] pt-2 flex justify-between">
                <span className="font-semibold text-[#0f172a]">Total</span>
                <span className="font-bold text-xl text-[#0ea5a3]">₹{invoice.amount}</span>
              </div>
            </div>
          </div>

          {/* Prescription */}
          {invoice.hasRx && (
            <div className="bg-[#dbeafe] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#1e40af] mb-2">Prescription Linked</h3>
              <p className="text-sm text-[#1e40af]">Dr. Sharma • Rx #RX-2025-00045</p>
              <button className="text-xs text-[#1e40af] hover:underline mt-1">View Prescription →</button>
            </div>
          )}

          {/* E-Invoice */}
          {invoice.hasEInvoice && (
            <div className="bg-[#f3e8ff] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#6b21a8] mb-2">E-Invoice Details</h3>
              <div className="space-y-1 text-xs text-[#6b21a8]">
                <p>IRN: 8f3d2a1b9c4e5f6a7b8c9d0e1f2a3b4c</p>
                <p>Ack No: 112025012345678</p>
                <div className="flex items-center gap-2 mt-2">
                  <BsQrCode className="w-8 h-8" />
                  <button className="text-xs hover:underline">Download JSON</button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log */}
          <button
            onClick={() => setShowAuditLog(true)}
            className="w-full py-2 text-sm text-[#0ea5a3] border border-[#0ea5a3] rounded-lg hover:bg-[#f0fdfa] flex items-center justify-center gap-2"
          >
            <FiClock className="w-4 h-4" />
            View Audit Log
          </button>
        </div>

        {/* Actions */}
        <div className="border-t border-[#e2e8f0] p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2">
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
            <button className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2">
              <FiMessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center justify-center gap-2">
              <FiMail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setShowReturnModal(true)}
              className="py-2 border border-[#ef4444] text-[#ef4444] rounded-lg hover:bg-[#fef2f2] flex items-center justify-center gap-2"
            >
              <FiRotateCcw className="w-4 h-4" />
              Return
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAuditLog(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-bold text-[#0f172a]">Audit Log</h3>
              <button onClick={() => setShowAuditLog(false)} className="p-1 hover:bg-[#f8fafc] rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {[
                { action: 'Sale created by Aman', time: '2:12 PM' },
                { action: 'Payment received (UPI)', time: '2:13 PM' },
                { action: 'Invoice printed', time: '2:13 PM' },
                { action: 'WhatsApp sent to +91 98765XXXX', time: '2:14 PM' },
              ].map((log, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0ea5a3] mt-1.5" />
                  <div className="flex-1">
                    <p className="text-sm text-[#0f172a]">{log.action}</p>
                    <p className="text-xs text-[#64748b]">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowReturnModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-bold text-[#0f172a]">Return Items</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-1 hover:bg-[#f8fafc] rounded">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {MOCK_ITEMS.map((item, idx) => (
                <label key={idx} className="flex items-center gap-3 p-3 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0f172a]">{item.name} {item.strength}</p>
                    <p className="text-xs text-[#64748b]">Qty: 1 of {item.qty} • Batch: {item.batch}</p>
                  </div>
                  <span className="text-sm font-semibold">₹{item.price}</span>
                </label>
              ))}
              <div className="pt-3 border-t border-[#e2e8f0]">
                <label className="text-sm font-medium text-[#64748b] mb-2 block">Return Type</label>
                <select className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm">
                  <option>Refund to original tender</option>
                  <option>Store credit</option>
                  <option>Replacement</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-[#e2e8f0] flex gap-3">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc]">
                Cancel
              </button>
              <button className="flex-1 py-2 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626]">
                Process Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
