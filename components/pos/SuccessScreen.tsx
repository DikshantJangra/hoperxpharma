'use client';

import { useEffect, useState } from 'react';
import { FiPrinter, FiMail, FiShoppingCart } from 'react-icons/fi';
import PremiumSuccess from './animations/PremiumSuccess';
import InvoiceEmailModal from './invoices/InvoiceEmailModal';
import { toast } from 'sonner';

export default function SuccessScreen({ saleData, onNewSale, onClose }: any) {
  const [show, setShow] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [invoiceForEmail, setInvoiceForEmail] = useState<any>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Get the actual sale data associated with this success screen
  const sale = saleData;
  const saleId = sale?.saleId || sale?.id; // Sale ID for PDF download
  const invoiceNumber = sale?.invoiceNumber || saleData?.invoiceNo || 'INV-XXXX';
  const total = sale?.total || saleData?.total || 0;
  const paymentMethod = sale?.paymentSplits?.[0]?.paymentMethod || saleData?.method || 'CASH';

  useEffect(() => {
    // Trigger animation start
    const timer = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handlePrintInvoice = async () => {
    if (!saleId) {
      toast.error('Cannot print: Sale ID not available');
      return;
    }

    setIsPrinting(true);
    try {
      const response = await fetch(`/api/v1/sales/${saleId}/invoice/pdf`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open in new tab for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }

      toast.success('Invoice ready for printing');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print invoice');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (!saleId) {
      toast.error('Cannot email: Sale ID not available');
      return;
    }

    setIsLoadingInvoice(true);
    try {
      // Fetch full sale data for email modal
      const response = await fetch(`/api/v1/sales/${saleId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice data');
      }

      const data = await response.json();
      const saleDetails = data.data || data;

      // Transform to invoice format expected by InvoiceEmailModal
      const invoiceData = {
        saleId: saleDetails.id,
        id: saleDetails.invoiceNumber,
        date: new Date(saleDetails.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: new Date(saleDetails.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        status: saleDetails.status,
        type: saleDetails.invoiceType === 'GST_INVOICE' ? 'GST' : 'Regular',
        customer: {
          name: saleDetails.patient ? `${saleDetails.patient.firstName} ${saleDetails.patient.lastName || ''}`.trim() : 'Walk-in Customer',
          phone: saleDetails.patient?.phoneNumber || '-',
          email: saleDetails.patient?.email || '',
          gstin: saleDetails.patient?.gstin,
        },
        items: saleDetails.items?.map((item: any) => ({
          name: item.drug?.name || 'Unknown Item',
          strength: item.drug?.strength || '',
          pack: item.drug?.packSize || '1s',
          batch: item.batch?.batchNumber || '-',
          expiry: item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }) : '-',
          gst: item.gstRate,
          qty: item.quantity,
          price: item.mrp,
          total: item.lineTotal,
        })) || [],
        paymentModes: saleDetails.paymentSplits?.map((split: any) => ({
          mode: split.paymentMethod,
          amount: split.amount,
        })) || [],
        summary: {
          subtotal: saleDetails.subtotal,
          discount: saleDetails.discountAmount,
          gst: saleDetails.taxAmount,
          roundOff: saleDetails.roundOff,
        },
        amount: saleDetails.total,
        hasRx: !!saleDetails.prescriptionId,
        prescriptionId: saleDetails.prescriptionId,
      };

      setInvoiceForEmail(invoiceData);
      setShowEmailModal(true);
    } catch (error) {
      console.error('Error fetching invoice for email:', error);
      toast.error('Failed to load invoice data');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
        <div
          className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${show ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'
            }`}
        >
          <div className="relative mb-6">
            <div className="relative mb-6 flex justify-center">
              <PremiumSuccess />
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
              onClick={handlePrintInvoice}
              disabled={isPrinting}
              className="w-full py-3 bg-[#0ea5a3] text-white rounded-xl font-bold hover:bg-[#0d9391] flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <FiPrinter className="w-4 h-4" />
              {isPrinting ? 'Preparing...' : 'Print Invoice'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleEmailInvoice}
                disabled={isLoadingInvoice}
                className="py-2.5 border border-[#cbd5e1] rounded-xl hover:bg-[#f8fafc] flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 transition-all disabled:opacity-50"
              >
                <FiMail className="w-4 h-4 text-[#0ea5a3]" />
                {isLoadingInvoice ? 'Loading...' : 'Email'}
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

      {/* Email Modal */}
      {showEmailModal && invoiceForEmail && (
        <InvoiceEmailModal
          isOpen={showEmailModal}
          invoice={invoiceForEmail}
          onClose={() => {
            setShowEmailModal(false);
            setInvoiceForEmail(null);
          }}
        />
      )}
    </>
  );
}
