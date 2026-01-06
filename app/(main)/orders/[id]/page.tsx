"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HiOutlineArrowLeft, HiOutlinePrinter, HiOutlineDownload, HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineIdentification, HiOutlineDocumentText, HiOutlineExclamationCircle } from 'react-icons/hi';
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

            // Fetch PO details
            const response = await fetch(`${apiBaseUrl}/purchase-orders/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }

            const data = await response.json();

            // Transform supplier data to match frontend expectations
            if (data.data && data.data.supplier) {
                data.data.supplier.phone = data.data.supplier.phoneNumber || '';
                data.data.supplier.address = [
                    data.data.supplier.addressLine1,
                    data.data.supplier.addressLine2,
                    data.data.supplier.city,
                    data.data.supplier.state,
                    data.data.supplier.pinCode
                ].filter(Boolean).join(', ');
            }

            setOrder(data.data);

            // Fetch GRN data if order is received or partially received
            if (data.data.status === 'RECEIVED' || data.data.status === 'PARTIALLY_RECEIVED') {
                const grnResponse = await fetch(`${apiBaseUrl}/grn/po/${id}`, {
                    credentials: 'include'
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

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* 1. Full Width Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {(order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') && grns.length > 0
                                ? 'Received Items'
                                : 'Order Items'}
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Details</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">MRP</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>

                                    {/* Discount Column */}
                                    {(order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') && grns.length > 0 && (
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                                    )}

                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax (GST)</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {(order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') && grns.length > 0 ? (
                                    // Show GRN items for received orders
                                    grns.flatMap((grn: any) => {
                                        // Identify parent and standalone items
                                        // Parents have isSplit=true or have children array
                                        const parentItems = grn.items.filter((item: any) =>
                                            item.isSplit || (item.children && item.children.length > 0)
                                        );

                                        // Standalone items are not split, have no children, and don't have TBD batch
                                        const standaloneItems = grn.items.filter((item: any) =>
                                            !item.isSplit &&
                                            (!item.children || item.children.length === 0) &&
                                            item.batchNumber !== 'TBD'  // Filter out TBD items
                                        );

                                        // Helper to format expiry as MM/YYYY
                                        const formatExpiry = (dateString: string) => {
                                            if (!dateString) return '';
                                            const date = new Date(dateString);
                                            const month = String(date.getMonth() + 1).padStart(2, '0');
                                            const year = date.getFullYear();
                                            return `${month}/${year}`;
                                        };

                                        // Function to render a row
                                        const renderRow = (item: any, isChild = false, parentItem: any = null) => {
                                            // Fallback drug name from:
                                            // 1. Item itself
                                            // 2. Parent Item (if child)
                                            // 3. Original PO Item (match by drugId)
                                            let drugName = item.drug?.name;
                                            let drugStrength = item.drug?.strength;
                                            let drugType = item.drug?.type;

                                            if (!drugName && isChild && parentItem) {
                                                drugName = parentItem.drug?.name;
                                                drugStrength = parentItem.drug?.strength;
                                                drugType = parentItem.drug?.type;
                                            }

                                            // Final fallback: Look in order items
                                            if (!drugName) {
                                                const poItem = order.items.find((poi: any) => poi.drugId === item.drugId);
                                                if (poItem && poItem.drug) {
                                                    drugName = poItem.drug.name;
                                                    drugStrength = poItem.drug.strength;
                                                    drugType = poItem.drug.type;
                                                }
                                            }

                                            drugName = drugName || 'Unknown Item';
                                            drugStrength = drugStrength || '';
                                            drugType = drugType || '';

                                            return (
                                                <tr key={item.id} className={`hover:bg-gray-50 ${isChild ? 'bg-gray-50/50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <div className={`font-medium ${isChild ? 'pl-6 text-gray-700' : 'text-gray-900'}`}>
                                                            {isChild && <span className="text-gray-400 mr-2">↳</span>}
                                                            {drugName}
                                                            {item.isSplit && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Split Batches</span>}
                                                        </div>
                                                        <div className={`text-sm text-gray-500 ${isChild ? 'pl-6' : ''}`}>{drugStrength} {drugStrength && drugType ? '•' : ''} {drugType}</div>
                                                        {(item.batchNumber || item.expiryDate) && !item.isSplit && (
                                                            <div className={`text-xs text-gray-400 mt-1 flex gap-2 ${isChild ? 'pl-6' : ''}`}>
                                                                {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
                                                                {item.expiryDate && <span>Exp: {formatExpiry(item.expiryDate)}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                        {item.isSplit ? (
                                                            // For split items, calculate total from children
                                                            <div>
                                                                {(item.children || []).reduce((sum: number, child: any) => sum + (Number(child.receivedQty) || 0), 0)} Rec
                                                            </div>
                                                        ) : (
                                                            <div>{item.receivedQty} Rec</div>
                                                        )}

                                                        {item.freeQty > 0 && <div className="text-xs text-green-600">+{item.freeQty} Free</div>}
                                                        {item.isSplit && <div className="text-xs text-gray-400 italic mt-1">{item.children?.length || 0} batches</div>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                        {item.mrp ? formatCurrency(item.mrp) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>

                                                    {/* Discount Cell */}
                                                    <td className="px-6 py-4 text-right text-sm">
                                                        {item.isSplit ? (
                                                            <span className="text-gray-400">-</span>
                                                        ) : (
                                                            item.discountPercent > 0 ? (
                                                                <div>
                                                                    <div className="text-emerald-600 font-medium">
                                                                        {item.discountPercent}%
                                                                        <span className="text-gray-400 text-xs ml-1">
                                                                            ({item.discountType === 'AFTER_GST' ? 'Post' : 'Pre'})
                                                                        </span>
                                                                    </div>
                                                                    {/* Calculate discount amount for display utility */}
                                                                    <div className="text-xs text-gray-500">
                                                                        {(() => {
                                                                            const qty = item.receivedQty || 0;
                                                                            const rate = item.unitPrice || 0;
                                                                            const gross = qty * rate;
                                                                            let discAmt = 0;
                                                                            if (item.discountType === 'AFTER_GST') {
                                                                                // Approx logic for display
                                                                                const tax = gross * ((item.gstPercent || 0) / 100);
                                                                                discAmt = (gross + tax) * (item.discountPercent / 100);
                                                                            } else {
                                                                                discAmt = gross * (item.discountPercent / 100);
                                                                            }
                                                                            return `-${formatCurrency(discAmt)}`;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                        {item.isSplit ? (
                                                            <span className="text-gray-400">-</span>
                                                        ) : (
                                                            <span>{item.gstPercent || 0}%</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                        {item.isSplit ? (
                                                            <span className="text-gray-400">-</span>
                                                        ) : (
                                                            formatCurrency(item.lineTotal || item.total)
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        };

                                        // Function to render split batch header
                                        const renderSplitHeader = (parent: any, children: any[]) => {
                                            let drugName = parent.drug?.name;
                                            let drugStrength = parent.drug?.strength;
                                            let drugType = parent.drug?.type;

                                            if (!drugName) {
                                                const poItem = order.items.find((poi: any) => poi.drugId === parent.drugId);
                                                if (poItem && poItem.drug) {
                                                    drugName = poItem.drug.name;
                                                    drugStrength = poItem.drug.strength;
                                                    drugType = poItem.drug.type;
                                                }
                                            }

                                            drugName = drugName || 'Unknown Item';
                                            const totalRecQty = children.reduce((sum: number, child: any) => sum + (Number(child.receivedQty) || 0), 0);
                                            const totalFreeQty = children.reduce((sum: number, child: any) => sum + (Number(child.freeQty) || 0), 0);

                                            return (
                                                <tr key={`header-${parent.id}`} className="bg-gray-50/80">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">
                                                            {drugName}
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">Split Batches</span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">{drugStrength} {drugStrength && drugType ? '•' : ''} {drugType}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                        <div>{totalRecQty} Rec</div>
                                                        {totalFreeQty > 0 && <div className="text-xs text-green-600">+{totalFreeQty} Free</div>}
                                                        <div className="text-xs text-gray-400 italic mt-1">{children.length} batches</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-400">-</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-400">-</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-400">-</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-400">-</td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-400">-</td>
                                                </tr>
                                            );
                                        };

                                        return [
                                            // Render Standalone Items
                                            ...standaloneItems.map((item: any) => renderRow(item)),
                                            // Render Parent Items with Children
                                            ...parentItems.flatMap((parent: any) => {
                                                const children = parent.children || [];
                                                return [
                                                    renderSplitHeader(parent, children),
                                                    ...children.map((child: any) => renderRow(child, true, parent))
                                                ];
                                            })
                                        ];
                                    })
                                ) : (
                                    // PO Items (Before Receiving)
                                    order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{item.drug.name}</div>
                                                <div className="text-sm text-gray-500">{item.drug.strength} • {item.drug.type}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">-</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">{item.gstPercent || 0}%</td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                                                {formatCurrency(
                                                    item.total ||
                                                    (item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100) * (1 + (item.gstPercent || 0) / 100))
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Bottom Grid Section: Supplier Info + Financial Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Left Column: Supplier & Invoice Info */}
                    <div className="space-y-6">
                        {/* Supplier Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Supplier Details</h3>
                            <div className="space-y-3">
                                <div className="font-medium text-lg text-gray-900">{order.supplier.name}</div>
                                <div className="space-y-2 text-sm text-gray-600 mt-2">
                                    <div className="flex items-start gap-2">
                                        <HiOutlineLocationMarker className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <span>{order.supplier.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HiOutlineMail className="h-5 w-5 text-gray-400" />
                                        <span>{order.supplier.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HiOutlinePhone className="h-5 w-5 text-gray-400" />
                                        <span>{order.supplier.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <HiOutlineIdentification className="h-5 w-5 text-gray-400" />
                                        <span>GSTIN: <span className="font-medium text-gray-900">{order.supplier.gstin}</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice & Attachments Card */}
                        {(grns && grns.length > 0) && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Invoice Info</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {grns[0]?.supplierInvoiceNo && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Invoice Number</p>
                                                <p className="font-medium text-gray-900 text-lg">{grns[0].supplierInvoiceNo}</p>
                                            </div>
                                        )}
                                        {grns[0]?.supplierInvoiceDate && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase">Invoice Date</p>
                                                <p className="font-medium text-gray-900">{formatDate(grns[0].supplierInvoiceDate)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Level Notes */}
                                    {order.notes && (
                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                            <p className="text-xs text-gray-500 uppercase mb-1">PO Notes</p>
                                            <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded border border-yellow-100">{order.notes}</p>
                                        </div>
                                    )}
                                    {/* GRN Level Notes */}
                                    {grns[0]?.notes && (
                                        <div className="pt-2 border-t border-gray-100 mt-2">
                                            <p className="text-xs text-gray-500 uppercase mb-1">Received Notes</p>
                                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">{grns[0].notes}</p>
                                        </div>
                                    )}

                                    {/* Attachments Section (Merged as requested) */}
                                    {(order as any).attachments && (order as any).attachments.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 mt-4">
                                            <p className="text-xs text-gray-500 uppercase mb-2">Order Attachments</p>
                                            <div className="space-y-2">
                                                {(order as any).attachments.map((attachment: any) => (
                                                    <div
                                                        key={attachment.id}
                                                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className="p-1 bg-white rounded border border-gray-200">
                                                                <HiOutlineDocumentText className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                                    {attachment.fileName}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {(attachment.compressedSize / 1024).toFixed(0)} KB
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Download"
                                                        >
                                                            <HiOutlineDownload className="h-4 w-4" />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* GRN Invoice Attachments */}
                                    {grns.length > 0 && grns.some((grn: any) => grn.attachments && grn.attachments.length > 0) && (
                                        <div className="pt-4 border-t border-gray-100 mt-4">
                                            <p className="text-xs text-gray-500 uppercase mb-2">Invoice Attachments</p>
                                            <div className="space-y-2">
                                                {grns.map((grn: any) =>
                                                    grn.attachments && grn.attachments.map((attachment: any) => (
                                                        <div
                                                            key={attachment.id}
                                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
                                                        >
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <div className="p-1 bg-white rounded border border-gray-200">
                                                                    <HiOutlineDocumentText className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {attachment.fileName}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        {(attachment.compressedSize / 1024).toFixed(0)} KB
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={attachment.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                title="Download"
                                                            >
                                                                <HiOutlineDownload className="h-4 w-4" />
                                                            </a>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Discrepancies Section */}
                                    {grns[0]?.discrepancies && grns[0].discrepancies.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 mt-4">
                                            <p className="text-xs text-gray-500 uppercase mb-2">Discrepancies</p>
                                            <div className="space-y-3">
                                                {grns[0].discrepancies.map((discrepancy: any) => (
                                                    <div
                                                        key={discrepancy.id}
                                                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <HiOutlineExclamationCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-yellow-900">
                                                                    {discrepancy.reason}
                                                                </p>
                                                                {discrepancy.description && (
                                                                    <p className="text-sm text-yellow-700 mt-1">
                                                                        {discrepancy.description}
                                                                    </p>
                                                                )}
                                                                {discrepancy.resolution && (
                                                                    <div className="mt-2 pt-2 border-t border-yellow-200">
                                                                        <p className="text-xs text-yellow-600 uppercase">Resolution</p>
                                                                        <p className="text-sm text-yellow-800 mt-0.5">
                                                                            {discrepancy.resolution}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {discrepancy.debitNoteValue && (
                                                                    <p className="text-xs text-yellow-700 mt-2">
                                                                        Debit Note: ₹{Number(discrepancy.debitNoteValue).toFixed(2)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Middle Column -- Empty now as attachments merged into left */}
                        <div className="space-y-6">
                            {/* You can use this space for other details if needed, or expand columns */}
                        </div>

                        {/* Right Column: Financial Summary */}
                        <div className="lg:col-start-3 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900">Financial Summary</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {(order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') && grns.length > 0 ? (
                                        <>
                                            {/* GRN Summary */}
                                            <div className="flex justify-between text-gray-600">
                                                <span>Subtotal</span>
                                                <span className="font-medium">{formatCurrency(grns.reduce((sum: number, grn: any) => sum + Number(grn.subtotal || 0), 0))}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tax (GST)</span>
                                                <span className="font-medium text-red-600">+{formatCurrency(grns.reduce((sum: number, grn: any) => sum + Number(grn.taxAmount || 0), 0))}</span>
                                            </div>

                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-base font-bold text-gray-900">Grand Total</span>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(grns.reduce((sum: number, grn: any) => sum + Number(grn.total || 0), 0))}</div>
                                                        <div className="text-xs text-gray-500 mt-1">Inclusive of all taxes</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Merged Tax Analysis Table */}
                                            <div className="mt-6 pt-4 border-t border-gray-100">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tax Analysis</h4>
                                                <div className="overflow-hidden rounded-lg border border-gray-200">
                                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-medium text-gray-500">GST Rate</th>
                                                                <th className="px-3 py-2 text-right font-medium text-gray-500">Taxable Value</th>
                                                                <th className="px-3 py-2 text-right font-medium text-gray-500">Tax Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {(() => {
                                                                const breakdown: any = {};
                                                                grns.forEach((grn: any) => {
                                                                    grn.items.forEach((item: any) => {
                                                                        if (item.isSplit) return;
                                                                        const rate = item.gstPercent || 0;
                                                                        if (!breakdown[rate]) breakdown[rate] = { taxable: 0, tax: 0 };

                                                                        const unitPrice = Number(item.unitPrice || 0);
                                                                        const qty = Number(item.receivedQty || 0);
                                                                        const discountPercent = Number(item.discountPercent || 0);
                                                                        const discountType = item.discountType || 'BEFORE_GST';

                                                                        const gross = qty * unitPrice;
                                                                        let taxable = 0;
                                                                        let tax = 0;

                                                                        if (discountType === 'AFTER_GST') {
                                                                            taxable = gross;
                                                                            tax = gross * (rate / 100);
                                                                        } else {
                                                                            const discount = gross * (discountPercent / 100);
                                                                            taxable = gross - discount;
                                                                            tax = taxable * (rate / 100);
                                                                        }

                                                                        breakdown[rate].taxable += taxable;
                                                                        breakdown[rate].tax += tax;
                                                                    });
                                                                });

                                                                return Object.entries(breakdown).sort((a, b) => Number(a[0]) - Number(b[0])).map(([rate, data]: [string, any]) => (
                                                                    <tr key={rate}>
                                                                        <td className="px-3 py-2 text-gray-900">{rate}%</td>
                                                                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(data.taxable)}</td>
                                                                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(data.tax)}</td>
                                                                    </tr>
                                                                ));
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        // PO Summary
                                        <>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Subtotal</span>
                                                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tax (GST)</span>
                                                <span className="font-medium">+{formatCurrency(order.taxAmount)}</span>
                                            </div>
                                            <div className="border-t border-gray-200 pt-4 mt-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                                                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}