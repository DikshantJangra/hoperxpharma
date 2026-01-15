/**
 * PostgreSQL-based Search Service for Medicine Master
 * 
 * Uses PostgreSQL full-text search instead of Typesense
 * No additional infrastructure needed - uses existing database
 * 
 * Performance: Good enough for 253K medicines with proper indexes
 * Cost: $0 (uses existing database)
 * Reliability: High (database already monitored)
 */

const prisma = require('../db/prisma');

class PostgresSearchService {
    /**
     * Search for medicines with fuzzy matching and filters
     * Uses PostgreSQL ILIKE for case-insensitive search
     */
    async search(searchQuery) {
        const {
            query,
            filters = {},
            limit = 20,
            offset = 0,
        } = searchQuery;

        // Build filter conditions
        const where = {
            status: filters.discontinued === true ? undefined : { not: 'DISCONTINUED' },
            ...(filters.manufacturer && { manufacturerName: { contains: filters.manufacturer, mode: 'insensitive' } }),
            ...(filters.schedule && { schedule: filters.schedule }),
            ...(filters.requiresPrescription !== undefined && { requiresPrescription: filters.requiresPrescription }),
            ...(filters.form && { form: { contains: filters.form, mode: 'insensitive' } }),
        };

        // Search across multiple fields
        if (query && query.trim()) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { genericName: { contains: query, mode: 'insensitive' } },
                { compositionText: { contains: query, mode: 'insensitive' } },
                { manufacturerName: { contains: query, mode: 'insensitive' } },
                { primaryBarcode: { equals: query } }, // Exact match for barcode
            ];
        }

        try {
            const medicines = await prisma.medicineMaster.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: [
                    { usageCount: 'desc' }, // Most used first
                    { name: 'asc' },
                ],
                include: {
                    saltLinks: {
                        include: {
                            salt: true,
                        },
                    },
                },
            });

            // Transform to match expected format
            return medicines.map(medicine => ({
                ...medicine,
                score: 1, // PostgreSQL doesn't provide relevance score easily
            }));
        } catch (error) {
            console.error('PostgreSQL search error:', error);
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Autocomplete search with prefix matching
     */
    async autocomplete(prefix, options = {}) {
        const { limit = 10, filters = {} } = options;

        if (prefix.length < 2) {
            return { suggestions: [], count: 0 };
        }

        const results = await this.search({
            query: prefix,
            filters,
            limit,
        });

        return {
            suggestions: results,
            count: results.length,
        };
    }

    /**
     * Search by composition/salt
     */
    async searchByComposition(salt) {
        try {
            const medicines = await prisma.medicineMaster.findMany({
                where: {
                    status: { not: 'DISCONTINUED' },
                    compositionText: {
                        contains: salt,
                        mode: 'insensitive',
                    },
                },
                take: 20,
                orderBy: { usageCount: 'desc' },
                include: {
                    saltLinks: {
                        include: {
                            salt: true,
                        },
                    },
                },
            });

            return medicines.map(medicine => ({
                ...medicine,
                score: 1,
            }));
        } catch (error) {
            console.error('Search by composition error:', error);
            throw new Error(`Search by composition failed: ${error.message}`);
        }
    }

    /**
     * Search by manufacturer
     */
    async searchByManufacturer(manufacturer) {
        return this.search({
            query: manufacturer,
            filters: { discontinued: false },
            limit: 20,
        });
    }

    /**
     * Get index statistics
     */
    async getIndexStats() {
        try {
            const count = await prisma.medicineMaster.count();
            
            return {
                name: 'medicines',
                numDocuments: count,
                createdAt: Date.now(),
            };
        } catch (error) {
            console.error('Failed to get index stats:', error);
            throw error;
        }
    }

    /**
     * Search by barcode (exact match)
     */
    async searchByBarcode(barcode) {
        try {
            const medicine = await prisma.medicineMaster.findFirst({
                where: {
                    primaryBarcode: barcode,
                    status: { not: 'DISCONTINUED' },
                },
                include: {
                    saltLinks: {
                        include: {
                            salt: true,
                        },
                    },
                },
            });

            return medicine ? [{ ...medicine, score: 1 }] : [];
        } catch (error) {
            console.error('Barcode search error:', error);
            throw new Error(`Barcode search failed: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = {
    PostgresSearchService,
    postgresSearchService: new PostgresSearchService(),
};
