import { useState, useEffect, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FiDollarSign, FiClock, FiX, FiPrinter, FiCheckCircle, FiRefreshCw, FiList, FiFileText } from 'react-icons/fi';
import { customerLedgerApi, CustomerLedgerEntry, UnpaidInvoice } from '@/lib/api/customerLedger';
import { patientsApi, Patient } from '@/lib/api/patients';
import RightPanel from '@/components/ui/RightPanel';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomerLedgerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
    onBalanceUpdate?: (newBalance: number) => void;
    isInline?: boolean;
}

type Tab = 'unpaid' | 'history';

export default function CustomerLedgerPanel({
    isOpen,
    onClose,
    customerId,
    onBalanceUpdate,
    isInline = false
}: CustomerLedgerPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('unpaid');
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const queryClient = useQueryClient();

    // FIX: Force refresh of patient data when panel opens to show latest balance
    useEffect(() => {
        if (customerId) {
            console.log(`[CustomerLedgerPanel] Invalidating patient query for ${customerId}`);
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] });
            // Also invalidate ledger
            queryClient.invalidateQueries({ queryKey: ['customer-ledger', customerId] });
        }
    }, [customerId, queryClient]);

    const { data: customer, isLoading: isLoadingCustomer } = useQuery<Patient | null>({
        queryKey: ['patient', customerId],
        queryFn: () => patientsApi.getPatientById(customerId),
        enabled: !!customerId,
    });

    const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
    const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);

    // Selection State
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
    const [amountByType, setAmountByType] = useState<Record<string, number>>({});
    const [isManualAmount, setIsManualAmount] = useState(false); // Track if user manually edited amount
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [successPayment, setSuccessPayment] = useState<{ amount: number, previousBalance: number } | null>(null);

    // Payment Form States
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && customerId) {
            fetchData();
            setSuccessPayment(null);
            setSelectedInvoiceIds(new Set());
            setActiveTab('unpaid');
        } else {
            setShowPaymentForm(false);
            setPaymentAmount('');
            setSuccessPayment(null);
        }
    }, [isOpen, customerId]);

    const fetchData = async () => {
        console.log('🔄 fetchData called for customer:', customerId);
        try {
            setLoading(true);
            console.log('📡 Starting API calls...');
            const [ledgerData, invoicesData] = await Promise.all([
                customerLedgerApi.getLedger(customerId),
                customerLedgerApi.getUnpaidInvoices(customerId)
            ]);
            console.log('✅ API calls completed');
            console.log('📊 Ledger Data:', ledgerData);
            console.log('🔍 Unpaid Invoices Raw:', invoicesData);

            // Log each invoice individually
            if (invoicesData && Array.isArray(invoicesData)) {
                invoicesData.forEach((inv: any, idx: number) => {
                    console.log(`📋 Invoice ${idx + 1}:`, {
                        number: inv.invoiceNumber,
                        total: inv.total,
                        balance: inv.balance,
                        expectedDate: inv.expectedPaymentDate,
                        status: inv.paymentStatus
                    });
                });
            }

            // setCustomer(patientData.data); // Handled by useQuery
            setLedger(ledgerData.data || []);
            setUnpaidInvoices(invoicesData || []);
            console.log('✅ State updated - unpaidInvoices count:', invoicesData?.length || 0);
        } catch (error) {
            console.error("❌ Error fetching ledger:", error);
            toast.error("Failed to load customer ledger.");
        } finally {
            setLoading(false);
        }
    };

    const toggleInvoiceSelection = (invoiceId: string) => {
        const newSet = new Set(selectedInvoiceIds);
        if (newSet.has(invoiceId)) {
            newSet.delete(invoiceId);
        } else {
            newSet.add(invoiceId);
        }
        setSelectedInvoiceIds(newSet);

        // Auto-calculate payment amount based on selection ONLY if user hasn't manually edited
        if (!isManualAmount) {
            const totalSelected = unpaidInvoices
                .filter(inv => newSet.has(inv.id))
                .reduce((sum, inv) => sum + Number(inv.balance), 0);

            if (totalSelected > 0) {
                setPaymentAmount(totalSelected.toFixed(2));
                setShowPaymentForm(true);
            } else {
                if (!showPaymentForm) setPaymentAmount('');
            }
        } else {
            setShowPaymentForm(true);
        }
    };

    const handleSelectAll = () => {
        if (selectedInvoiceIds.size === unpaidInvoices.length) {
            setSelectedInvoiceIds(new Set());
            setPaymentAmount('');
        } else {
            const allIds = new Set(unpaidInvoices.map(i => i.id));
            setSelectedInvoiceIds(allIds);
            const total = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
            setPaymentAmount(total.toFixed(2));
            setShowPaymentForm(true);
        }
    };

    const handlePayment = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const amountToPay = parseFloat(paymentAmount);

        if (!amountToPay || amountToPay <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const currentBal = Number(customer?.currentBalance || 0);
        if (selectedInvoiceIds.size === 0 && amountToPay > currentBal) {
            toast.error(`Amount cannot exceed outstanding balance of ₹${currentBal}`);
            return;
        }

        try {
            setSubmitting(true);
            const previousBalance = Number(customer?.currentBalance || 0);

            // New Requirement: Mandatory Invoice Selection
            if (selectedInvoiceIds.size === 0) {
                toast.error("Please select at least one invoice to pay against.");
                setSubmitting(false);
                return;
            }

            // Prepare Allocations
            let allocations: { saleId: string; amount: number }[] | undefined;

            // If invoices are selected, valid allocation must match payment amount or be logical
            // Ideally, we allocate exactly what is selected.
            // Construct allocations based on selected IDs
            const selectedInvoices = unpaidInvoices.filter(inv => selectedInvoiceIds.has(inv.id));
            const totalSelectedBalance = selectedInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

            if (selectedInvoiceIds.size > 0 && Math.abs(amountToPay - totalSelectedBalance) < 0.01) {
                // Exact match, perfect allocation
                allocations = selectedInvoices.map(inv => ({
                    saleId: inv.id,
                    amount: Number(inv.balance)
                }));
            } else if (selectedInvoiceIds.size > 0 && amountToPay < totalSelectedBalance) {
                // Partial payment for selected invoices. Allocate FIFO.
                let remainingAmount = amountToPay;
                allocations = [];
                for (const inv of selectedInvoices) {
                    if (remainingAmount <= 0) break;
                    const amountToAllocate = Math.min(remainingAmount, Number(inv.balance));
                    allocations.push({ saleId: inv.id, amount: amountToAllocate });
                    remainingAmount -= amountToAllocate;
                }
            } else if (selectedInvoiceIds.size > 0 && amountToPay > totalSelectedBalance) {
                // Overpayment for selected invoices. Allocate full to selected, rest as unallocated.
                allocations = selectedInvoices.map(inv => ({
                    saleId: inv.id,
                    amount: Number(inv.balance)
                }));
                // The backend should handle the remaining amount as unallocated credit.
            }
            // Logic guarantees selectedInvoiceIds.size > 0 here because of the early return above.

            await customerLedgerApi.makePayment(customerId, {
                amount: amountToPay,
                paymentMethod,
                notes: paymentNotes,
                allocations // Optional
            });

            toast.success("Payment processed successfully!");

            // Set success state for receipt
            setSuccessPayment({
                amount: amountToPay,
                previousBalance
            });

            // Refresh data
            await fetchData();
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] });
            setSelectedInvoiceIds(new Set()); // Clear selection

            // Notify parent
            const updatedPatient = await patientsApi.getPatientById(customerId);
            if (onBalanceUpdate && updatedPatient.data) {
                onBalanceUpdate(Number(updatedPatient.data.currentBalance));
            }

            setShowPaymentForm(false);
            setPaymentAmount('');
            setPaymentNotes('');
            setIsManualAmount(false);
        } catch (error) {
            console.error("Payment failed:", error);
            toast.error("Failed to process payment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettleFull = () => {
        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
        // Prioritize total unpaid invoices for "Settle Full" behavior, 
        // regardless of current balance (which might include credits/overpayments separately)
        // OR should we stick to balance? The user said "Settle Full should actually select all the invoices"

        // Auto-select ALL unpaid invoices
        const allInvoiceIds = new Set(unpaidInvoices.map(inv => inv.id));
        setSelectedInvoiceIds(allInvoiceIds);
        setIsManualAmount(false); // Reset manual flag for explicit settle full

        const amountToSettle = totalUnpaid;

        if (amountToSettle > 0) {
            setPaymentAmount(amountToSettle.toFixed(2));
            setShowPaymentForm(true);
        } else {
            toast.error("No outstanding invoices to settle.");
        }
    };

    const generateReceipt = () => {
        if (!successPayment || !customer) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(18);
        doc.text('Payment Receipt', pageWidth / 2, 20, { align: 'center' });

        // Date
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 32, pageWidth - 20, 32);

        // Customer Info
        doc.setFontSize(12);
        doc.text(`Customer: ${customer.firstName} ${customer.lastName}`, 20, 45);
        doc.text(`Phone: ${customer.phoneNumber}`, 20, 52);

        // Payment Details
        doc.setFontSize(14);
        doc.text('Payment Details:', 20, 70);

        const currentBal = Number(customer.currentBalance);

        const data = [
            ['Previous Balance', `Rs. ${successPayment.previousBalance.toFixed(2)}`],
            ['Paid Amount', `Rs. ${successPayment.amount.toFixed(2)}`],
            ['Payment Method', paymentMethod],
            ['Remaining Due', `Rs. ${currentBal.toFixed(2)}`]
        ];

        autoTable(doc, {
            startY: 75,
            head: [['Description', 'Amount']],
            body: data,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Footer
        doc.setFontSize(10);
        doc.text('Thank you for your payment!', pageWidth / 2, doc.internal.pageSize.height - 20, { align: 'center' });

        doc.save(`Receipt_${customer.firstName}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast.success("Receipt downloaded!");
    };

    const handleSyncBalance = async () => {
        try {
            const toastId = toast.loading("Syncing balance...");
            const response = await patientsApi.syncBalance(customerId);

            // Immediately update local state from response
            if (response.data && typeof response.data.currentBalance !== 'undefined') {
                // Invalidate to refresh UI
                queryClient.invalidateQueries({ queryKey: ['patient', customerId] });
                if (onBalanceUpdate) onBalanceUpdate(Number(response.data.currentBalance));
            }

            await fetchData(); // Fetch other data (ledger/invoices)
            toast.dismiss(toastId);
            toast.success("Balance synchronized");
        } catch (e) {
            toast.error("Failed to sync balance");
        }
    };

    const Shimmer = () => (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
    );

    const LedgerSkeleton = () => (
        <div className="flex-1 space-y-3 p-1">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-100 rounded w-1/3 relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="h-3 bg-gray-50 rounded w-1/2 relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-16 ml-auto relative overflow-hidden">
                                <Shimmer />
                            </div>
                            <div className="h-3 bg-gray-50 rounded w-10 ml-auto relative overflow-hidden">
                                <Shimmer />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const currentBalance = customer?.currentBalance ? Number(customer.currentBalance) : 0;
    const totalUnpaidInvoices = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
    const canSettle = currentBalance > 0 || totalUnpaidInvoices > 0;

    const content = (
        <div className={`flex flex-col h-full space-y-4 ${isInline ? 'bg-[#f8fafc] p-4' : ''}`}>
            {isInline && (
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-900">Customer Ledger</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Header Summary */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm shrink-0 relative overflow-hidden">
                {isLoadingCustomer ? (
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-100 rounded w-24 relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="h-10 bg-gray-100 rounded w-48 relative overflow-hidden">
                            <Shimmer />
                        </div>
                        <div className="h-4 bg-gray-50 rounded w-32 relative overflow-hidden">
                            <Shimmer />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                Current Outstanding
                                <button
                                    onClick={handleSyncBalance}
                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                    title="Sync Balance"
                                >
                                    <FiRefreshCw className="w-3 h-3" />
                                </button>
                            </h3>
                            <div className={`text-3xl font-bold mt-1 ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            {customer && (
                                <div className="mt-1 text-gray-600 text-xs">
                                    {customer.firstName} {customer.lastName} • {customer.phoneNumber}
                                </div>
                            )}
                        </div>

                        {!showPaymentForm && (
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleSettleFull}
                                    disabled={!canSettle}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle /> Settle Full
                                </button>
                                <button
                                    onClick={() => { setPaymentAmount(''); setShowPaymentForm(true); }}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <FiDollarSign /> Make Payment
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Inline Payment Form Overlay */}
                {showPaymentForm && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FiDollarSign className="text-indigo-600" />
                                {selectedInvoiceIds.size > 0 ? `Pay for ${selectedInvoiceIds.size} Invoice(s)` : 'New Payment'}
                            </h4>
                            <button
                                onClick={() => {
                                    setShowPaymentForm(false);
                                    setSelectedInvoiceIds(new Set());
                                    setPaymentAmount('');
                                }}
                                className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        setPaymentAmount(e.target.value);
                                        setIsManualAmount(true);
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                    <option value="WALLET">Wallet</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                            >
                                {submitting ? 'Processing...' : `Confirm • ₹${paymentAmount || '0'}`}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
                <button
                    onClick={() => setActiveTab('unpaid')}
                    className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'unpaid'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <FiList /> Unpaid ({unpaidInvoices.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    <FiClock /> History
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
                {loading ? (
                    <LedgerSkeleton />
                ) : activeTab === 'unpaid' ? (
                    <div className="flex-1 overflow-y-auto">
                        {unpaidInvoices.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                                <FiCheckCircle className="w-10 h-10 text-green-200" />
                                <p className="text-sm">No unpaid invoices!</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0 font-medium z-10">
                                    <tr>
                                        <th className="p-2 w-8">
                                            <input
                                                type="checkbox"
                                                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={unpaidInvoices.length > 0 && selectedInvoiceIds.size === unpaidInvoices.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="p-2">Invoice</th>
                                        <th className="p-2 text-right">Due</th>
                                        <th className="p-2">Expected</th>
                                        <th className="p-2 text-right">Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {unpaidInvoices.map((inv) => {
                                        const expectedDate = inv.expectedPaymentDate ? new Date(inv.expectedPaymentDate) : null;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);

                                        let daysInfo = null;
                                        let urgencyClass = '';
                                        let urgencyBg = '';

                                        if (expectedDate) {
                                            const expDate = new Date(expectedDate);
                                            expDate.setHours(0, 0, 0, 0);
                                            const diffTime = expDate.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            if (diffDays < 0) {
                                                // Overdue
                                                const overdueDays = Math.abs(diffDays);
                                                daysInfo = `${overdueDays}d overdue`;
                                                urgencyClass = 'text-red-700';
                                                urgencyBg = 'bg-red-50 border-red-200';
                                            } else if (diffDays === 0) {
                                                daysInfo = 'Due today';
                                                urgencyClass = 'text-orange-700';
                                                urgencyBg = 'bg-orange-50 border-orange-200';
                                            } else if (diffDays <= 7) {
                                                daysInfo = `${diffDays}d left`;
                                                urgencyClass = 'text-amber-700';
                                                urgencyBg = 'bg-amber-50 border-amber-200';
                                            } else {
                                                daysInfo = `${diffDays}d left`;
                                                urgencyClass = 'text-green-700';
                                                urgencyBg = 'bg-green-50 border-green-200';
                                            }
                                        }

                                        return (
                                            <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedInvoiceIds.has(inv.id) ? 'bg-indigo-50/30' : ''}`}>
                                                <td className="p-2">
                                                    <input
                                                        type="checkbox"
                                                        className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedInvoiceIds.has(inv.id)}
                                                        onChange={() => toggleInvoiceSelection(inv.id)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <div className="font-medium text-gray-700">#{inv.invoiceNumber}</div>
                                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                                        {format(new Date(inv.createdAt), 'dd MMM yy')}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right font-bold text-red-600">₹{Number(inv.balance).toFixed(0)}</td>
                                                <td className="p-2">
                                                    {expectedDate ? (
                                                        <div className="text-[11px] text-gray-500">
                                                            {format(expectedDate, 'dd MMM')}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {daysInfo ? (
                                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${urgencyClass} ${urgencyBg}`}>
                                                            {daysInfo}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">No date</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {ledger.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-sm">No transaction history.</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {ledger.map((entry) => {
                                        const isDebit = entry.type === 'DEBIT';
                                        const isExpanded = expandedRows.has(entry.id);

                                        // Relatable Description Logic
                                        let relatableTitle = entry.notes || 'Transaction';
                                        if (relatableTitle.startsWith('Purchase: ')) {
                                            relatableTitle = relatableTitle.split(' (')[0].replace('Purchase: ', 'Order ');
                                        } else if (entry.referenceType === 'SALE') {
                                            relatableTitle = `Order #${entry.referenceId?.slice(-6).toUpperCase()}`;
                                        } else if (entry.referenceType === 'PAYMENT') {
                                            relatableTitle = `Receipt #${entry.id?.slice(-6).toUpperCase()}`;
                                        } else if (entry.referenceType === 'RETURN') {
                                            relatableTitle = `Return #${entry.referenceId?.slice(-6).toUpperCase()}`;
                                        }

                                        return (
                                            <Fragment key={entry.id}>
                                                <tr
                                                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        const newSet = new Set(expandedRows);
                                                        if (newSet.has(entry.id)) {
                                                            newSet.delete(entry.id);
                                                        } else {
                                                            newSet.add(entry.id);
                                                        }
                                                        setExpandedRows(newSet);
                                                    }}
                                                >
                                                    <td className="p-3">
                                                        <div className="text-gray-700 font-medium">{format(new Date(entry.createdAt), 'dd MMM yy')}</div>
                                                        <div className="text-[10px] text-gray-400 uppercase">{format(new Date(entry.createdAt), 'hh:mm a')}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${entry.referenceType === 'SALE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                            entry.referenceType === 'PAYMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                (entry.referenceType === 'RETURN' || entry.referenceType === 'REFUND') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                                    isDebit ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                                            }`}>
                                                            {entry.referenceType === 'SALE' ? 'Credit Purchase' :
                                                                entry.referenceType === 'PAYMENT' ? 'Payment Received' :
                                                                    entry.referenceType === 'RETURN' ? 'Return' :
                                                                        entry.referenceType === 'REFUND' ? 'Refunded' :
                                                                            entry.referenceType === 'ADJUSTMENT' ? 'Adjust' :
                                                                                entry.referenceType === 'OPENING_BALANCE' ? 'Opening' :
                                                                                    isDebit ? 'Debit' : 'Credit'}
                                                        </span>
                                                    </td>
                                                    <td className={`p-3 text-right font-bold ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isDebit ? '+' : '-'}&#8377;{Number(entry.amount).toFixed(0)}
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr key={`${entry.id}-expand`}>
                                                        <td colSpan={3} className="p-0 bg-gray-50/50">
                                                            <div className="p-4 border-t border-gray-100 space-y-3">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">Detailed Description</div>
                                                                        <div className="text-sm font-bold text-gray-800">{relatableTitle}</div>
                                                                        {entry.notes && entry.notes.includes('(') && (
                                                                            <div className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-indigo-200">
                                                                                {entry.notes.split('(')[1].replace(')', '')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">Balance After</div>
                                                                        <div className="text-sm font-bold text-gray-900">&#8377;{Number(entry.balanceAfter).toFixed(0)}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200/50">
                                                                    <div>
                                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Reference ID</div>
                                                                        <div className="text-[11px] font-mono text-gray-500 break-all bg-gray-100 p-1.5 rounded">{entry.referenceId || entry.id}</div>
                                                                    </div>

                                                                    {entry.allocations && entry.allocations.length > 0 && (
                                                                        <div className="col-span-2 space-y-2">
                                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Allocations (Payment for)</div>
                                                                            <div className="grid grid-cols-1 gap-1.5">
                                                                                {entry.allocations.map((alloc, i) => (
                                                                                    <div key={i} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                                                                                        <span className="text-xs font-semibold text-gray-700">Invoice #{alloc.sale.invoiceNumber}</span>
                                                                                        <span className="text-xs font-bold text-indigo-600">&#8377;{alloc.amount.toFixed(0)}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {entry.referenceType === 'PAYMENT' && (
                                                                    <div className="flex justify-end pt-2">
                                                                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase bg-orange-50 px-2 py-1 rounded transition-colors">
                                                                            <FiRefreshCw className="w-3 h-3" />
                                                                            Refund Payment
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (isInline) {
        return content;
    }

    return (
        <RightPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Customer Ledger"
            width="w-full md:w-[700px]"
        >
            {content}
        </RightPanel>
    );
}
