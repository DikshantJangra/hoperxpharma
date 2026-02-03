'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiPrinter, FiMail, FiMessageSquare, FiRotateCcw, FiDownload, FiClock, FiCheck, FiLock } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { salesApi } from '@/lib/api/sales';
import { toast } from 'sonner';
import InvoiceEmailModal from './InvoiceEmailModal';
import ReturnForm from '@/components/orders/ReturnForm';
import { useAuthStore } from '@/lib/store/auth-store';

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

export default function InvoiceDrawer({ invoice, onClose, isLoading, startInReturnMode = false }: any) {
  const router = useRouter();
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Return Logic State
  const [showManagerOverride, setShowManagerOverride] = useState(false);
  const [pendingRefundData, setPendingRefundData] = useState<any>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Sync startInReturnMode if invoice changes
  useEffect(() => {
    if (startInReturnMode) {
      setShowReturnModal(true);
    } else {
      setShowReturnModal(false);
    }
  }, [invoice?.id, startInReturnMode]);

  // Fetch audit logs when invoice changes
  useEffect(() => {
    if (invoice?.saleId) {
      fetchAuditLogs();
    }
  }, [invoice?.saleId]);

  const fetchAuditLogs = async () => {
    if (!invoice?.saleId) return;
    try {
      setLoadingAudit(true);
      const response = await salesApi.getSaleById(invoice.saleId);
      const logs = generateAuditLogs(response);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoadingAudit(false);
    }
  };

  const generateAuditLogs = (sale: any) => {
    const logs = [];
    
    // Sale created
    logs.push({
      action: 'Sale Created',
      time: new Date(sale.createdAt).toLocaleString('en-IN', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      }),
      user: 'System',
      details: `Invoice ${sale.invoiceNumber} created`,
      metadata: {
        total: `₹${sale.total}`,
        items: `${sale.items?.length || 0} items`,
        payment: sale.paymentSplits?.map((p: any) => p.paymentMethod).join(', ') || 'CASH'
      }
    });

    // Refunds
    if (sale.refunds && sale.refunds.length > 0) {
      sale.refunds.forEach((refund: any, idx: number) => {
        const refundItems = refund.items || [];
        const itemDetails = refundItems.map((ri: any) => {
          const saleItem = sale.items?.find((si: any) => si.id === ri.saleItemId);
          return `${saleItem?.drug?.name || 'Item'} (${ri.quantity}x)`;
        }).join(', ');
        
        logs.push({
          action: 'Return Processed',
          time: new Date(refund.createdAt).toLocaleString('en-IN', { 
            dateStyle: 'medium', 
            timeStyle: 'short' 
          }),
          user: 'Staff',
          details: `${refund.items?.length || 0} item(s) returned - ₹${refund.refundAmount} refunded`,
          metadata: {
            refundNumber: refund.refundNumber,
            items: itemDetails,
            restocked: refundItems.filter((ri: any) => ri.isResellable).length,
            quarantined: refundItems.filter((ri: any) => !ri.isResellable).length
          }
        });
      });
    }

    return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  };

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

  // --- Return Logic ---
  const handleReturnSubmit = async (returnData: any) => {
    // Get user role from auth store
    const user = useAuthStore.getState().user;
    const userRole = user?.role || 'STAFF';
    
    // Prepare data for API
    const formattedData = {
      items: returnData.items.map((item: any) => ({
        saleItemId: item.saleItemId,
        quantity: item.quantity,
        intent: item.intent,
        condition: item.condition,
        reason: item.reason || 'Customer Return',
      })),
      refundType: returnData.refundType,
      refundAmount: returnData.refundAmount,
      storeId: invoice?.storeId
    };

    // Check if manager approval is needed (only for non-admin users with refunds > 1000)
    if (userRole !== 'ADMIN' && returnData.refundAmount > 1000) {
      setPendingRefundData(formattedData);
      setShowReturnModal(false);
      setShowManagerOverride(true);
      return;
    }

    // Process refund directly for admins or small refunds
    await processRefund(formattedData);
  };

  const processRefund = async (data: any, managerId?: string) => {
    try {
      setIsProcessingReturn(true);
      const payload = managerId ? { ...data, approvedBy: managerId } : data;
      const saleId = invoice?.saleId || invoice?.id;

      await salesApi.initiateRefund(saleId, payload);
      toast.success('Return processed successfully!');
      
      // Close modals
      setShowReturnModal(false);
      setShowManagerOverride(false);
      
      // Close drawer to trigger parent refresh
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process return');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleManagerApprove = (managerId: string) => {
    if (pendingRefundData) {
      processRefund(pendingRefundData, managerId);
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

  // Map items for Return Form with already returned quantities
  const returnFormItems = items.map((item: any) => {
    const returnedQty = invoice.refunds?.reduce((sum: number, refund: any) => {
      const refundItem = refund.items?.find((ri: any) => ri.saleItemId === item.id);
      return sum + (refundItem?.quantity || 0);
    }, 0) || 0;

    return {
      id: item.id || item.saleItemId,
      drug: { name: item.name },
      batch: item.batch || 'N/A',
      quantity: item.qty,
      returnedQty,
      lineTotal: item.total
    };
  });

  // Check if all items are fully returned
  const allItemsReturned = items.every((item: any) => {
    const returnedQty = invoice.refunds?.reduce((sum: number, refund: any) => {
      const refundItem = refund.items?.find((ri: any) => ri.saleItemId === item.id);
      return sum + (refundItem?.quantity || 0);
    }, 0) || 0;
    return returnedQty >= item.qty;
  });

  return (
    <>
      {/* Drawer Container - Fixed width on desktop, full width overlay on mobile */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#e2e8f0] flex flex-col h-full shadow-xl md:shadow-none relative overflow-hidden">
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
              {items.map((item: any, idx: number) => {
                const returnedQty = invoice.refunds?.reduce((sum: number, refund: any) => {
                  const refundItem = refund.items?.find((ri: any) => ri.saleItemId === item.id);
                  return sum + (refundItem?.quantity || 0);
                }, 0) || 0;
                const isFullyReturned = returnedQty >= item.qty;
                const isPartiallyReturned = returnedQty > 0 && returnedQty < item.qty;
                
                // Get refund details for this item
                const refundDetails = invoice.refunds?.flatMap((refund: any) => 
                  refund.items?.filter((ri: any) => ri.saleItemId === item.id) || []
                ) || [];
                const hasResellable = refundDetails.some((rd: any) => rd.isResellable);
                const hasQuarantined = refundDetails.some((rd: any) => !rd.isResellable);

                return (
                  <div key={idx} className={`bg-white border rounded-xl p-3 relative transition-all ${
                    isFullyReturned
                      ? 'border-red-300 bg-red-50/60 opacity-60'
                      : isPartiallyReturned
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-[#e2e8f0]'
                    }`}>
                    {/* Fully Returned Overlay Badge */}
                    {isFullyReturned && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-md z-10">
                        ✓ RETURNED
                      </div>
                    )}
                    {/* Partially Returned Badge */}
                    {isPartiallyReturned && (
                      <div className="absolute top-2 right-2 bg-amber-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-md z-10">
                        Partially Returned ({returnedQty}/{item.qty})
                      </div>
                    )}
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className={`text-sm font-medium leading-tight ${
                            isFullyReturned ? 'text-gray-400 line-through' : 'text-[#0f172a]'
                          }`}>
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
                        <p className={`text-xs mt-1.5 leading-relaxed ${
                          isFullyReturned ? 'text-gray-400' : 'text-[#64748b]'
                        }`}>
                          Batch: {item.batch} • Exp: {item.expiry} • GST: {item.gst}%
                        </p>
                        {item.discount > 0 && (
                          <p className={`text-xs mt-1 font-medium ${
                            isFullyReturned ? 'text-gray-400' : 'text-[#10b981]'
                          }`}>
                            Discount: -₹{item.discount}
                          </p>
                        )}
                        {/* Refund Status Info */}
                        {(isFullyReturned || isPartiallyReturned) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {hasResellable && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded border border-green-200 uppercase tracking-wide">
                                ↻ Restocked
                              </span>
                            )}
                            {hasQuarantined && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded border border-orange-200 uppercase tracking-wide">
                                ⚠ Quarantined
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${
                          isFullyReturned ? 'text-gray-400 line-through' : 'text-[#0f172a]'
                        }`}>₹{item.total}</p>
                        <p className={`text-xs ${
                          isFullyReturned ? 'text-gray-400' : 'text-[#64748b]'
                        }`}>₹{item.price} × {item.qty}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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

          {/* Audit Log Section */}
          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="w-full py-3 px-4 text-sm font-medium text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-[#64748b]" />
                <span>Audit History</span>
              </div>
              <span className={`text-[#64748b] transition-transform ${showAuditLog ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {showAuditLog && (
              <div className="p-4 bg-white max-h-[300px] overflow-y-auto">
                {loadingAudit ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-[#0ea5a3] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map((log: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 pb-3 border-b border-[#f1f5f9] last:border-0">
                        <div className="w-2 h-2 rounded-full bg-[#0ea5a3] mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a]">{log.action}</p>
                          <p className="text-xs text-[#64748b] mt-0.5">{log.details}</p>
                          {log.metadata && (
                            <div className="mt-2 space-y-1">
                              {log.metadata.total && (
                                <p className="text-xs text-[#64748b]">• Amount: {log.metadata.total}</p>
                              )}
                              {log.metadata.items && (
                                <p className="text-xs text-[#64748b]">• Items: {log.metadata.items}</p>
                              )}
                              {log.metadata.payment && (
                                <p className="text-xs text-[#64748b]">• Payment: {log.metadata.payment}</p>
                              )}
                              {log.metadata.refundNumber && (
                                <p className="text-xs text-[#64748b]">• Refund #: {log.metadata.refundNumber}</p>
                              )}
                              {(log.metadata.restocked > 0 || log.metadata.quarantined > 0) && (
                                <p className="text-xs text-[#64748b]">
                                  • Inventory: {log.metadata.restocked > 0 && `${log.metadata.restocked} restocked`}{log.metadata.restocked > 0 && log.metadata.quarantined > 0 && ', '}{log.metadata.quarantined > 0 && `${log.metadata.quarantined} quarantined`}
                                </p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-[#94a3b8] mt-1">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#64748b] text-center py-4">No audit history available</p>
                )}
              </div>
            )}
          </div>
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
              disabled={allItemsReturned}
              className="py-3 px-4 border border-[#ef4444] text-[#ef4444] rounded-xl hover:bg-[#fef2f2] flex items-center justify-center gap-2 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <FiRotateCcw className="w-4 h-4 shrink-0" />
              <span>Return</span>
            </button>
          </div>
        </div>

        {/* Return Overlay (Slides up within sidebar) */}
        {showReturnModal && (
          <ReturnForm
            saleId={invoice.saleId || invoice.id}
            invoiceNumber={invoice.id}
            saleItems={returnFormItems}
            onSubmit={handleReturnSubmit}
            onCancel={() => setShowReturnModal(false)}
            isOverlay={true}
            isProcessing={isProcessingReturn}
            customerName={invoice.customer.name}
          />
        )}
        
        {/* Manager Override Overlay (Full overlay within drawer) */}
        {showManagerOverride && (
          <div className="absolute inset-0 z-[70] bg-white/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
              <button
                onClick={() => {
                  setShowManagerOverride(false);
                  setShowReturnModal(true);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <FiX size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <FiLock className="text-amber-600 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Manager Approval Required</h3>
                <p className="text-sm text-gray-500 mt-1">High Value Refund (Over ₹1000)</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleManagerApprove('user_manager_123');
              }}>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide uppercase">
                    Enter Manager PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    className="w-full text-center text-3xl tracking-[1em] font-bold py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-0 outline-none text-gray-800 placeholder-gray-300 transition-colors"
                    placeholder="••••"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagerOverride(false);
                      setShowReturnModal(true);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Approve
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

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