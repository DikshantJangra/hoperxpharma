'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiPrinter, FiMail, FiMessageSquare, FiRotateCcw, FiDownload, FiClock } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { salesApi } from '@/lib/api/sales';

const DrawerSkeleton = () => (
  <div className="w-[40%] bg-white border-l border-[#e2e8f0] flex flex-col h-full animate-pulse">
    <div className="p-4 border-b border-[#e2e8f0]">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-100 rounded w-1/4"></div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    <div className="border-t border-[#e2e8f0] p-4 space-y-2">
      <div className="h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-10 bg-gray-100 rounded-lg"></div>
    </div>
  </div>
)

export default function InvoiceDrawer({ invoice, onClose, isLoading }: any) {
  const router = useRouter();
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    // Note: invoice.id in the drawer currently maps to invoiceNumber from the table.
    // invoice.saleId is passed from InvoiceTable mapping.

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
      // Ensure specific PDF type for browser compatibility
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);

      const iframe = document.createElement('iframe');
      iframe.id = 'print-iframe'; // Add ID for future cleanup
      // Use off-screen positioning
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        // Some browsers need focus before print
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();

        // WE DO NOT REMOVE THE IFRAME HERE.
        // Removing it while the print dialog is open causes it to crash/disappear in many browsers.
        // We clean it up at the start of the NEXT print job instead.
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
      <div className="w-[40%] bg-white border-l border-[#e2e8f0] flex flex-col h-full items-center justify-center text-gray-500">
        Select an invoice to see details.
      </div>
    )
  }

  const items = invoice.items || [];

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
              {invoice.customer.phone && invoice.customer.phone !== '-' && (
                <p className="text-sm text-[#64748b]">{invoice.customer.phone}</p>
              )}
              {invoice.type === 'GST' && invoice.customer.gstin && (
                <p className="text-xs text-[#64748b]">GSTIN: {invoice.customer.gstin}</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Payment Details</h3>
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
            <div className="bg-[#fef3c7] rounded-lg p-4 border border-[#fde68a]">
              <h3 className="text-sm font-semibold text-[#92400e] mb-2">Dispensed For</h3>
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
            <h3 className="text-sm font-semibold text-[#64748b] mb-2">Items ({items.length})</h3>
            <div className="space-y-2">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white border border-[#e2e8f0] rounded-lg p-3">
                  <div className="flex justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0f172a]">
                          {item.name} • {item.strength} • {item.pack}
                        </p>
                        {item.isRx && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded border border-purple-200 uppercase tracking-wide">
                            RX
                          </span>
                        )}
                      </div>
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
                <span className="text-[#0f172a]">₹{invoice.summary.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Discount</span>
                <span className="text-[#10b981]">-₹{invoice.summary.discount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">GST</span>
                <span className="text-[#0f172a]">₹{invoice.summary.gst}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Round-off</span>
                <span className="text-[#0f172a]">{invoice.summary.roundOff < 0 ? '-' : ''}₹{Math.abs(invoice.summary.roundOff)}</span>
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
              <p className="text-sm text-[#1e40af]">ID: {invoice.prescriptionId?.substring(0, 12)}...</p>
              <button
                onClick={() => router.push(`/prescriptions`)}
                className="text-xs text-[#1e40af] hover:underline mt-1 flex items-center gap-1"
              >
                View in Prescriptions →
              </button>
            </div>
          )}

          {/* E-Invoice */}
          {invoice.hasEInvoice && (
            <div className="bg-[#f3e8ff] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#6b21a8] mb-2">E-Invoice Details</h3>
              <div className="space-y-1 text-xs text-[#6b21a8]">
                <p>IRN: {invoice.eInvoice.irn}</p>
                <p>Ack No: {invoice.eInvoice.ackNo}</p>
                <div className="flex items-center gap-2 mt-2">
                  <BsQrCode className="w-8 h-8" />
                  <button className="text-xs hover:underline">Download JSON</button>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {invoice.attachments && invoice.attachments.length > 0 && (
            <div className="bg-[#f0f9ff] rounded-lg p-4 border border-[#bae6fd]">
              <h3 className="text-sm font-semibold text-[#0284c7] mb-3 flex items-center gap-2">
                <FiPrinter className="w-4 h-4" />
                Attachments ({invoice.attachments.length})
              </h3>
              <div className="space-y-2">
                {invoice.attachments.map((file: any, index: number) => (
                  <div key={index} className={`flex items-center justify-between p-2 rounded border ${file.type === 'prescription'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-[#e0f2fe]'
                    }`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-1.5 rounded ${file.type === 'prescription'
                        ? 'bg-blue-200 text-blue-700'
                        : 'bg-[#e0f2fe] text-[#0284c7]'
                        }`}>
                        <span className="text-[10px] font-bold uppercase">
                          {file.type === 'prescription' ? 'RX' : (file.type?.substring(0, 3) || 'DOC')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] truncate">{file.name || `Attachment ${index + 1}`}</p>
                      </div>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-[#f0f9ff] rounded text-[#0284c7]"
                      title="View/Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  </div>
                ))}
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
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiPrinter className="w-4 h-4" />
              {isPrinting ? 'Printing...' : 'Print'}
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
              {invoice.auditLog?.map((log: any, idx: number) => (
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
              {items.map((item: any, idx: number) => (
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