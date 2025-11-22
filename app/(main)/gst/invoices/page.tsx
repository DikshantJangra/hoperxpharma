"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiSearch, FiFilter, FiDownload, FiEye, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

interface GSTInvoice {
    id: string;
    invoiceNumber: string;
    date: string;
    customerName: string;
    gstin?: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
    type: "B2B" | "B2C" | "Export";
    irnStatus: "Generated" | "Pending" | "Failed" | "N/A";
}

const InvoiceRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-24"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-md w-16"></div></td>
    </tr>
)

export default function GSTInvoiceList() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<"all" | "B2B" | "B2C" | "Export">("all");
    const [filterIRN, setFilterIRN] = useState<"all" | "Generated" | "Pending" | "Failed">("all");
    const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setInvoices([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [filterType, filterIRN]);

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.gstin?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesType = filterType === "all" || invoice.type === filterType;
        const matchesIRN = filterIRN === "all" || invoice.irnStatus === filterIRN;

        return matchesSearch && matchesType && matchesIRN;
    });

    const getIRNBadge = (status: string) => {
        switch (status) {
            case "Generated":
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded flex items-center gap-1">
                    <FiCheckCircle className="h-3 w-3" /> IRN Generated
                </span>;
            case "Pending":
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1">
                    <FiClock className="h-3 w-3" /> IRN Pending
                </span>;
            case "Failed":
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1">
                    <FiXCircle className="h-3 w-3" /> IRN Failed
                </span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">N/A</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">GST Invoices</h1>
                            <p className="text-sm text-gray-500">View and manage all GST-compliant invoices</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                                <FiDownload className="h-4 w-4" />
                                Export CSV
                            </button>
                            <Link
                                href="/gst/invoices/new"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                + New Invoice
                            </Link>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by invoice number, customer name, or GSTIN..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoading}
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="all">All Types</option>
                            <option value="B2B">B2B</option>
                            <option value="B2C">B2C</option>
                            <option value="Export">Export</option>
                        </select>
                        <select
                            value={filterIRN}
                            onChange={(e) => setFilterIRN(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        >
                            <option value="all">All IRN Status</option>
                            <option value="Generated">Generated</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Taxable Value
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Tax Amount
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    IRN Status
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <>
                                    <InvoiceRowSkeleton/>
                                    <InvoiceRowSkeleton/>
                                    <InvoiceRowSkeleton/>
                                </>
                            ) : filteredInvoices.length > 0 ? (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(invoice.date).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{invoice.customerName}</div>
                                            {invoice.gstin && (
                                                <div className="text-xs text-gray-500 font-mono">{invoice.gstin}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${invoice.type === "B2B" ? "bg-blue-100 text-blue-700" :
                                                    invoice.type === "B2C" ? "bg-green-100 text-green-700" :
                                                        "bg-purple-100 text-purple-700"
                                                }`}>
                                                {invoice.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            ₹{invoice.taxableValue.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                            ₹{(invoice.cgst + invoice.sgst + invoice.igst).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                                            ₹{invoice.totalAmount.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getIRNBadge(invoice.irnStatus)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <FiEye className="h-4 w-4" />
                                                </button>
                                                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <FiDownload className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center py-8 text-gray-500">No invoices found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
