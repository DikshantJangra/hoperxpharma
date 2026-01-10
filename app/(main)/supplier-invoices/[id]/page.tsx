'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supplierInvoiceApi } from '@/lib/api/supplierInvoices';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineCheckCircle, HiOutlineCurrencyRupee } from 'react-icons/hi2';
import React from 'react';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = params.id as string;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        referenceNumber: '',
        notes: ''
    });
    const [recordingPayment, setRecordingPayment] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleConfirmInvoice = async () => {
        if (!confirm('Are you sure you want to confirm this invoice? This action cannot be undone.')) {
            return;
        }

        try {
            setConfirming(true);
            await supplierInvoiceApi.confirmInvoice(invoiceId);
            // Refresh invoice data
            const result = await supplierInvoiceApi.getInvoiceById(invoiceId);
            setInvoice(result.data);
            alert('Invoice confirmed successfully!');
        } catch (error: any) {
            console.error('Error confirming invoice:', error);
            alert(error.message || 'Failed to confirm invoice');
        } finally {
            setConfirming(false);
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Frontend validation
        const amount = parseFloat(paymentData.amount);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid payment amount greater than 0');
            return;
        }
        
        if (amount > remainingAmount) {
            alert(`Payment amount cannot exceed remaining balance of ₹${remainingAmount.toLocaleString('en-IN')}`);
            return;
        }
        
        if (!paymentData.paymentDate) {
            alert('Please select a payment date');
            return;
        }
        
        const paymentDate = new Date(paymentData.paymentDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (paymentDate > today) {
            alert('Payment date cannot be in the future');
            return;
        }
        
        if (!paymentData.paymentMethod) {
            alert('Please select a payment method');
            return;
        }
        
        if (['CHEQUE', 'BANK_TRANSFER', 'UPI'].includes(paymentData.paymentMethod) && !paymentData.referenceNumber.trim()) {
            alert(`Reference number is required for ${paymentData.paymentMethod} payments`);
            return;
        }
        
        try {
            setRecordingPayment(true);
            await supplierInvoiceApi.recordPayment(invoiceId, {
                amount,
                paymentDate: paymentData.paymentDate,
                paymentMethod: paymentData.paymentMethod,
                referenceNumber: paymentData.referenceNumber || undefined,
                notes: paymentData.notes || undefined
            });
            
            // Refresh invoice data
            const result = await supplierInvoiceApi.getInvoiceById(invoiceId);
            setInvoice(result.data);
            setShowPaymentModal(false);
            setPaymentData({
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'CASH',
                referenceNumber: '',
                notes: ''
            });
            alert('Payment recorded successfully!');
        } catch (error: any) {
            console.error('Error recording payment:', error);
            alert(error.message || 'Failed to record payment');
        } finally {
            setRecordingPayment(false);
        }
    };

    const remainingAmount = invoice ? Number(invoice.total) - Number(invoice.paidAmount || 0) : 0;

    // Group items by GRN
    const groupItemsByGRN = (items: any[], grns: any[]) => {
        const grouped: { [key: string]: { grn: any; items: any[] } } = {};
        
        items?.forEach((item: any) => {
            const grnKey = item.grnNumber || 'UNKNOWN';
            if (!grouped[grnKey]) {
                const grnData = grns?.find((g: any) => g.grn?.grnNumber === grnKey);
                grouped[grnKey] = {
                    grn: grnData?.grn || null,
                    items: []
                };
            }
            grouped[grnKey].items.push(item);
        });
        
        return Object.entries(grouped);
    };

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                const result = await supplierInvoiceApi.getInvoiceById(invoiceId);
                setInvoice(result.data);
            } catch (error) {
                console.error('Error fetching invoice:', error);
                alert('Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };

        if (invoiceId) {
            fetchInvoice();
        }
    }, [invoiceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-slate-600">Invoice not found</p>
                    <button
                        onClick={() => router.push('/supplier-invoices')}
                        className="mt-4 text-emerald-600 hover:text-emerald-700"
                    >
                        Back to Invoices
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <style jsx global>{`
            @media print {
                @page { 
                    size: A4; 
                    margin: 15mm; 
                }
                body { 
                    margin: 0; 
                    padding: 0; 
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .print\\:hidden { display: none !important; }
                .print-container { padding: 0; max-width: 100%; }
                .print\\:block { display: block !important; }
                .print\\:shadow-none { box-shadow: none !important; }
                .print\\:border-0 { border: 0 !important; }
                .print\\:p-0 { padding: 0 !important; }
                .print\\:bg-white { background: white !important; }
                .print\\:text-black { color: black !important; }
                table { 
                    page-break-inside: auto;
                    border-collapse: collapse;
                    width: 100%;
                }
                tr { 
                    page-break-inside: avoid; 
                    page-break-after: auto; 
                }
                thead { 
                    display: table-header-group;
                    font-weight: bold;
                }
                tbody tr:nth-child(even) {
                    background-color: #f9fafb !important;
                }
                .bg-slate-50 { background-color: #f9fafb !important; }
                .text-emerald-600 { color: #059669 !important; }
                .border-slate-200 { border-color: #e2e8f0 !important; }
            }
        `}</style>
        <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
            <div className="max-w-5xl mx-auto print-container">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <button
                        onClick={() => router.push('/supplier-invoices')}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <HiOutlineArrowLeft className="h-5 w-5" />
                        Back to Invoices
                    </button>
                    <div className="flex gap-3">
                        <button 
                            onClick={handlePrint}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 print:hidden"
                        >
                            <HiOutlinePrinter className="h-4 w-4" />
                            Print
                        </button>
                        {invoice.status === 'CONFIRMED' && invoice.paymentStatus !== 'PAID' && (
                            <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <HiOutlineCurrencyRupee className="h-4 w-4" />
                                Record Payment
                            </button>
                        )}
                        {invoice.status === 'DRAFT' && (
                            <button 
                                onClick={handleConfirmInvoice}
                                disabled={confirming}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {confirming ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Confirming...
                                    </>
                                ) : (
                                    <>
                                        <HiOutlineCheckCircle className="h-4 w-4" />
                                        Confirm Invoice
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Print Header - Only visible when printing */}
                <div className="hidden print:block mb-6">
                    <div className="border-b-2 border-slate-900 pb-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">HopeRxPharma</h1>
                                <p className="text-sm text-slate-600 mt-1">Pharmacy Management System</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-bold text-slate-900">SUPPLIER INVOICE</h2>
                                <p className="text-sm text-slate-600 mt-1">{invoice.invoiceNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-0 print:p-0">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                {invoice.invoiceNumber}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'DRAFT'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : invoice.status === 'CONFIRMED'
                                        ? 'bg-blue-100 text-blue-700'
                                        : invoice.status === 'PAID'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {invoice.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    invoice.paymentStatus === 'PAID'
                                        ? 'bg-green-100 text-green-700'
                                        : invoice.paymentStatus === 'PARTIAL'
                                            ? 'bg-orange-100 text-orange-700'
                                            : invoice.paymentStatus === 'UNPAID'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {invoice.paymentStatus === 'PARTIAL' ? 'PARTIALLY PAID' : invoice.paymentStatus || 'UNPAID'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-600">Total Amount</div>
                            <div className="text-3xl font-bold text-emerald-600">
                                ₹{Number(invoice.total).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {/* Supplier & Period Info */}
                    <div className="bg-slate-50 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-sm text-slate-600 mb-1">Supplier</div>
                                <div className="font-semibold text-slate-900 text-lg">{invoice.supplier?.name || 'N/A'}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-600 mb-1">Billing Period</div>
                                <div className="font-medium text-slate-900">
                                    {new Date(invoice.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(invoice.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Info Grid */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div>
                            <div className="text-sm text-slate-600 mb-1">Invoice Date</div>
                            <div className="font-medium text-slate-900">
                                {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-IN')}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 mb-1">Created By</div>
                            <div className="font-medium text-slate-900">
                                {invoice.createdByUser ? `${invoice.createdByUser.firstName} ${invoice.createdByUser.lastName}` : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-600 mb-1">Created At</div>
                            <div className="font-medium text-slate-900">
                                {new Date(invoice.createdAt).toLocaleString('en-IN')}
                            </div>
                        </div>
                    </div>

                    {/* Items Table - Grouped by GRN */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Invoice Items
                            </h2>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-slate-600">Total Items: <span className="font-semibold text-slate-900">{invoice.items?.length || 0}</span></span>
                                <span className="text-slate-600">GRNs Included: <span className="font-semibold text-slate-900">{invoice.grns?.length || 0}</span></span>
                            </div>
                        </div>

                        {/* Group items by GRN */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Drug Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Batch & Expiry</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Received</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">Free</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Unit Price</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-slate-600">GST %</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-slate-600">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupItemsByGRN(invoice.items, invoice.grns).map(([grnNumber, group]: [string, any], groupIndex: number) => (
                                        <React.Fragment key={`grn-${grnNumber}-${groupIndex}`}>
                                            {/* GRN Header Row */}
                                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                                                <td colSpan={7} className="px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div>
                                                                <span className="text-sm font-medium text-slate-600">GRN:</span>
                                                                <span className="ml-2 font-semibold text-slate-900">{grnNumber}</span>
                                                            </div>
                                                            {group.grn?.po?.poNumber && (
                                                                <div>
                                                                    <span className="text-sm font-medium text-slate-600">PO:</span>
                                                                    <span className="ml-2 font-semibold text-slate-900">{group.grn.po.poNumber}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {group.grn?.completedAt && (
                                                            <div className="text-sm">
                                                                <span className="text-slate-600">Received:</span>
                                                                <span className="ml-2 font-medium text-slate-900">
                                                                    {new Date(group.grn.completedAt).toLocaleDateString('en-IN', { 
                                                                        day: '2-digit', 
                                                                        month: 'short', 
                                                                        year: 'numeric' 
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Items in this GRN */}
                                            {group.items.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50 border-b border-slate-100">
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-slate-900">{item.drugName}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm text-slate-700">{item.grnItem?.batchNumber || item.batchNumber || 'N/A'}</div>
                                                        {item.grnItem?.expiryDate && (
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                Exp: {new Date(item.grnItem.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="font-semibold text-slate-900">{item.billedQty || item.receivedQty}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.freeQty > 0 ? (
                                                            <span className="text-emerald-600 font-medium">{item.freeQty}</span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-slate-700">₹{Number(item.unitPrice).toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-slate-700">{item.gstPercent}%</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-semibold text-slate-900">₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-80 space-y-3">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-medium">₹{Number(invoice.subtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Tax Amount:</span>
                                <span className="font-medium">₹{Number(invoice.taxAmount).toLocaleString('en-IN')}</span>
                            </div>
                            {Number(invoice.adjustments) !== 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Adjustments:</span>
                                    <span className="font-medium">₹{Number(invoice.adjustments).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                                <span>Total:</span>
                                <span className="text-emerald-600">₹{Number(invoice.total).toLocaleString('en-IN')}</span>
                            </div>
                            {Number(invoice.paidAmount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Paid:</span>
                                    <span className="font-medium">₹{Number(invoice.paidAmount).toLocaleString('en-IN')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-600">
                    <p>This is a computer-generated invoice. For queries, contact your pharmacy administrator.</p>
                    <p className="mt-1">Printed on: {new Date().toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Record Payment</h2>
                        <form onSubmit={handleRecordPayment}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Amount * {paymentData.amount && parseFloat(paymentData.amount) > remainingAmount && <span className="text-red-600">(Exceeds remaining!)</span>}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            paymentData.amount && parseFloat(paymentData.amount) > remainingAmount 
                                                ? 'border-red-500' 
                                                : 'border-slate-300'
                                        }`}
                                        placeholder="Enter amount"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Remaining: ₹{remainingAmount.toLocaleString('en-IN')}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date *</label>
                                    <input
                                        type="date"
                                        required
                                        max={new Date().toISOString().split('T')[0]}
                                        value={paymentData.paymentDate}
                                        onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Cannot be in the future</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                                    <select
                                        required
                                        value={paymentData.paymentMethod}
                                        onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Reference Number {['CHEQUE', 'BANK_TRANSFER', 'UPI'].includes(paymentData.paymentMethod) && <span className="text-red-600">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        required={['CHEQUE', 'BANK_TRANSFER', 'UPI'].includes(paymentData.paymentMethod)}
                                        value={paymentData.referenceNumber}
                                        onChange={(e) => setPaymentData({...paymentData, referenceNumber: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Cheque/Transaction number"
                                    />
                                    {['CHEQUE', 'BANK_TRANSFER', 'UPI'].includes(paymentData.paymentMethod) && (
                                        <p className="text-xs text-red-600 mt-1">Required for {paymentData.paymentMethod}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                    <textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                        placeholder="Additional notes"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={recordingPayment}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={recordingPayment}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {recordingPayment ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Recording...
                                        </>
                                    ) : (
                                        'Record Payment'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
