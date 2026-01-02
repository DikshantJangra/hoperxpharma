'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiCalendar, FiFileText, FiInfo } from 'react-icons/fi';
import {
    getGSTDashboard,
    getGSTR1Summary,
    getGSTR3BSummary,
    getMonthlyTrends,
    type GSTDashboardData,
    type GSTR1Summary,
    type GSTR3BSummary
} from '@/lib/api/gst';
import { format } from 'date-fns';

export default function GSTReportsPage() {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [activeTab, setActiveTab] = useState<'dashboard' | 'gstr1' | 'gstr3b'>('dashboard');
    const [loading, setLoading] = useState(true);

    const [dashboardData, setDashboardData] = useState<GSTDashboardData | null>(null);
    const [gstr1Data, setGSTR1Data] = useState<GSTR1Summary | null>(null);
    const [gstr3bData, setGSTR3BData] = useState<GSTR3BSummary | null>(null);

    useEffect(() => {
        loadData();
    }, [selectedMonth, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'dashboard') {
                const data = await getGSTDashboard(selectedMonth);
                setDashboardData(data);
            } else if (activeTab === 'gstr1') {
                const data = await getGSTR1Summary(selectedMonth);
                setGSTR1Data(data);
            } else if (activeTab === 'gstr3b') {
                const data = await getGSTR3BSummary(selectedMonth);
                setGSTR3BData(data);
            }
        } catch (error) {
            console.error('Error loading GST data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const exportReport = () => {
        // TODO: Implement export functionality
        alert('Export functionality coming soon!');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">GST Reports & Returns</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        View and export GST reports for compliance filing
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FiCalendar className="text-gray-400" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <button
                        onClick={exportReport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        <FiDownload size={16} />
                        Export Report
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex gap-8 px-6">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: FiInfo },
                                { id: 'gstr1', label: 'GSTR-1', icon: FiFileText },
                                { id: 'gstr3b', label: 'GSTR-3B', icon: FiFileText },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-emerald-600 text-emerald-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'dashboard' && dashboardData && (
                                    <DashboardView data={dashboardData} formatCurrency={formatCurrency} />
                                )}
                                {activeTab === 'gstr1' && gstr1Data && (
                                    <GSTR1View data={gstr1Data} formatCurrency={formatCurrency} />
                                )}
                                {activeTab === 'gstr3b' && gstr3bData && (
                                    <GSTR3BView data={gstr3bData} formatCurrency={formatCurrency} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardView({ data, formatCurrency }: { data: GSTDashboardData; formatCurrency: (a: number) => string }) {
    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Sales" value={formatCurrency(data.totalSales)} />
                <StatCard label="Taxable Amount" value={formatCurrency(data.taxableAmount)} />
                <StatCard label="Total GST Collected" value={formatCurrency(data.totalGstCollected)} color="emerald" />
                <StatCard label="Total Invoices" value={data.totalInvoices.toString()} />
            </div>

            {/* Tax Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <TaxCard label="CGST" amount={data.cgstAmount} formatCurrency={formatCurrency} />
                    <TaxCard label="SGST" amount={data.sgstAmount} formatCurrency={formatCurrency} />
                    <TaxCard label="IGST" amount={data.igstAmount} formatCurrency={formatCurrency} />
                    <TaxCard label="CESS" amount={data.cessAmount} formatCurrency={formatCurrency} />
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">B2B Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">{data.b2bCount}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">B2C Invoices</p>
                        <p className="text-2xl font-bold text-gray-900">{data.b2cCount}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Zero-Rated</p>
                        <p className="text-2xl font-bold text-gray-900">{data.zeroRatedCount}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(data.zeroRatedTotal)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function GSTR1View({ data, formatCurrency }: { data: GSTR1Summary; formatCurrency: (a: number) => string }) {
    return (
        <div className="space-y-6">
            {/* Period Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>Period:</strong> {format(new Date(data.period.from), 'dd MMM yyyy')} to {format(new Date(data.period.to), 'dd MMM yyyy')}
                </p>
            </div>

            {/* B2B Section */}
            <div className="border rounded-lg">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-900">B2B Supplies (with GSTIN)</h3>
                    <p className="text-sm text-gray-600">{data.b2b.count} invoices • {formatCurrency(data.b2b.totalValue)}</p>
                </div>
                {data.b2b.invoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left">Invoice No.</th>
                                    <th className="px-4 py-3 text-left">GSTIN</th>
                                    <th className="px-4 py-3 text-right">Taxable Value</th>
                                    <th className="px-4 py-3 text-right">CGST</th>
                                    <th className="px-4 py-3 text-right">SGST</th>
                                    <th className="px-4 py-3 text-right">IGST</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.b2b.invoices.slice(0, 10).map((inv, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{inv.buyerGstin}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(inv.taxableValue)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(inv.cgst)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(inv.sgst)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(inv.igst)}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.invoiceValue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-8 text-center text-gray-500">No B2B invoices for this period</div>
                )}
            </div>

            {/* B2C Small Summary */}
            <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">B2C Small Supplies (Aggregated)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Invoices</p>
                        <p className="text-lg font-semibold">{data.b2cSmall.count}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Taxable Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.b2cSmall.taxableValue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CGST + SGST</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.b2cSmall.cgst + data.b2cSmall.sgst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.b2cSmall.totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* HSN Summary */}
            <div className="border rounded-lg">
                <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="font-semibold text-gray-900">HSN Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">HSN Code</th>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-right">Quantity</th>
                                <th className="px-4 py-3 text-right">Taxable Value</th>
                                <th className="px-4 py-3 text-right">CGST</th>
                                <th className="px-4 py-3 text-right">SGST</th>
                                <th className="px-4 py-3 text-right">IGST</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.hsnSummary.map((hsn, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono">{hsn.hsnCode}</td>
                                    <td className="px-4 py-3">{hsn.description}</td>
                                    <td className="px-4 py-3 text-right">{hsn.totalQuantity}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(hsn.taxableValue)}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(hsn.cgst)}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(hsn.sgst)}</td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(hsn.igst)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function GSTR3BView({ data, formatCurrency }: { data: GSTR3BSummary; formatCurrency: (a: number) => string }) {
    return (
        <div className="space-y-6">
            {/* Period Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    <strong>Period:</strong> {format(new Date(data.period.from), 'dd MMM yyyy')} to {format(new Date(data.period.to), 'dd MMM yyyy')}
                </p>
            </div>

            {/* Outward Supplies */}
            <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">3.1 Outward Supplies</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Taxable Value</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.outwardSupplies.taxableValue)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CGST</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.outwardSupplies.cgst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">SGST</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.outwardSupplies.sgst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">IGST</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.outwardSupplies.igst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CESS</p>
                        <p className="text-lg font-semibold">{formatCurrency(data.outwardSupplies.cess)}</p>
                    </div>
                </div>
            </div>

            {/* Tax Payable */}
            <div className="border rounded-lg p-6 bg-emerald-50">
                <h3 className="font-semibold text-gray-900 mb-4">3.2 Tax Payable</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">CGST</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(data.taxPayable.cgst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">SGST</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(data.taxPayable.sgst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">IGST</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(data.taxPayable.igst)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">CESS</p>
                        <p className="text-xl font-bold text-emerald-700">{formatCurrency(data.taxPayable.cess)}</p>
                    </div>
                </div>
            </div>

            {/* ITC Note */}
            {data.inputTaxCredit.note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900">
                        <strong>Note:</strong> {data.inputTaxCredit.note}
                    </p>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color = 'gray' }: { label: string; value: string; color?: string }) {
    const colors = {
        gray: 'bg-gray-50',
        emerald: 'bg-emerald-50',
    };

    return (
        <div className={`${colors[color as keyof typeof colors]} rounded-lg p-4`}>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function TaxCard({ label, amount, formatCurrency }: { label: string; amount: number; formatCurrency: (a: number) => string }) {
    return (
        <div className="bg-white rounded-lg p-4 border">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(amount)}</p>
        </div>
    );
}
