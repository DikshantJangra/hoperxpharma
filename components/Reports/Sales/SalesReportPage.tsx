'use client';

import React, { useState, useEffect } from 'react';
import { DatePreset } from '@/lib/api/salesAnalytics';
import * as SalesAnalytics from '@/lib/api/salesAnalytics';
import EnhancedKPIBar from './EnhancedKPIBar';
import EnhancedInsightsPanel from './EnhancedInsightsPanel';
import TopProductsTable from './TopProductsTable';
import TopCustomersTable from './TopCustomersTable';
import TrendChart from './TrendChart';
import { HiOutlineCalendar, HiOutlineArrowDownTray, HiOutlineClock } from 'react-icons/hi2';

import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';

export default function EnterprisePageContent() {
  const { isPremium } = usePremiumTheme();
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [datePreset, setDatePreset] = useState<DatePreset>('7d');
  const [customStart, setCustomStart] = useState(weekAgo);
  const [customEnd, setCustomEnd] = useState(today);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reportData, setReportData] = useState<SalesAnalytics.CompleteReport | null>(null);
  const [marginStats, setMarginStats] = useState<import('@/types/finance').MarginStats | null>(null); // [NEW] Margin Stats State

  // Fetch complete report
  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch report and margin stats in parallel
        const { inventoryApi } = await import('@/lib/api/inventory'); // Ensure api is imported if needed, but here we need salesLedgerApi
        const salesLedgerApi = await import('@/lib/api/salesLedger');

        // Calculate date range for margin stats
        // Note: SalesAnalytics.processDateRange is private, so we might need to rely on the API request's internal dates or pass the presets.
        // But getMarginStats expects actual strings. 
        // For 'custom', we have customStart/End. For presets, we need to calculate.
        // Let's use the date logic from SalesPage/SalesLedgerService if possible, or just pass the same args if getMarginStats supported presets (it doesn't).
        // Simpler: Let's import the date helper or reimplement simple conversion here.

        const getDates = (preset: DatePreset, start: string, end: string) => {
          const today = new Date();
          let fromDate = new Date();
          let toDate = new Date();

          if (preset === 'custom') {
            return { from: start, to: end };
          }

          if (preset === 'today') {
            // fromDate is today 00:00
          } else if (preset === '7d') {
            fromDate.setDate(today.getDate() - 7);
          } else if (preset === '30d') {
            fromDate.setDate(today.getDate() - 30);
          } else if (preset === 'mtd') {
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          }
          return { from: fromDate.toISOString().split('T')[0], to: toDate.toISOString().split('T')[0] };
        };

        const { from, to } = getDates(datePreset, customStart, customEnd);

        const [data, marginData] = await Promise.all([
          SalesAnalytics.getCompleteReport({
            datePreset,
            customStart: datePreset === 'custom' ? customStart : undefined,
            customEnd: datePreset === 'custom' ? customEnd : undefined
          }),
          salesLedgerApi.getMarginStats(from, to)
        ]);

        setReportData(data);
        setMarginStats(marginData);
      } catch (err) {
        console.error('Failed to fetch sales report:', err);
        setError('Failed to load sales report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [datePreset, customStart, customEnd]);

  const handleExport = async () => {
    try {
      const result = await SalesAnalytics.exportReport(
        { datePreset, customStart, customEnd },
        'csv'
      );
      alert(`Export ready: ${result.filename}`);
    } catch (error) {
      alert('Failed to export report');
    }
  };

  const presets: { label: string; value: DatePreset }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: 'Month to Date', value: 'mtd' },
    { label: 'Custom', value: 'custom' }
  ];

  return (
    <div className={`min-h-screen transition-colors ${isPremium ? 'bg-slate-50' : 'bg-gray-50'}`}>
      {/* Header with Filters */}
      <div className={`border-b sticky top-0 z-10 transition-all ${isPremium
        ? 'bg-white/80 backdrop-blur-xl border-white/20 shadow-sm'
        : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive sales performance insights
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <HiOutlineArrowDownTray className="h-5 w-5" />
                Export
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <HiOutlineClock className="h-5 w-5" />
                Schedule Report
              </button>
            </div>
          </div>

          {/* Date Range Controls */}
          <div className="flex items-center gap-3">
            <HiOutlineCalendar className="h-5 w-5 text-gray-500" />
            <div className="flex gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setDatePreset(preset.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${datePreset === preset.value
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-2 ml-4">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State - Skeleton */}
      {isLoading && (
        <div className="animate-in fade-in duration-300">
          {/* KPI Skeleton */}
          <div className="px-6 py-6 bg-white border-b border-gray-200">
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 mb-3 bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-8 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded w-32 mb-2 bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 bg-[length:200%_100%] animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Chart Skeleton */}
              <div className="col-span-9 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-40 mb-6 bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-64 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer-slow"></div>
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className={`rounded-xl border p-6 animate-pulse ${isPremium
                  ? 'bg-white/40 border-white/20 shadow-sm'
                  : 'bg-white border-gray-200'
                  }`}>
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-48 mb-4 bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded flex-1 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: `${i * 100}ms` }}></div>
                        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: `${i * 100}ms` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights Skeleton */}
              <div className="col-span-3">
                <div className={`rounded-xl border p-6 animate-pulse sticky top-24 ${isPremium
                  ? 'bg-white/40 border-white/20 shadow-sm'
                  : 'bg-white border-gray-200'
                  }`}>
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32 mb-4 bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                        <div className="h-4 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded w-full mb-2 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: `${i * 150}ms` }}></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: `${i * 150}ms` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating pulse effect */}
          <div className="fixed bottom-8 right-8 pointer-events-none">
            <div className="relative">
              <div className="h-3 w-3 bg-blue-500 rounded-full animate-ping opacity-75"></div>
              <div className="h-3 w-3 bg-blue-600 rounded-full absolute top-0 left-0"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && reportData && (
        <>
          {/* KPI Row */}
          <EnhancedKPIBar
            kpis={reportData.kpis}
            marginStats={marginStats}
            onKPIClick={(kpi) => console.log('KPI clicked:', kpi)}
          />

          {/* Main Grid */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column - Charts & Tables */}
              <div className="col-span-9 space-y-6">
                {/* Trend Chart */}
                <TrendChart series={reportData.trends.current} />

                {/* Performance Tables */}
                <TopProductsTable
                  products={reportData.performance.topProducts}
                  onProductClick={(product) => console.log('Product clicked:', product)}
                />

                <TopCustomersTable
                  customers={reportData.performance.topCustomers}
                  onCustomerClick={(customer) => console.log('Customer clicked:', customer)}
                />
              </div>

              {/* Right Column - Insights */}
              <div className="col-span-3">
                <EnhancedInsightsPanel
                  insights={reportData.insights}
                  onInsightClick={(insight) => console.log('Insight clicked:', insight)}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !reportData && !error && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No data available for this period</p>
            <button
              onClick={() => setDatePreset('7d')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Last 7 Days
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
