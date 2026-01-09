import React, { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { PurchaseOrder } from '@/types/po';
import { HiOutlineDocumentText, HiOutlinePrinter, HiOutlinePaperAirplane, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import POPrintView from './POPrintView';

interface POSummaryProps {
  po: PurchaseOrder;
}

export default function POSummary({ po }: POSummaryProps) {
  const [showPrintView, setShowPrintView] = useState(false);

  const formatCurrency = (amount: number | string) => `₹${Number(amount || 0).toFixed(2)}`;

  const needsApproval = po.total > (po.approvalThreshold || 50000);

  const handlePreviewPdf = async () => {
    try {
      // Use poId or fallback to casting for 'id' if it exists at runtime
      const poId = po.poId || (po as any).id;
      if (!poId) {
        toast.error('Cannot generate PDF for unsaved PO');
        return;
      }

      // Download directly as blob
      const blob = await apiClient.get(`/purchase-orders/${poId}/preview.pdf`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(blob as Blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF preview');
    }
  };

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const handleWhatsAppClick = () => {
    toast('WhatsApp integration coming soon!', {
      icon: <HiOutlineChatBubbleLeftRight className="text-emerald-500 h-5 w-5" />,
      style: {
        borderRadius: '10px',
        background: '#fff',
        color: '#333',
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(po.subtotal)}</span>
            </div>
            {po.taxBreakdown.map((tax, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>GST ({tax.gstPercent}%)</span>
                <span>{formatCurrency(tax.tax)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex justify-between font-semibold text-gray-900 text-base">
              <span>Total</span>
              <span>{formatCurrency(po.total)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleWhatsAppClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
              Send via WhatsApp
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePreviewPdf}
                className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <HiOutlineDocumentText className="h-4 w-4" />
                Preview PDF
              </button>
              <button
                onClick={handlePrint}
                className="col-span-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <HiOutlinePrinter className="h-4 w-4" />
                Print PO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      {po.supplier && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Supplier Details</h3>
          </div>
          <div className="p-4 space-y-2">
            <div>
              <div className="text-sm font-medium text-gray-900">{po.supplier.name}</div>
              {po.supplier.gstin && (
                <div className="text-xs text-gray-500">GSTIN: {po.supplier.gstin}</div>
              )}
            </div>

            {po.supplier.contact.email && (
              <div className="text-xs text-gray-600">
                Email: {po.supplier.contact.email}
              </div>
            )}

            {po.supplier.contact.phone && (
              <div className="text-xs text-gray-600">
                Phone: {po.supplier.contact.phone}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Lead time: {po.supplier.defaultLeadTimeDays} days
            </div>

            {po.paymentTerms && (
              <div className="text-xs text-gray-500">
                Payment: {po.paymentTerms}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delivery Info */}
      {po.expectedDeliveryDate && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Delivery</h3>
          </div>
          <div className="p-4">
            <div className="text-sm text-gray-600">Expected Date</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(po.expectedDeliveryDate).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => setShowPrintView(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
          >
            <HiOutlineDocumentText className="h-4 w-4" />
            Preview PDF
          </button>
          <button
            onClick={() => setShowPrintView(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
          >
            <HiOutlinePrinter className="h-4 w-4" />
            Print PO
          </button>
          <button
            onClick={handleWhatsAppClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
            Send via WhatsApp
          </button>
        </div>
      </div>

      {/* Status */}
      {po.status !== 'draft' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-800">Status</h3>
          </div>
          <div className="p-4">
            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${po.status === 'sent' ? 'bg-green-100 text-green-800' :
              po.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                po.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
              }`}>
              {po.status.replace('_', ' ').toUpperCase()}
            </div>

            {po.poId && (
              <div className="text-xs text-gray-500 mt-2">
                PO ID: {po.poId}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && (
        <POPrintView po={po} onClose={() => setShowPrintView(false)} />
      )}
    </div>
  );
}