'use client';

import React, { useState } from 'react';
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

  const [summary] = useState<ExpenseSummary>({
    totalSpend: 485600,
    outstanding: 125000,
    overdue: 32000,
    pendingApproval: 45000
  });

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      expenseId: 'exp_001',
      vendorId: 'sup_001',
      vendorName: 'ABC Supplies',
      invoiceNumber: 'INV-2025-001',
      invoiceDate: '2025-11-01',
      dueDate: '2025-11-30',
      currency: 'INR',
      grossAmount: 10000,
      gstAmount: 1800,
      tdsAmount: 0,
      netAmount: 8200,
      category: 'Consumables',
      glAccount: '6110-Stationery',
      storeId: 'store_01',
      status: 'PENDING_APPROVAL',
      attachments: [{ id: 'doc_1', name: 'invoice.pdf', url: '#' }],
      createdBy: { id: 'u_01', name: 'Krish' },
      createdAt: '2025-11-10T09:12:00Z',
      approvalHistory: [],
      reconciliation: { matched: false, bankTxId: null }
    },
    {
      expenseId: 'exp_002',
      vendorId: 'sup_002',
      vendorName: 'MediCore Supplies',
      invoiceNumber: 'MC-2025-456',
      invoiceDate: '2025-11-05',
      dueDate: '2025-12-05',
      currency: 'INR',
      grossAmount: 25000,
      gstAmount: 4500,
      tdsAmount: 500,
      netAmount: 20000,
      category: 'Rent',
      glAccount: '6200-Rent',
      storeId: 'store_01',
      status: 'APPROVED',
      attachments: [],
      createdBy: { id: 'u_02', name: 'Priya' },
      createdAt: '2025-11-08T14:30:00Z',
      approvalHistory: [{ actor: 'u_mgr1', action: 'APPROVED', timestamp: '2025-11-09T10:00:00Z', comment: 'Approved' }],
      reconciliation: { matched: false, bankTxId: null }
    }
  ]);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverId: 'u_mgr1', comment })
      });

      if (response.ok) {
        const result = await response.json();
        setExpenses(expenses.map(e =>
          e.expenseId === expenseId
            ? { ...e, status: 'APPROVED', auditEventId: result.auditEventId }
            : e
        ));
        alert(`Expense approved • Audit ${result.auditEventId}`);
        setSelectedExpense(null);
      }
    } catch (error) {
      alert('Failed to approve expense');
    }
  };

  const handleReject = (expenseId: string, comment: string) => {
    setExpenses(expenses.map(e =>
      e.expenseId === expenseId ? { ...e, status: 'CANCELLED' } : e
    ));
    alert('Expense rejected');
    setSelectedExpense(null);
  };

  const handleUploadSubmit = (data: any) => {
    const newExpense: Expense = {
      expenseId: `exp_${Date.now()}`,
      vendorId: data.vendorId,
      vendorName: 'ABC Supplies',
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      currency: 'INR',
      grossAmount: data.grossAmount,
      gstAmount: data.gstAmount,
      tdsAmount: 0,
      netAmount: data.grossAmount - data.gstAmount,
      category: data.category,
      glAccount: '6110-Stationery',
      storeId: 'store_01',
      status: 'PENDING_APPROVAL',
      attachments: [],
      createdBy: { id: 'u_01', name: 'User' },
      createdAt: new Date().toISOString(),
      approvalHistory: [],
      reconciliation: { matched: false, bankTxId: null }
    };
    setExpenses([newExpense, ...expenses]);
    alert('Expense created and submitted for approval');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ExpensesHeaderKPIs
        summary={summary}
        dateRange={{ from: filters.from, to: filters.to }}
        onDateChange={handleDateChange}
        onKPIClick={handleKPIClick}
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
          />
        </div>

        <div className="col-span-3">
          <ExpenseDetailDrawer
            expense={selectedExpense}
            onApprove={handleApprove}
            onReject={handleReject}
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
