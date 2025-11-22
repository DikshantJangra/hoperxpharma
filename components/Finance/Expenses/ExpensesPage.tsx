'use client';

import React, { useState, useEffect } from 'react';
import { Expense, ExpenseSummary, ExpenseFilters } from '@/types/expenses';
import ExpensesHeaderKPIs from './ExpensesHeaderKPIs';
import FiltersPanel from './FiltersPanel';
import ExpenseLedgerTable from './ExpenseLedgerTable';
import ExpenseDetailDrawer from './ExpenseDetailDrawer';
import UploadOCRModal from './UploadOCRModal';

interface ExpensesPageProps {
  storeId: string;
}

export default function ExpensesPage({ storeId }: ExpensesPageProps) {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filters, setFilters] = useState<ExpenseFilters>({
    from: monthAgo,
    to: today
  });

  const [summary, setSummary] = useState<ExpenseSummary>({
    totalSpend: 0,
    outstanding: 0,
    overdue: 0,
    pendingApproval: 0
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setSummary({
            totalSpend: 0,
            outstanding: 0,
            overdue: 0,
            pendingApproval: 0
        });
        setExpenses([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [filters]); // Re-fetch when filters change


  const handleDateChange = (from: string, to: string) => {
    setFilters({ ...filters, from, to });
  };

  const handleKPIClick = (filter: string) => {
    if (filter === 'pending') {
      setFilters({ ...filters, status: 'PENDING_APPROVAL' });
    } else if (filter === 'overdue') {
      // Filter logic for overdue
    }
  };

  const handleApprove = async (expenseId: string, comment: string) => {
    // Simulate API call
    alert(`Approving expense ${expenseId}...`);
    setExpenses(prevExpenses => prevExpenses.map(e =>
      e.expenseId === expenseId ? { ...e, status: 'APPROVED' } : e
    ));
    setSelectedExpense(null);
  };

  const handleReject = (expenseId: string, comment: string) => {
    // Simulate API call
    alert(`Rejecting expense ${expenseId}...`);
    setExpenses(prevExpenses => prevExpenses.map(e =>
      e.expenseId === expenseId ? { ...e, status: 'CANCELLED' } : e
    ));
    setSelectedExpense(null);
  };

  const handleUploadSubmit = (data: any) => {
    const newExpense: Expense = {
      expenseId: `exp_${Date.now()}`,
      vendorId: data.vendorId,
      vendorName: 'New Vendor', // Placeholder
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      currency: 'INR',
      grossAmount: data.grossAmount,
      gstAmount: data.gstAmount,
      tdsAmount: 0,
      netAmount: data.grossAmount - data.gstAmount,
      category: data.category,
      glAccount: '6110-Stationery', // Placeholder
      storeId: storeId,
      status: 'PENDING_APPROVAL',
      attachments: [],
      createdBy: { id: 'u_01', name: 'User' },
      createdAt: new Date().toISOString(),
      approvalHistory: [],
      reconciliation: { matched: false, bankTxId: null }
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
    alert('Expense created and submitted for approval');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ExpensesHeaderKPIs
        summary={summary}
        dateRange={{ from: filters.from, to: filters.to }}
        onDateChange={handleDateChange}
        onKPIClick={handleKPIClick}
        isLoading={isLoading}
      />

      <div className="grid grid-cols-12">
        <div className="col-span-3">
          <FiltersPanel
            filters={filters}
            onChange={setFilters}
            onUploadClick={() => setShowUploadModal(true)}
            onCreateClick={() => setShowUploadModal(true)}
          />
        </div>

        <div className="col-span-6 p-6">
          <ExpenseLedgerTable
            expenses={expenses}
            selectedId={selectedExpense?.expenseId}
            onRowClick={setSelectedExpense}
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-3">
          <ExpenseDetailDrawer
            expense={selectedExpense}
            onApprove={handleApprove}
            onReject={handleReject}
            isLoading={isLoading && !selectedExpense} // Only show loading if main data is loading AND no expense is selected
          />
        </div>
      </div>

      <UploadOCRModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleUploadSubmit}
      />
    </div>
  );
}
