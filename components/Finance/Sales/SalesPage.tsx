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
    revenue: 0,
    cash: 0,
    card: 0,
    upi: 0,
    wallet: 0,
    outstanding: 0,
    refunds: { count: 0, amount: 0 },
    reconRate: 0
  });

  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
        setSummary({
            revenue: 0,
            cash: 0,
            card: 0,
            upi: 0,
            wallet: 0,
            outstanding: 0,
            refunds: { count: 0, amount: 0 },
            reconRate: 0
        });
        setRows([]);
        setIsLoading(false);
    }, 1500)
    return () => clearTimeout(timer);
  }, [filters]); // Re-fetch when filters change


  useEffect(() => {
    if (selectedRow && selectedRow.reconStatus === 'UNMATCHED') {
      // Simulate fetching candidates
      setCandidates([]);
    } else {
      setCandidates([]);
    }
  }, [selectedRow, isLoading]); // Also depend on isLoading to reset candidates when main data loads


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
    // Simulate API call
    alert(`Matching ledger ${ledgerId} to bank transaction ${bankTxId}...`);
    setRows(prevRows => prevRows.map(r => 
      r.id === ledgerId 
        ? { ...r, reconStatus: 'MATCHED', bankTransactionId: bankTxId }
        : r
    ));
    setSelectedRow(null);
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
        isLoading={isLoading}
      />

      <div className="grid grid-cols-12">
        <div className="col-span-3">
          <SalesFiltersPanel
            filters={filters}
            onChange={setFilters}
            onSavedViewClick={handleSavedViewClick}
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-6 p-6">
          <SalesLedgerTable
            rows={rows}
            selectedId={selectedRow?.id}
            onRowClick={setSelectedRow}
            isLoading={isLoading}
          />
        </div>

        <div className="col-span-3">
          <ReconciliationPanel
            row={selectedRow}
            candidates={candidates}
            onMatch={handleMatch}
            onAdjustment={handleAdjustment}
            isLoading={isLoading && !selectedRow}
          />
        </div>
      </div>
    </div>
  );
}
