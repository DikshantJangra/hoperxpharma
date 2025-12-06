"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineDownload, HiOutlineMail } from 'react-icons/hi';
import { FiPackage } from 'react-icons/fi';

interface OrderItem {
    id: string;
    drug: {
        name: string;
        strength: string;
        type: string;
    };
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    gstPercent: number;
    total: number;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    status: string;
    createdAt: string;
    expectedDeliveryDate?: string;
    supplier: {
        name: string;
        email: string;
        phone: string;
        address: string;
        gstin: string;
    };
    items: OrderItem[];
    subtotal: number;
    taxAmount: number;
    total: number;
    notes?: string;
}

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<PurchaseOrder | null>(null);
    const [grns, setGrns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchOrderDetails(params.id as string);
        }
    }, [params.id]);

    const fetchOrderDetails = async (id: string) => {
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const token = localStorage.getItem('accessToken');

            // Fetch PO details
            const response = await fetch(`${apiBaseUrl}/purchase-orders/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const data = await response.json();
            setOrder(data.data);

            // Fetch GRN data if order is received or partially received
            if (data.data.status === 'RECEIVED' || data.data.status === 'PARTIALLY_RECEIVED') {
                const grnResponse = await fetch(`${apiBaseUrl}/grn/po/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (grnResponse.ok) {
                    const grnData = await grnResponse.json();
                    setGrns(grnData.data || []);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load order');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const getStatusBadge = (status: string) => {
        const statusConfig: any = {
            DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
            PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
            APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
            SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Sent' },
            PARTIALLY_RECEIVED: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partial' },
            RECEIVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Received' },
            CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
        };
        const config = statusConfig[status] || statusConfig.DRAFT;
        return (
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-600 mb-4">{error || 'Order not found'}</div>
                <Link href="/orders" className="text-blue-600 hover:underline">
                    Back to Orders
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <HiOutlineArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order {order.poNumber}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>Created on {formatDate(order.createdAt)}</span>
                            <span>•</span>
                            {getStatusBadge(order.status)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Action Buttons */}
                    {order.status === 'DRAFT' && (
                        <Link
                            href={`/orders/new-po?id=${order.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Edit Draft
                        </Link>
                    )}
                    {(order.status === 'SENT' || order.status === 'PARTIALLY_RECEIVED') && (
                        <Link
                            href={`/orders/pending/${order.id}/receive`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            <FiPackage className="h-5 w-5" />
                            Receive Shipment
                        </Link>
                    )}
                    <button className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <HiOutlinePrinter className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all">
                        <HiOutlineDownload className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.drug.name}</div>
                                                <div className="text-sm text-gray-500">{item.drug.strength} • {item.drug.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                {formatCurrency(
                                                    item.total ||
                                                    (item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100) * (1 + (item.gstPercent || 0) / 100))
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Notes</h3>
                            <p className="text-gray-600 text-sm">{order.notes}</p>
                        </div>
                    )}

                    {/* Attachments */}
                    {(order as any).attachments && (order as any).attachments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">PO Attachments</h3>
                            <div className="space-y-2">
                                {(order as any).attachments.map((attachment: any) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    {attachment.fileName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {(attachment.compressedSize / 1024).toFixed(0)} KB
                                                    {attachment.compressedSize < attachment.originalSize && (
                                                        <span className="text-green-600 ml-2">
                                                            (saved {Math.round((1 - attachment.compressedSize / attachment.originalSize) * 100)}%)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GRN Invoice Attachments */}
                    {grns.length > 0 && grns.some((grn: any) => grn.attachments && grn.attachments.length > 0) && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Attachments</h3>
                            {grns.map((grn: any) => (
                                grn.attachments && grn.attachments.length > 0 && (
                                    <div key={grn.id} className="mb-4 last:mb-0">
                                        <div className="text-xs text-gray-500 mb-2">GRN: {grn.grnNumber}</div>
                                        <div className="space-y-2">
                                            {grn.attachments.map((attachment: any) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {attachment.fileName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {(attachment.compressedSize / 1024).toFixed(0)} KB
                                                                {attachment.compressedSize < attachment.originalSize && (
                                                                    <span className="text-green-600 ml-2">
                                                                        (saved {Math.round((1 - attachment.compressedSize / attachment.originalSize) * 100)}%)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Supplier & Summary */}
                <div className="space-y-6">
                    {/* Supplier Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Details</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-900">{order.supplier.name}</div>
                                <div className="text-sm text-gray-500">{order.supplier.address}</div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <HiOutlineMail className="h-4 w-4" />
                                    {order.supplier.email}
                                </div>
                                <div className="text-sm text-gray-600 pl-6">
                                    {order.supplier.phone}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">GSTIN</div>
                                <div className="text-sm font-medium text-gray-900">{order.supplier.gstin || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tax (GST)</span>
                                <span>{formatCurrency(order.taxAmount)}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="text-xl font-bold text-emerald-600">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
