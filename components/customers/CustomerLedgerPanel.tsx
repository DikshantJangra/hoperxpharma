import { useState, useEffect } from 'react';
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
}

type Tab = 'unpaid' | 'history';

export default function CustomerLedgerPanel({
    isOpen,
    onClose,
    customerId,
    onBalanceUpdate
}: CustomerLedgerPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>('unpaid');
    const [loading, setLoading] = useState(false);

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
        try {
            setLoading(true);
            const [ledgerData, invoicesData] = await Promise.all([
                customerLedgerApi.getLedger(customerId),
                customerLedgerApi.getUnpaidInvoices(customerId)
            ]);
            // setCustomer(patientData.data); // Handled by useQuery
            setLedger(ledgerData.data || []);
            setUnpaidInvoices(invoicesData || []);
        } catch (error) {
            console.error("Error fetching ledger:", error);
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

    const currentBalance = customer?.currentBalance ? Number(customer.currentBalance) : 0;
    const totalUnpaidInvoices = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
    const canSettle = currentBalance > 0 || totalUnpaidInvoices > 0;

    return (
        <RightPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Customer Ledger"
            width="w-full md:w-[700px]" // Increased width for table
        >
            <div className="flex flex-col h-full space-y-4">

                {/* Header Summary */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
                            <div className={`text-4xl font-bold mt-1 ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            {customer && (
                                <div className="mt-1 text-gray-600 text-sm">
                                    {customer.firstName} {customer.lastName} • {customer.phoneNumber}
                                </div>
                            )}
                        </div>

                        {!showPaymentForm && (
                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleSettleFull}
                                    disabled={!canSettle}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle /> Settle Full
                                </button>
                                <button
                                    onClick={() => { setPaymentAmount(''); setShowPaymentForm(true); }}
                                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2"
                                >
                                    <FiDollarSign /> Make Payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Form */}
                {showPaymentForm && (
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <FiDollarSign className="text-indigo-600" />
                                    {selectedInvoiceIds.size > 0 ? `Pay for ${selectedInvoiceIds.size} Invoice(s)` : 'New Payment'}
                                </h3>
                                {selectedInvoiceIds.size > 0 && (
                                    <p className="text-xs text-indigo-600 mt-1 font-medium">Auto-calculated from selection</p>
                                )}
                            </div>
                            <button onClick={() => setShowPaymentForm(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount (₹)
                                        {selectedInvoiceIds.size === 0 && currentBalance > 0 && (
                                            <span className="text-xs text-gray-500 ml-2 font-normal">
                                                (Max: ₹{currentBalance})
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        // max={selectedInvoiceIds.size > 0 ? undefined : currentBalance} // Allow overpayment or partial payment freely
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => {
                                            // Allow editing regardless of selection
                                            const val = e.target.value;
                                            setPaymentAmount(val);
                                            setIsManualAmount(true);
                                        }}
                                        // readOnly={selectedInvoiceIds.size > 0} // REMOVED: Allow partial payment
                                        className="w-full p-2.5 border rounded-lg font-bold text-lg bg-white border-gray-300 focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {selectedInvoiceIds.size > 0 && parseFloat(paymentAmount) < unpaidInvoices.filter(i => selectedInvoiceIds.has(i.id)).reduce((sum, i) => sum + Number(i.balance), 0) && (
                                        <p className="text-xs text-amber-600 mt-1">Partial payment: Amount will be allocated to oldest invoices first.</p>
                                    )}
                                    {parseFloat(paymentAmount) > currentBalance && (
                                        <p className="text-xs text-red-500 mt-1 font-medium">
                                            Warning: Amount exceeds outstanding balance.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="WALLET">Wallet</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-md transition-all active:scale-[0.98]"
                            >
                                {submitting ? 'Processing...' : `Confirm Value of ₹${paymentAmount || '0'} `}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('unpaid')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'unpaid'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FiList /> Unpaid Invoices ({unpaidInvoices.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'history'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <FiClock /> Ledger History
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">
                    {activeTab === 'unpaid' ? (
                        <div className="flex-1 overflow-y-auto">
                            {unpaidInvoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                                    <FiCheckCircle className="w-10 h-10 text-green-200" />
                                    <p>No unpaid invoices! Customer is all clear.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 sticky top-0 font-medium z-10">
                                        <tr>
                                            <th className="p-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={unpaidInvoices.length > 0 && selectedInvoiceIds.size === unpaidInvoices.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th className="p-3">Invoice</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3 text-right">Due Balance</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {unpaidInvoices.map((inv) => (
                                            <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${selectedInvoiceIds.has(inv.id) ? 'bg-indigo-50/30' : ''}`}>
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        checked={selectedInvoiceIds.has(inv.id)}
                                                        onChange={() => toggleInvoiceSelection(inv.id)}
                                                    />
                                                </td>
                                                <td className="p-3 font-medium text-gray-700">#{inv.invoiceNumber}</td>
                                                <td className="p-3 text-gray-500">{format(new Date(inv.createdAt), 'dd MMM yyyy')}</td>
                                                <td className="p-3 text-right text-gray-500">₹{Number(inv.total).toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold text-red-600">₹{Number(inv.balance).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide
                                                        ${inv.paymentStatus === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                                            inv.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                                                        {inv.paymentStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto">
                            {ledger.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No transaction history found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 sticky top-0 font-medium">
                                        <tr>
                                            <th className="p-3 border-b">Date</th>
                                            <th className="p-3 border-b">Type</th>
                                            <th className="p-3 border-b text-right">Amount</th>
                                            <th className="p-3 border-b text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {ledger.map((entry) => {
                                            const isDebit = entry.type === 'DEBIT';
                                            return (
                                                <tr key={entry.id} className="hover:bg-gray-50/50">
                                                    <td className="p-3 text-gray-500">
                                                        <div>{format(new Date(entry.createdAt), 'dd MMM yyyy')}</div>
                                                        <div className="text-xs text-gray-400">{format(new Date(entry.createdAt), 'hh:mm a')}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDebit ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                            {isDebit ? 'Purchase' : 'Payment'}
                                                        </span>
                                                        {entry.notes && (
                                                            <div className="text-xs text-gray-400 mt-1 max-w-[150px] truncate" title={entry.notes}>
                                                                {entry.notes}
                                                            </div>
                                                        )}
                                                        {entry.allocations && entry.allocations.length > 0 && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {entry.allocations.map((alloc, idx) => (
                                                                    <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                        #{alloc.sale.invoiceNumber}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className={`p-3 text-right font-medium ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isDebit ? '+' : '-'}₹{Number(entry.amount).toFixed(2)}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-700">
                                                        ₹{Number(entry.balanceAfter).toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </RightPanel>
    );
}
