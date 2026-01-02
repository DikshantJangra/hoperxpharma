'use client';

import React, { useState, useEffect } from 'react';
import { LedgerRow, SalesSummary, SalesFilters, MatchCandidate } from '@/types/finance';
import SalesHeaderKPIs from './SalesHeaderKPIs';
import SalesFiltersPanel from './SalesFiltersPanel';
import SalesLedgerTable from './SalesLedgerTable';
import ReconciliationPanel from './ReconciliationPanel';
import * as salesLedgerApi from '@/lib/api/salesLedger';

interface SalesPageProps {
  storeId: string;
}

export default function SalesPage({ storeId }: SalesPageProps) {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filters, setFilters] = useState<SalesFilters>({
    from: weekAgo,
    to: today,
    storeId
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
  const [error, setError] = useState<string | null>(null);

  const [selectedRow, setSelectedRow] = useState<LedgerRow | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);

  // Fetch summary and ledger data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch summary and ledger in parallel
        const [summaryData, ledgerData] = await Promise.all([
          salesLedgerApi.getSummary(filters.from!, filters.to!),
          salesLedgerApi.getLedger(filters)
        ]);

        setSummary(summaryData);
        setRows(ledgerData.rows);
      } catch (err: any) {
        console.error('Error fetching sales data:', err);
        setError(err.message || 'Failed to load sales data');
        // Set empty data on error
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
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have required filters
    if (filters.from && filters.to) {
      fetchData();
    }
  }, [filters]);

  // Fetch match candidates when row is selected
  useEffect(() => {
    const fetchCandidates = async () => {
      if (selectedRow && selectedRow.reconStatus === 'UNMATCHED') {
        try {
          const matchData = await salesLedgerApi.getMatchCandidates(selectedRow.id);
          setCandidates(matchData);
        } catch (err) {
          console.error('Error fetching match candidates:', err);
          setCandidates([]);
        }
      } else {
        setCandidates([]);
      }
    };

    fetchCandidates();
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
    // TODO: Implement actual reconciliation API call
    alert(`Matching ledger ${ledgerId} to bank transaction ${bankTxId}...`);
    setRows(prevRows => prevRows.map(r =>
      r.id === ledgerId
        ? { ...r, reconStatus: 'MATCHED', bankTransactionId: bankTxId }
        : r
    ));
    setSelectedRow(null);
  };

  const handleAdjustment = (ledgerId: string) => {
    // TODO: Implement adjustment modal
    alert('Adjustment modal would open here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeaderKPIs
        summary={summary}
        dateRange={{ from: filters.from!, to: filters.to! }}
        onDateChange={handleDateChange}
        onKPIClick={handleKPIClick}
        isLoading={isLoading}
      />

      {error && (
        <div className="mx-6 my-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

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
