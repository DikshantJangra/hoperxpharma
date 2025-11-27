import React from 'react';
import { PurchaseOrder } from '@/types/po';
import { HiOutlinePrinter, HiOutlineXMark } from 'react-icons/hi2';

interface POPrintViewProps {
    po: PurchaseOrder;
    onClose: () => void;
}

export default function POPrintView({ po, onClose }: POPrintViewProps) {
    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount: number | string) => `₹${Number(amount || 0).toFixed(2)}`;
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
            {/* No-print controls */}
            <div className="print:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Print Purchase Order</h2>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                        <HiOutlinePrinter size={16} />
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="max-w-[210mm] mx-auto p-8 print:p-0 print:max-w-none bg-white min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">PURCHASE ORDER</h1>
                        <div className="mt-2 text-gray-600">
                            <p>PO Number: <span className="font-medium text-gray-900">{po.poId || 'DRAFT'}</span></p>
                            <p>Date: <span className="font-medium text-gray-900">{formatDate(new Date().toISOString())}</span></p>
                            <p>Expected Delivery: <span className="font-medium text-gray-900">{formatDate(po.expectedDeliveryDate)}</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-600 mb-1">{po.store?.displayName || 'HopeRx Pharma'}</div>
                        <p className="text-sm text-gray-600">{po.store?.addressLine1 || po.deliveryAddress?.line1 || ''}</p>
                        <p className="text-sm text-gray-600">
                            {po.store?.city || po.deliveryAddress?.city}, {po.store?.state} {po.store?.pinCode || po.deliveryAddress?.pin}
                        </p>
                        {po.store?.licenses?.find(l => l.type === 'GSTIN') && (
                            <p className="text-sm text-gray-600">GSTIN: {po.store.licenses.find(l => l.type === 'GSTIN')?.number}</p>
                        )}
                        {po.store?.email && <p className="text-sm text-gray-600">{po.store.email}</p>}
                    </div>
                </div>

                {/* Supplier & Delivery Details */}
                <div className="grid grid-cols-2 gap-12 mb-8">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vendor</h3>
                        {po.supplier ? (
                            <div className="text-sm text-gray-900">
                                <p className="font-bold text-lg mb-1">{po.supplier.name}</p>
                                {po.supplier.gstin && <p>GSTIN: {po.supplier.gstin}</p>}
                                {po.supplier.contact.email && <p>{po.supplier.contact.email}</p>}
                                {po.supplier.contact.phone && <p>{po.supplier.contact.phone}</p>}
                                {/* Address would go here if available in supplier object */}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No supplier selected</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ship To</h3>
                        <div className="text-sm text-gray-900">
                            <p className="font-bold text-lg mb-1">Hoperx Pharma - Main Store</p>
                            <p>{po.deliveryAddress?.line1 || '123 Pharmacy Street'}</p>
                            <p>{po.deliveryAddress?.city || 'Health City'} - {po.deliveryAddress?.pin || '560001'}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-gray-800">
                            <th className="py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Item / Description</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Qty</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Unit Price</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Discount</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">GST</th>
                            <th className="py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {po.lines.map((line, index) => (
                            <tr key={line.lineId || index}>
                                <td className="py-3 text-sm text-gray-900">
                                    <p className="font-medium">{line.description}</p>
                                    <p className="text-xs text-gray-500">Pack: {line.packSize} {line.packUnit}</p>
                                </td>
                                <td className="py-3 text-right text-sm text-gray-900">{line.qty}</td>
                                <td className="py-3 text-right text-sm text-gray-900">{formatCurrency(line.pricePerUnit)}</td>
                                <td className="py-3 text-right text-sm text-gray-900">{line.discountPercent}%</td>
                                <td className="py-3 text-right text-sm text-gray-900">{line.gstPercent}%</td>
                                <td className="py-3 text-right text-sm font-medium text-gray-900">{formatCurrency(line.lineNet)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatCurrency(po.subtotal)}</span>
                        </div>
                        {po.taxBreakdown.map((tax) => (
                            <div key={tax.gstPercent} className="flex justify-between text-sm text-gray-600">
                                <span>GST {tax.gstPercent}%</span>
                                <span>{formatCurrency(tax.tax)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-3">
                            <span>Total</span>
                            <span>{formatCurrency(po.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Terms & Notes */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                            <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                                <li>Payment Terms: {po.paymentTerms || 'Net 30 Days'}</li>
                                <li>Goods must be delivered within the expected delivery date.</li>
                                <li>Please include PO number on all invoices and packages.</li>
                            </ul>
                        </div>
                        {po.notes && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                                <p className="text-xs text-gray-600">{po.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                    <p>This is a computer generated document and does not require signature.</p>
                </div>
            </div>
        </div>
    );
}
