'use client';

import React, { useState, useEffect } from 'react';
import { LedgerRow, SalesSummary, SalesFilters, MatchCandidate } from '@/types/finance';
import SalesHeaderKPIs from './SalesHeaderKPIs';
import SalesFiltersPanel from './SalesFiltersPanel';
import SalesLedgerTable from './SalesLedgerTable';
import ReconciliationPanel from './ReconciliationPanel';

interface SalesPageProps {
  storeId: string;
}

export default function SalesPage({ storeId }: SalesPageProps) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filters, setFilters] = useState<SalesFilters>({
    from: weekAgo,
    to: today
  });

  const [summary, setSummary] = useState<SalesSummary>({
    revenue: 245600,
    cash: 85000,
    card: 95000,
    upi: 60000,
    wallet: 5600,
    outstanding: 12400,
    refunds: { count: 3, amount: 4200 },
    reconRate: 87.5
  });

  const [rows, setRows] = useState<LedgerRow[]>([
    {
      id: 'ledger_001',
      type: 'INVOICE',
      date: '2025-11-13T10:30:00Z',
      invoiceId: 'INV-2025-001234',
      storeId: 'store_01',
      source: 'POS',
      customer: { id: 'p_123', name: 'Riya Sharma' },
      gross: 1200,
      tax: 216,
      net: 984,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      bankTransactionId: 'bank_tx_988',
      reconStatus: 'MATCHED',
      tags: [],
      auditEventId: 'audit_9001'
    },
    {
      id: 'ledger_002',
      type: 'INVOICE',
      date: '2025-11-13T11:15:00Z',
      invoiceId: 'INV-2025-001235',
      storeId: 'store_01',
      source: 'POS',
      customer: { id: 'p_124', name: 'Amit Kumar' },
      gross: 850,
      tax: 153,
      net: 697,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      reconStatus: 'UNMATCHED',
      tags: []
    },
    {
      id: 'ledger_003',
      type: 'INVOICE',
      date: '2025-11-13T14:20:00Z',
      invoiceId: 'INV-2025-001236',
      storeId: 'store_01',
      source: 'ONLINE',
      customer: { id: 'p_125', name: 'Priya Singh' },
      gross: 2400,
      tax: 432,
      net: 1968,
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      reconStatus: 'UNMATCHED',
      tags: []
    }
  ]);

  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);

  useEffect(() => {
    if (selectedRow && selectedRow.reconStatus === 'UNMATCHED') {
      setCandidates([
        {
          bankTx: {
            id: 'bank_tx_100',
            date: selectedRow.date,
            amount: selectedRow.net,
            reference: 'UPI/123456789',
            description: 'Payment received',
            matched: false
          },
          confidence: 0.92
        }
      ]);
    } else {
      setCandidates([]);
    }
  }, [selectedRow]);

  const handleDateChange = (from: string, to: string) => {
    setFilters({ ...filters, from, to });
  };

  const handleKPIClick = (filter: string) => {
    if (filter === 'refunds') {
      setFilters({ ...filters, tags: ['refund'] });
    } else if (filter === 'recon') {
      setFilters({ ...filters, reconStatus: 'UNMATCHED' });
    }
  };

  const handleSavedViewClick = (view: string) => {
    if (view === 'pending-reconcile') {
      setFilters({ ...filters, reconStatus: 'UNMATCHED' });
    } else if (view === 'refunds') {
      setFilters({ ...filters, tags: ['refund'] });
    }
  };

  const handleMatch = async (ledgerId: string, bankTxId: string) => {
    try {
      const response = await fetch('/api/finance/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerId, bankTxId, matchedBy: 'user_01' })
      });

      if (response.ok) {
        const result = await response.json();
        setRows(rows.map(r => 
          r.id === ledgerId 
            ? { ...r, reconStatus: 'MATCHED', bankTransactionId: bankTxId, auditEventId: result.auditEventId }
            : r
        ));
        alert(`Matched • Invoice ${selectedRow?.invoiceId} → Bank ${bankTxId} (Audit ${result.auditEventId})`);
        setSelectedRow(null);
      }
    } catch (error) {
      alert('Failed to match transaction');
    }
  };

  const handleAdjustment = (ledgerId: string) => {
    alert('Adjustment modal would open here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeaderKPIs
        summary={summary}
        dateRange={{ from: filters.from, to: filters.to }}
        onDateChange={handleDateChange}
        onKPIClick={handleKPIClick}
      />

      <div className="grid grid-cols-12">
        <div className="col-span-3">
          <SalesFiltersPanel
            filters={filters}
            onChange={setFilters}
            onSavedViewClick={handleSavedViewClick}
          />
        </div>

        <div className="col-span-6 p-6">
          <SalesLedgerTable
            rows={rows}
            selectedId={selectedRow?.id}
            onRowClick={setSelectedRow}
          />
        </div>

        <div className="col-span-3">
          <ReconciliationPanel
            row={selectedRow}
            candidates={candidates}
            onMatch={handleMatch}
            onAdjustment={handleAdjustment}
          />
        </div>
      </div>
    </div>
  );
}
