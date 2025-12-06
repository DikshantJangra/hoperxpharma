'use client';

import React, { useState, useEffect } from 'react';
import { SalesReportData, SalesFilters, DatePreset } from '@/types/reports';
import { getSalesReport } from '@/lib/api/reports';
import SalesHeader from './SalesHeader';
import KPIBar from './KPIBar';
import FiltersPanel from './FiltersPanel';
import TrendChart from './TrendChart';
import TopTable from './TopTable';
import InsightPanel from './InsightPanel';
import ExportModal from './ExportModal';

export default function SalesReportPage() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filters, setFilters] = useState<SalesFilters>({
    from: weekAgo,
    to: today
  });

  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState<SalesReportData>({
    meta: { from: weekAgo, to: today },
    kpis: {
      revenue: 0,
      orders: 0,
      aov: 0,
      refunds: 0,
      returnRate: 0,
      delta: {
        revenue: 0,
        orders: 0,
        aov: 0,
        refunds: 0
      }
    },
    series: [],
    breakdown: {
      byStore: [],
      bySKU: [],
      byCategory: []
    }
  });

  // Fetch report data when filters change
  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSalesReport(filters);
        setReportData(data);
      } catch (err) {
        console.error('Failed to fetch sales report:', err);
        setError('Failed to load sales report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [filters]);

  const handleDateChange = (from: string, to: string) => {
    setFilters({ ...filters, from, to });
  };

  const handlePresetClick = (preset: DatePreset) => {
    const today = new Date();
    let from = new Date();

    switch (preset) {
      case 'today':
        from = today;
        break;
      case '7d':
        from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'mtd':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;
    }

    setFilters({ ...filters, from: from.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
  };

  const handleKPIClick = (kpi: string) => {
    console.log('KPI clicked:', kpi);
  };

  const handleExport = async (format: string, includeRaw: boolean) => {
    try {
      const response = await fetch('/api/reports/sales/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, format, includeRaw })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Export job started • Job ${result.jobId}`);
      }
    } catch (error) {
      alert('Failed to start export');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesHeader
        dateRange={{ from: filters.from, to: filters.to }}
        onDateChange={handleDateChange}
        onPresetClick={handlePresetClick}
        onExportClick={() => setShowExportModal(true)}
        onScheduleClick={() => alert('Schedule modal would open')}
      />

      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading report data...</p>
          </div>
        </div>
      ) : (
        <>
          <KPIBar kpis={reportData.kpis} onKPIClick={handleKPIClick} />

          <div className="grid grid-cols-12">
            <div className="col-span-3">
              <FiltersPanel filters={filters} onChange={setFilters} />
            </div>

            <div className="col-span-6 p-6 space-y-6">
              <TrendChart series={reportData.series} />
              <TopTable items={reportData.breakdown.bySKU} title="Top SKUs" />
              <TopTable items={reportData.breakdown.byStore} title="Top Stores" />
            </div>

            <div className="col-span-3">
              <InsightPanel
                onDrillClick={() => alert('Drill drawer would open')}
                onExportClick={() => setShowExportModal(true)}
              />
            </div>
          </div>
        </>
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </div>
  );
}
