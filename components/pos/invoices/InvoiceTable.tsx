'use client';

import { useState, useEffect } from 'react';
import { FiPrinter, FiMessageSquare, FiRotateCcw, FiFileText } from 'react-icons/fi';
import { BsReceipt } from 'react-icons/bs';

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

export default function InvoiceTable({ searchQuery, onSelectInvoice, selectedInvoice, isLoading }: any) {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
        setInvoices([]);
    }
  }, [isLoading]);

  const filtered = invoices.filter(inv =>
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customer.phone.includes(searchQuery)
  );

  return (
    <div className="h-full overflow-y-auto bg-white">
      <table className="w-full">
        <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Invoice #</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Date & Time</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Customer</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Payment</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
                <TableRowSkeleton/>
            </>
          ) : filtered.length > 0 ? (
            filtered.map((invoice) => (
                <tr
                key={invoice.id}
                onClick={() => onSelectInvoice(invoice)}
                className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] cursor-pointer group ${
                    selectedInvoice?.id === invoice.id ? 'bg-[#f0fdfa]' : ''
                }`}
                >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0f172a]">{invoice.id}</span>
                    <div className="flex gap-1">
                        {invoice.hasRx && (
                        <span className="px-1.5 py-0.5 bg-[#dbeafe] text-[#1e40af] text-xs rounded">Rx</span>
                        )}
                        {invoice.type === 'GST' && (
                        <span className="px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e] text-xs rounded">GST</span>
                        )}
                        {invoice.hasEInvoice && (
                        <span className="px-1.5 py-0.5 bg-[#e9d5ff] text-[#6b21a8] text-xs rounded">E-INV</span>
                        )}
                    </div>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <div className="text-sm text-[#0f172a]">{invoice.date}</div>
                    <div className="text-xs text-[#64748b]">{invoice.time}</div>
                </td>
                <td className="px-4 py-3">
                    <div className="text-sm font-medium text-[#0f172a]">{invoice.customer.name}</div>
                    <div className="text-xs text-[#64748b]">{invoice.customer.phone}</div>
                </td>
                <td className="px-4 py-3">
                    <span className="font-semibold text-[#0f172a]">₹{invoice.amount}</span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                    {invoice.paymentModes.map((mode: string) => (
                        <span key={mode} className="px-2 py-0.5 bg-[#f1f5f9] text-[#64748b] text-xs rounded">
                        {mode}
                        </span>
                    ))}
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'Paid'
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : invoice.status === 'Partial Return'
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : 'bg-[#fee2e2] text-[#991b1b]'
                    }`}
                    >
                    {invoice.status}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-[#f1f5f9] rounded" title="Print">
                        <FiPrinter className="w-4 h-4 text-[#64748b]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#f1f5f9] rounded" title="WhatsApp">
                        <FiMessageSquare className="w-4 h-4 text-[#64748b]" />
                    </button>
                    <button className="p-1.5 hover:bg-[#f1f5f9] rounded" title="Return">
                        <FiRotateCcw className="w-4 h-4 text-[#64748b]" />
                    </button>
                    </div>
                </td>
                </tr>
            ))
          ) : (
            <tr>
                <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center h-64">
                        <BsReceipt className="w-12 h-12 text-[#cbd5e1] mb-3" />
                        <p className="text-[#64748b]">No invoices found</p>
                    </div>
                </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
