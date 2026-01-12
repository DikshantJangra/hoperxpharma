const salesLedgerRepository = require('../../repositories/salesLedgerRepository');

/**
 * Sales Ledger Service
 * Business logic for sales ledger operations
 */
class SalesLedgerService {
    /**
     * Get sales ledger with filters
     * @param {Object} params - { storeId, from, to, paymentMethod, reconStatus, tags, page, limit }
     * @returns {Promise<Object>} { rows, total, summary }
     */
    async getLedger({
        storeId,
        from,
        to,
        paymentMethod,
        reconStatus,
        tags,
        sortBy = 'date',
        sortDirection = 'desc',
        page = 1,
        limit = 50
    }) {
        // Default date range: last 7 days
        const endDate = to ? new Date(to) : new Date();
        const startDate = from
            ? new Date(from)
            : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Set end of day for endDate
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        const offset = (page - 1) * limit;

        const { rows, total } = await salesLedgerRepository.getLedger({
            storeId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            paymentMethod,
            reconStatus,
            tags,
            sortBy,
            sortDirection,
            limit,
            offset
        });

        return {
            rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get sales summary for date range
     * @param {Object} params - { storeId, from, to }
     * @returns {Promise<Object>} Summary metrics
     */
    async getSummary({ storeId, from, to }) {
        // Default date range: last 7 days
        const endDate = to ? new Date(to) : new Date();
        const startDate = from
            ? new Date(from)
            : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Set end of day for endDate
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);

        const summary = await salesLedgerRepository.getSummary({
            storeId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        return summary;
    }

    /**
     * Get match candidates for reconciliation (placeholder for future)
     * @param {Object} params - { ledgerId, storeId }
     * @returns {Promise<Array>} Bank transaction match candidates
     */
    async getMatchCandidates({ ledgerId, storeId }) {
        // Placeholder: In future, this will query bank transactions
        // and use ML/rules to find potential matches
        return [];
    }
}

module.exports = new SalesLedgerService();
