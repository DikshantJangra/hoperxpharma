'use client';

import { useState, useEffect } from 'react';
import { FiPrinter, FiMessageSquare, FiRotateCcw, FiFileText, FiDownload, FiCornerUpLeft } from 'react-icons/fi';
import { BsReceipt } from 'react-icons/bs';
import { salesApi } from '@/lib/api/sales';

const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
    <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    <td className="px-4 py-3"><div className="h-8 bg-gray-200 rounded-md w-24"></div></td>
  </tr>
)

export default function InvoiceTable({ searchQuery, onSelectInvoice, onInitiateReturn, selectedInvoice, isLoading: parentLoading, filters, onTotalChange }: any) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [printingPdf, setPrintingPdf] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [page, sortBy, sortOrder, filters, refreshTrigger]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await salesApi.getSales({
        page,
        limit,
        sortBy,
        sortOrder,
        ...filters
      });

      const salesData = response.data || response.sales || response;
      const invoicesArray = Array.isArray(salesData) ? salesData : [];
      const totalCount = response.total || invoicesArray.length;

      setInvoices(invoicesArray);
      setTotal(totalCount);
      onTotalChange?.(totalCount);
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent, saleId: string, invoiceNumber: string) => {
    e.stopPropagation();

    try {
      setDownloadingPdf(saleId);
      const blob = await salesApi.downloadInvoicePDF(saleId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download PDF:', error);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handlePrint = async (e: React.MouseEvent, saleId: string, invoiceNumber: string) => {
    e.stopPropagation();
    try {
      setPrintingPdf(saleId);
      const existingIframe = document.getElementById('print-iframe');
      if (existingIframe) document.body.removeChild(existingIframe);

      const blob = await salesApi.downloadInvoicePDF(saleId);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);

      const iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.src = url;

      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    } catch (error: any) {
      console.error('Failed to print PDF:', error);
    } finally {
      setPrintingPdf(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const mapApiToInvoice = (invoice: any) => ({
    saleId: invoice.id,
    id: invoice.invoiceNumber,
    date: formatDate(invoice.createdAt),
    time: formatTime(invoice.createdAt),
    status: invoice.paymentStatus === 'UNPAID' ? 'PENDING' : invoice.paymentStatus === 'PARTIAL' ? 'PARTIAL' : invoice.status,
    paymentStatus: invoice.paymentStatus,
    hasRefunds: invoice.refunds && invoice.refunds.length > 0,
    refunds: invoice.refunds || [],
    totalRefunded: invoice.refunds?.reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0) || 0,
    hasRx: !!invoice.prescriptionId && invoice.prescription?.notes !== 'Quick Sale',
    prescriptionId: invoice.prescriptionId,
    customer: {
      name: invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName || ''}`.trim() : 'Walk-in Customer',
      phone: invoice.patient?.phoneNumber || '-',
      email: invoice.patient?.email || '',
      gstin: invoice.patient?.gstin
    },
    dispenseFor: invoice.dispenseForPatient ? {
      name: `${invoice.dispenseForPatient.firstName} ${invoice.dispenseForPatient.lastName || ''}`.trim(),
      phone: invoice.dispenseForPatient.phoneNumber
    } : null,
    paymentModes: invoice.paymentSplits?.map((split: any) => ({
      mode: split.paymentMethod,
      amount: split.amount
    })) || [],
    items: invoice.items?.map((item: any) => ({
      id: item.id,
      name: item.drug?.name || 'Unknown Item',
      strength: item.drug?.strength || '',
      pack: item.drug?.packSize || '1s',
      batch: item.batch?.batchNumber || (item.batchId ? item.batchId.slice(-6).toUpperCase() : '-'),
      expiry: item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }).replace('/', '/20').slice(0, 5) : '-',
      gst: item.gstRate,
      qty: item.quantity,
      mrp: item.mrp, // Preserve original MRP for refund capping
      price: item.mrp,
      discount: item.discountAmount || 0,
      total: item.lineTotal,
      isRx: item.drug?.requiresPrescription
    })) || [],
    amount: Number(invoice.total || 0),
    roundedAmount: Math.round(Number(invoice.total || 0)),
    createdAt: invoice.createdAt,
    summary: {
      subtotal: Number(invoice.subtotal || 0),
      discount: Number(invoice.discountAmount || 0),
      gst: Number(invoice.taxAmount || 0),
      roundOff: Number(invoice.roundOff || 0)
    },
    attachments: invoice.attachments || [],
    auditLog: []
  });

  const filtered = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.patient?.phoneNumber?.includes(searchQuery)
  );

  const loading = isLoading || parentLoading;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Invoice #</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Date & Time</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Discount</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Payment</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </>
          ) : filtered.length > 0 ? (
            filtered.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => onSelectInvoice(mapApiToInvoice(invoice))}
                className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${selectedInvoice?.id === invoice.invoiceNumber ? 'bg-[#f0fdfa]' : ''}`}
              >
                <td className="px-4 py-3">
                  <span className="font-semibold text-[#0f172a]">{invoice.invoiceNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-[#0f172a]">{formatDate(invoice.createdAt)}</div>
                  <div className="text-xs text-[#64748b]">{formatTime(invoice.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[#0f172a]">
                    {invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'Walk-in Customer'}
                  </div>
                  <div className="text-xs text-[#64748b]">{invoice.patient?.phoneNumber || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-[#10b981]">{invoice.discountAmount > 0 ? `-₹${Number(invoice.discountAmount).toFixed(2)}` : '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm text-[#0f172a]">₹{Math.round(Number(invoice.total || 0)).toLocaleString('en-IN')}</div>
                  {/* Inline Refund Indicator */}
                  {invoice.refunds && invoice.refunds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <FiCornerUpLeft className="w-2.5 h-2.5 text-red-500" />
                      <span className="text-[10px] font-bold text-red-600">
                        -₹{(invoice.refunds.reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {invoice.paymentSplits?.map((split: any, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] text-xs rounded">
                        {split.paymentMethod}
                      </span>
                    )) || <span className="px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] text-xs rounded">CASH</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${invoice.status === 'REFUNDED'
                    ? 'bg-red-100 text-red-700'
                    : invoice.status === 'PARTIALLY_REFUNDED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                    }`}>
                    {invoice.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDownloadPDF(e, invoice.id, invoice.invoiceNumber)}
                      className="p-1.5 hover:bg-[#f1f5f9] rounded text-[#64748b] hover:text-[#0ea5a3] transition-colors disabled:opacity-50"
                      title="Download PDF"
                      disabled={downloadingPdf === invoice.id}
                    >
                      {downloadingPdf === invoice.id ? <div className="w-4 h-4 border-2 border-[#0ea5a3] border-t-transparent rounded-full animate-spin"></div> : <FiDownload className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handlePrint(e, invoice.id, invoice.invoiceNumber)}
                      className="p-1.5 hover:bg-[#f1f5f9] rounded text-[#64748b] hover:text-[#0ea5a3] transition-colors"
                      title="Print Invoice"
                      disabled={printingPdf === invoice.id}
                    >
                      {printingPdf === invoice.id ? <div className="w-4 h-4 border-2 border-[#0ea5a3] border-t-transparent rounded-full animate-spin"></div> : <FiPrinter className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const allItemsReturned = invoice.items?.every((item: any) => {
                          const returnedQty = invoice.refunds?.reduce((sum: number, refund: any) => {
                            const refundItem = refund.items?.find((ri: any) => ri.saleItemId === item.id);
                            return sum + (refundItem?.quantity || 0);
                          }, 0) || 0;
                          return returnedQty >= item.quantity;
                        });
                        if (!allItemsReturned) {
                          onInitiateReturn(mapApiToInvoice(invoice));
                        }
                      }}
                      disabled={invoice.items?.every((item: any) => {
                        const returnedQty = invoice.refunds?.reduce((sum: number, refund: any) => {
                          const refundItem = refund.items?.find((ri: any) => ri.saleItemId === item.id);
                          return sum + (refundItem?.quantity || 0);
                        }, 0) || 0;
                        return returnedQty >= item.quantity;
                      })}
                      className="p-1.5 hover:bg-[#fef2f2] rounded text-[#64748b] hover:text-[#ef4444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      title="Initiate Return"
                    >
                      <FiRotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">No invoices found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {!loading && total > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-[#64748b]">
            Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} invoices
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm">Page {page} of {Math.ceil(total / limit)}</span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(total / limit), p + 1))}
              disabled={page >= Math.ceil(total / limit)}
              className="px-3 py-1.5 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
