'use client';

import React, { useState } from 'react';
import { SalesReportData, SalesFilters, DatePreset } from '@/types/reports';
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

  const [reportData] = useState<SalesReportData>({
    meta: { from: weekAgo, to: today },
    kpis: {
      revenue: 245600,
      orders: 1234,
      aov: 199.03,
      refunds: 4200,
      returnRate: 1.7,
      delta: {
        revenue: 15.2,
        orders: 8.5,
        aov: 6.2,
        refunds: -2.1
      }
    },
    series: [
      { date: '2025-11-08', revenue: 32000, orders: 165, aov: 194, refunds: 500 },
      { date: '2025-11-09', revenue: 28000, orders: 142, aov: 197, refunds: 400 },
      { date: '2025-11-10', revenue: 35000, orders: 178, aov: 197, refunds: 600 },
      { date: '2025-11-11', revenue: 38000, orders: 195, aov: 195, refunds: 700 },
      { date: '2025-11-12', revenue: 42000, orders: 210, aov: 200, refunds: 800 },
      { date: '2025-11-13', revenue: 36000, orders: 180, aov: 200, refunds: 600 },
      { date: '2025-11-14', revenue: 34600, orders: 164, aov: 211, refunds: 600 }
    ],
    breakdown: {
      byStore: [
        { id: 's1', name: 'Main Store', revenue: 145000, orders: 720, delta: 18.5, trend: [0.6, 0.7, 0.8, 0.9, 1.0] },
        { id: 's2', name: 'Branch 1', revenue: 100600, orders: 514, delta: 10.2, trend: [0.5, 0.6, 0.7, 0.8, 0.9] }
      ],
      bySKU: [
        { id: 'sku1', name: 'Paracetamol 500mg', revenue: 45000, orders: 890, delta: 12.3, trend: [0.7, 0.8, 0.9, 1.0, 0.95] },
        { id: 'sku2', name: 'Amoxicillin 250mg', revenue: 38000, orders: 450, delta: 8.5, trend: [0.6, 0.7, 0.8, 0.85, 0.9] },
        { id: 'sku3', name: 'Cetirizine 10mg', revenue: 32000, orders: 980, delta: -3.2, trend: [1.0, 0.95, 0.9, 0.85, 0.8] }
      ],
      byCategory: [
        { id: 'cat1', name: 'Tablets', revenue: 125000, orders: 1850, delta: 15.0, trend: [0.7, 0.8, 0.9, 0.95, 1.0] },
        { id: 'cat2', name: 'Syrups', revenue: 85000, orders: 650, delta: 10.5, trend: [0.6, 0.7, 0.8, 0.85, 0.9] }
      ]
    }
  });

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

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </div>
  );
}
