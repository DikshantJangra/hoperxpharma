'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiDownload, FiPrinter, FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi';
import { consolidatedInvoicesApi, type ConsolidatedInvoice } from '@/lib/api/consolidatedInvoices';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/pdf/invoicePDF';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;

    const [invoice, setInvoice] = useState<ConsolidatedInvoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const response = await consolidatedInvoicesApi.getInvoiceById(invoiceId);
            if (response.success) {
                setInvoice(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
            toast.error('Failed to load invoice');
            router.push('/orders/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!invoice) return;

        setGenerating(true);
        try {
            await generateInvoicePDF(invoice);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setGenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleFinalize = async () => {
        if (!invoice) return;

        try {
            await consolidatedInvoicesApi.finalizeInvoice(invoice.id);
            toast.success('Invoice finalized');
            fetchInvoice();
        } catch (error: any) {
            toast.error(error.message || 'Failed to finalize invoice');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-gray-500">Loading invoice...</div>
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-gray-100 text-gray-700';
            case 'FINALIZED':
                return 'bg-blue-100 text-blue-700';
            case 'SENT':
                return 'bg-green-100 text-green-700';
            case 'ARCHIVED':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header - No Print */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/orders/invoices')}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Created {new Date(invoice.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {invoice.status === 'DRAFT' && (
                            <button
                                onClick={handleFinalize}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <FiCheck className="w-4 h-4" />
                                Finalize
                            </button>
                        )}
                        <button
                            onClick={handleDownloadPDF}
                            disabled={generating}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FiDownload className="w-4 h-4" />
                            {generating ? 'Generating...' : 'Download PDF'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <FiPrinter className="w-4 h-4" />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Content - Printable */}
            <div className="max-w-4xl mx-auto p-8 print:p-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 print:shadow-none print:border-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                            <p className="text-gray-600 mt-1">{invoice.invoiceNumber}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Date</div>
                            <div className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</div>
                            {invoice.periodStart && invoice.periodEnd && (
                                <div className="text-sm text-gray-600 mt-2">
                                    Period: {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Store and Supplier Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">From</h3>
                            <div className="text-gray-900">
                                <div className="font-bold">{invoice.store?.displayName || invoice.store?.name}</div>
                                <div className="text-sm mt-1">{invoice.store?.addressLine1}</div>
                                {invoice.store?.addressLine2 && <div className="text-sm">{invoice.store?.addressLine2}</div>}
                                <div className="text-sm">{invoice.store?.city}, {invoice.store?.state} {invoice.store?.pinCode}</div>
                                {invoice.store?.gstin && <div className="text-sm mt-1">GSTIN: {invoice.store?.gstin}</div>}
                                {invoice.store?.dlNumber && <div className="text-sm">DL: {invoice.store?.dlNumber}</div>}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">To</h3>
                            <div className="text-gray-900">
                                {invoice.supplier ? (
                                    <>
                                        <div className="font-bold">{invoice.supplier.name}</div>
                                        {invoice.supplier.contactName && <div className="text-sm mt-1">{invoice.supplier.contactName}</div>}
                                        {invoice.supplier.phoneNumber && <div className="text-sm">{invoice.supplier.phoneNumber}</div>}
                                        {invoice.supplier.gstin && <div className="text-sm mt-1">GSTIN: {invoice.supplier.gstin}</div>}
                                    </>
                                ) : (
                                    <div className="font-bold">Multiple Suppliers</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* GRN References */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">GRN References</h3>
                        <div className="flex flex-wrap gap-2">
                            {invoice.grns.map((grnLink) => (
                                <span key={grnLink.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                                    {grnLink.grn.grnNumber} ({new Date(grnLink.grn.receivedDate).toLocaleDateString()})
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-6">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Qty</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rate</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">GST%</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {item.drugName}
                                        {item.batchNumber && <span className="text-gray-500 ml-2">({item.batchNumber})</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.totalQuantity} {item.unit}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(item.gstPercent).toFixed(0)}%</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                        ₹{Number(item.lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64">
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">₹{Number(invoice.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-3 text-lg font-bold border-t border-gray-200">
                                <span>Total:</span>
                                <span className="text-emerald-600">₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Notes</h3>
                            <p className="text-sm text-gray-700">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p>This is a computer-generated invoice</p>
                        <p className="mt-1">Created by {invoice.createdByUser?.firstName} {invoice.createdByUser?.lastName} on {new Date(invoice.createdAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
