// Sales API extension for dispense-based sales

import { baseFetch } from '../api-client';

export const dispenseBasedSales = {
    /**
     * Create sale from dispense (NEW ARCHITECTURE)
     * Clinical data is locked, financial data is editable
     */
    createSaleFromDispense: async (dispenseId: string, saleData: any) => {
        return await baseFetch('/api/v1/sales/from-dispense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dispenseId,
                ...saleData,
            }),
        });
    },

    /**
     * Quick Sale Mode
     * Auto-creates ONE_TIME prescription + dispense in background
     */
    createQuickSale: async (saleData: any) => {
        return await baseFetch('/api/v1/sales/quick', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData),
        });
    },

    /**
     * Get ready dispenses for POS import
     */
    getReadyDispenses: async (storeId?: string) => {
        const params = new URLSearchParams();
        if (storeId) params.append('storeId', storeId);
        params.append('status', 'READY');

        return await baseFetch(`/api/v1/dispenses?${params.toString()}`);
    },
};
