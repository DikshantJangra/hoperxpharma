'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiPrinter, FiMail, FiMessageSquare, FiRotateCcw, FiDownload, FiClock } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { salesApi } from '@/lib/api/sales';
import InvoiceEmailModal from './InvoiceEmailModal';

const DrawerSkeleton = () => (
  <div className="w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#e2e8f0] flex flex-col h-full animate-pulse">
    <div className="p-4 md:p-5 border-b border-[#e2e8f0]">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-100 rounded w-1/4"></div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-6 w-24 bg-gray-100 rounded-full"></div>
      </div>
      <div className="h-20 bg-gray-100 rounded-lg"></div>
      <div className="h-20 bg-gray-100 rounded-lg"></div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-16 bg-gray-100 rounded-lg mb-2"></div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
      </div>
      <div className="h-24 bg-gray-100 rounded-lg"></div>
    </div>
    <div className="border-t border-[#e2e8f0] p-4 md:p-5 space-y-3">
      <div className="h-11 bg-gray-200 rounded-lg"></div>
      <div className="h-11 bg-gray-100 rounded-lg"></div>
    </div>
  </div>
)

export default function InvoiceDrawer({ invoice, onClose, isLoading }: any) {
  const router = useRouter();
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    if (!invoice?.saleId) {
      console.error("No sale ID found for printing");
      return;
    }

    try {
      setIsPrinting(true);

      // Cleanup any previous print iframe to avoid memory leaks
      const existingIframe = document.getElementById('print-iframe');
      if (existingIframe) {
        document.body.removeChild(existingIframe);
      }

      const blob = await salesApi.downloadInvoicePDF(invoice.saleId);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);

      const iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return <DrawerSkeleton />;
  }

  if (!invoice) {
    return (
      <div className="w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#e2e8f0] flex flex-col h-full items-center justify-center text-gray-500 p-6">
        <p className="text-center">Select an invoice to see details.</p>
      </div>
    )
  }

  const items = invoice.items || [];

  return (
    <>
      {/* Drawer Container - Fixed width on desktop, full width overlay on mobile */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#e2e8f0] flex flex-col h-full shadow-xl md:shadow-none">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-xl font-bold text-[#0f172a] truncate">{invoice.id}</h2>
            <p className="text-sm text-[#64748b]">{invoice.date} at {invoice.time}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors shrink-0"
            aria-label="Close drawer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 bg-[#d1fae5] text-[#065f46] text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
              {invoice.status}
            </span>
            {invoice.type === 'GST' && (
              <span className="px-3 py-1.5 bg-[#fef3c7] text-[#92400e] text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
                GST Invoice
              </span>
            )}
            {invoice.hasEInvoice && (
              <span className="px-3 py-1.5 bg-[#e9d5ff] text-[#6b21a8] text-xs md:text-sm font-medium rounded-full whitespace-nowrap">
                E-Invoice
              </span>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-[#f8fafc] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Customer Details</h3>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#0f172a]">{invoice.customer.name}</p>
              {invoice.customer.phone && invoice.customer.phone !== '-' && (
                <p className="text-sm text-[#64748b]">{invoice.customer.phone}</p>
              )}
              {invoice.type === 'GST' && invoice.customer.gstin && (
                <p className="text-xs text-[#64748b]">GSTIN: {invoice.customer.gstin}</p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-[#f8fafc] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Payment Details</h3>
            <div className="space-y-2">
              {invoice.paymentModes.map((payment: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-[#64748b]">{payment.mode}</span>
                  <span className="font-medium text-[#0f172a]">₹{payment.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dispensed For */}
          {invoice.dispenseFor && (
            <div className="bg-[#fef3c7] rounded-xl p-4 border border-[#fde68a]">
              <h3 className="text-xs font-semibold text-[#92400e] uppercase tracking-wide mb-2">Dispensed For</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#78350f]">{invoice.dispenseFor.name}</p>
                {invoice.dispenseFor.phone && (
                  <p className="text-sm text-[#92400e]">{invoice.dispenseFor.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Items ({items.length})</h3>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white border border-[#e2e8f0] rounded-xl p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-sm font-medium text-[#0f172a] leading-tight">
                          {item.name}
                          {item.strength && <span className="text-[#64748b]"> • {item.strength}</span>}
                          {item.pack && <span className="text-[#64748b]"> • {item.pack}</span>}
                        </p>
                        {item.isRx && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200 uppercase tracking-wide shrink-0">
                            RX
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748b] mt-1.5 leading-relaxed">
                        Batch: {item.batch} • Exp: {item.expiry} • GST: {item.gst}%
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0f172a]">₹{item.total}</p>
                      <p className="text-xs text-[#64748b]">₹{item.price} × {item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#f8fafc] rounded-xl p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="text-[#0f172a]">₹{invoice.summary.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Discount</span>
                <span className="text-[#10b981]">-₹{invoice.summary.discount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Round-off</span>
                <span className="text-[#0f172a]">{invoice.summary.roundOff < 0 ? '-' : ''}₹{Math.abs(invoice.summary.roundOff)}</span>
              </div>
              <div className="border-t border-[#e2e8f0] pt-3 mt-3 flex justify-between items-center">
                <span className="font-semibold text-[#0f172a]">Total</span>
                <span className="font-bold text-xl md:text-2xl text-[#0ea5a3]">₹{invoice.amount}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-[#e2e8f0]">
                <p className="text-xs text-[#64748b] italic">GST ₹{invoice.summary.gst} included in total</p>
              </div>
            </div>
          </div>

          {/* Prescription */}
          {invoice.hasRx && (
            <div className="bg-[#dbeafe] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-[#1e40af] uppercase tracking-wide mb-2 flex items-center gap-2">
                Prescription Linked
                {invoice.isRefill && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                    REFILL
                  </span>
                )}
              </h3>
              <p className="text-sm text-[#1e40af] font-mono">ID: {invoice.prescriptionId?.substring(0, 12)}...</p>
              <button
                onClick={() => router.push(`/prescriptions/all-prescriptions`)}
                className="text-xs text-[#1e40af] hover:underline mt-2 font-medium"
              >
                View in Prescriptions →
              </button>
            </div>
          )}

          {/* E-Invoice */}
          {invoice.hasEInvoice && (
            <div className="bg-[#f3e8ff] rounded-xl p-4">
              <h3 className="text-xs font-semibold text-[#6b21a8] uppercase tracking-wide mb-2">E-Invoice Details</h3>
              <div className="space-y-1 text-xs text-[#6b21a8]">
                <p className="break-all">IRN: {invoice.eInvoice.irn}</p>
                <p>Ack No: {invoice.eInvoice.ackNo}</p>
                <div className="flex items-center gap-3 mt-3">
                  <BsQrCode className="w-8 h-8" />
                  <button className="text-xs font-medium hover:underline">Download JSON</button>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {invoice.attachments && invoice.attachments.length > 0 && (
            <div className="bg-[#f0f9ff] rounded-xl p-4 border border-[#bae6fd]">
              <h3 className="text-xs font-semibold text-[#0284c7] uppercase tracking-wide mb-3 flex items-center gap-2">
                <FiPrinter className="w-4 h-4" />
                Attachments ({invoice.attachments.length})
              </h3>
              <div className="space-y-2">
                {invoice.attachments.map((file: any, index: number) => (
                  <div key={index} className={`flex items-center justify-between p-2.5 rounded-lg border ${file.type === 'prescription'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-[#e0f2fe]'
                    }`}>
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div className={`p-1.5 rounded shrink-0 ${file.type === 'prescription'
                        ? 'bg-blue-200 text-blue-700'
                        : 'bg-[#e0f2fe] text-[#0284c7]'
                        }`}>
                        <span className="text-[10px] font-bold uppercase">
                          {file.type === 'prescription' ? 'RX' : (file.type?.substring(0, 3) || 'DOC')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#0f172a] truncate">{file.name || `Attachment ${index + 1}`}</p>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#e0f2fe] rounded-lg text-[#0284c7] shrink-0 transition-colors"
                      title="View/Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log Button */}
          <button
            onClick={() => setShowAuditLog(true)}
            className="w-full py-2.5 text-sm font-medium text-[#0ea5a3] border border-[#0ea5a3] rounded-xl hover:bg-[#f0fdfa] flex items-center justify-center gap-2 transition-colors"
          >
            <FiClock className="w-4 h-4" />
            View Audit Log
          </button>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="border-t border-[#e2e8f0] p-4 md:p-5 space-y-3 shrink-0 bg-white">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="py-3 px-4 bg-[#0ea5a3] text-white rounded-xl hover:bg-[#0d9391] flex items-center justify-center gap-2 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              <FiPrinter className="w-4 h-4 shrink-0" />
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>
            <button className="py-3 px-4 border border-[#cbd5e1] rounded-xl hover:bg-[#f8fafc] flex items-center justify-center gap-2 transition-colors font-medium text-sm">
              <FiMessageSquare className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>
          </div>
          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowEmailModal(true)}
              className="py-3 px-4 border border-[#cbd5e1] rounded-xl hover:bg-[#f8fafc] flex items-center justify-center gap-2 transition-colors font-medium text-sm"
            >
              <FiMail className="w-4 h-4 shrink-0" />
              <span>Email</span>
            </button>
            <button
              onClick={() => setShowReturnModal(true)}
              className="py-3 px-4 border border-[#ef4444] text-[#ef4444] rounded-xl hover:bg-[#fef2f2] flex items-center justify-center gap-2 transition-colors font-medium text-sm"
            >
              <FiRotateCcw className="w-4 h-4 shrink-0" />
              <span>Return</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAuditLog(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-bold text-[#0f172a]">Audit Log</h3>
              <button onClick={() => setShowAuditLog(false)} className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-5 max-h-[400px] overflow-y-auto space-y-3">
              {invoice.auditLog?.map((log: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0ea5a3] mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReturnModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-[#e2e8f0] shrink-0">
              <h3 className="text-lg font-bold text-[#0f172a]">Return Items</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-5 space-y-3 overflow-y-auto flex-1">
              {items.map((item: any, idx: number) => (
                <label key={idx} className="flex items-center gap-3 p-3 border border-[#e2e8f0] rounded-xl hover:bg-[#f8fafc] cursor-pointer transition-colors">
                  <input type="checkbox" className="w-4 h-4 text-[#0ea5a3] rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">{item.name} {item.strength}</p>
                    <p className="text-xs text-[#64748b]">Qty: 1 of {item.qty} • Batch: {item.batch}</p>
                  </div>
                  <span className="text-sm font-semibold shrink-0">₹{item.price}</span>
                </label>
              ))}
              <div className="pt-3 border-t border-[#e2e8f0]">
                <label className="text-sm font-medium text-[#64748b] mb-2 block">Return Type</label>
                <select className="w-full px-3 py-2.5 border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] focus:border-transparent">
                  <option>Refund to original tender</option>
                  <option>Store credit</option>
                  <option>Replacement</option>
                </select>
              </div>
            </div>
            <div className="p-4 md:p-5 border-t border-[#e2e8f0] flex gap-3 shrink-0">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 py-2.5 border border-[#cbd5e1] rounded-xl hover:bg-[#f8fafc] font-medium transition-colors">
                Cancel
              </button>
              <button className="flex-1 py-2.5 bg-[#ef4444] text-white rounded-xl hover:bg-[#dc2626] font-medium transition-colors">
                Process Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Email Modal */}
      {showEmailModal && (
        <InvoiceEmailModal
          isOpen={showEmailModal}
          invoice={invoice}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}