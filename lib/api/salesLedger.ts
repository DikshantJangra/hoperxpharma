import { apiClient } from './client';
import { LedgerRow, SalesSummary, SalesFilters } from '@/types/finance';

/**
 * Sales Ledger API Client
 * Functions for fetching sales ledger data
 */

export interface SalesLedgerResponse {
    rows: LedgerRow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Get sales ledger with filters
 */
export async function getLedger(filters: SalesFilters): Promise<SalesLedgerResponse> {
    const params = new URLSearchParams();

    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters.reconStatus) params.append('reconStatus', filters.reconStatus);
    if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => params.append('tags', tag));
    }

    const result = await apiClient.get(`/sales/ledger?${params.toString()}`);
    return result.data;
}

/**
 * Get sales summary for date range
 */
export async function getSummary(from: string, to: string): Promise<SalesSummary> {
    const params = new URLSearchParams();
    params.append('from', from);
    params.append('to', to);

    const result = await apiClient.get(`/sales/ledger/summary?${params.toString()}`);
    return result.data;
}

/**
 * Get margin stats for date range (Owner/Admin only)
 */
export async function getMarginStats(from: string, to: string): Promise<import('@/types/finance').MarginStats | null> {
    try {
        const params = new URLSearchParams();
        params.append('startDate', from);
        params.append('endDate', to);
        const result = await apiClient.get(`/margin/stats?${params.toString()}`);
        return result.data;
    } catch (e) {
        // Return null if 403 or other error, handled gracefully by UI
        return null;
    }
}

/**
 * Estimate margin for provisional items (Owner/Admin only)
 */
export async function estimateMargin(items: any[]): Promise<import('@/types/finance').MarginStats | null> {
    try {
        const result = await apiClient.post('/margin/estimate', { items });
        return result.data;
    } catch (e) {
        // Return null if 403 or other error
        return null;
    }
}

/**
 * Get match candidates for reconciliation
 */
export async function getMatchCandidates(ledgerId: string): Promise<any[]> {
    const result = await apiClient.get(`/sales/ledger/${ledgerId}/matches`);
    return result.data;
}
