export interface SalesKPIs {
  revenue: number;
  orders: number;
  aov: number;
  refunds: number;
  returnRate: number;
  delta: {
    revenue: number;
    orders: number;
    aov: number;
    refunds: number;
  };
}

export interface SeriesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  aov: number;
  refunds: number;
}

export interface BreakdownItem {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  delta: number;
  trend: number[];
}

export interface SalesReportData {
  meta: { from: string; to: string };
  kpis: SalesKPIs;
  series: SeriesDataPoint[];
  breakdown: {
    byStore: BreakdownItem[];
    bySKU: BreakdownItem[];
    byCategory: BreakdownItem[];
  };
}

export interface SalesFilters {
  from: string;
  to: string;
  storeId?: string;
  channel?: string;
  category?: string;
  sku?: string;
}

export type DatePreset = 'today' | '7d' | '30d' | 'mtd' | 'lastMonth' | 'custom';
