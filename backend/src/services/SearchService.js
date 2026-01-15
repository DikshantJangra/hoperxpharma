"use strict";
/**
 * SearchService - Medicine Search Operations
 *
 * Handles all search operations using Typesense for fast, fuzzy, and prefix-based searches.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchService = void 0;
const client_1 = require("../lib/typesense/client");
class SearchService {
    constructor() {
        this.collectionName = client_1.typesenseConfig.collectionName;
    }
    /**
     * Search for medicines with fuzzy matching and filters
     * Requirements: 3.1, 3.2, 3.4, 3.5
     */
    async search(searchQuery) {
        const { query, filters = {}, limit = 20, offset = 0, boost = { name: 3, composition: 2, manufacturer: 1 }, } = searchQuery;
        // Build filter string
        const filterConditions = [];
        if (filters.manufacturer) {
            filterConditions.push(`manufacturerName:=${filters.manufacturer}`);
        }
        if (filters.schedule) {
            filterConditions.push(`schedule:=${filters.schedule}`);
        }
        if (filters.requiresPrescription !== undefined) {
            filterConditions.push(`requiresPrescription:=${filters.requiresPrescription}`);
        }
        if (filters.form) {
            filterConditions.push(`form:=${filters.form}`);
        }
        // Filter out discontinued medicines by default (Requirements 3.5)
        if (filters.discontinued === false || filters.discontinued === undefined) {
            filterConditions.push(`status:!=[DISCONTINUED]`);
        }
        const searchParams = {
            q: query,
            query_by: 'name,genericName,compositionText,manufacturerName,primaryBarcode',
            query_by_weights: `${boost.name},${boost.name},${boost.composition},${boost.manufacturer},2`,
            filter_by: filterConditions.length > 0 ? filterConditions.join(' && ') : undefined,
            per_page: limit,
            page: Math.floor(offset / limit) + 1,
            prefix: true,
            num_typos: 2, // Fuzzy matching with up to 2 typos (Requirements 3.2)
            typo_tokens_threshold: 1,
        };
        try {
            const results = await client_1.typesenseClient
                .collections(this.collectionName)
                .documents()
                .search(searchParams);
            if (!results.hits) {
                return [];
            }
            return results.hits.map((hit) => ({
                ...hit.document,
                score: hit.text_match_info?.score || 0,
            }));
        }
        catch (error) {
            console.error('Search error:', error);
            throw new Error(`Search failed: ${error}`);
        }
    }
    /**
     * Autocomplete search with prefix matching
     * Requirements: 3.3
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
            boost: { name: 5, composition: 2, manufacturer: 1 }, // Higher boost for name in autocomplete
        });
        return {
            suggestions: results,
            count: results.length,
        };
    }
    /**
     * Search by composition/salt
     * Requirements: 3.6
     */
    async searchByComposition(salt) {
        const searchParams = {
            q: salt,
            query_by: 'compositionText',
            filter_by: 'status:!=[DISCONTINUED]',
            per_page: 20,
            prefix: false,
            num_typos: 1,
        };
        try {
            const results = await client_1.typesenseClient
                .collections(this.collectionName)
                .documents()
                .search(searchParams);
            if (!results.hits) {
                return [];
            }
            return results.hits.map((hit) => ({
                ...hit.document,
                score: hit.text_match_info?.score || 0,
            }));
        }
        catch (error) {
            console.error('Search by composition error:', error);
            throw new Error(`Search by composition failed: ${error}`);
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
            boost: { name: 1, composition: 1, manufacturer: 5 },
        });
    }
    /**
     * Get index statistics
     */
    async getIndexStats() {
        try {
            const collection = await client_1.typesenseClient
                .collections(this.collectionName)
                .retrieve();
            return {
                name: collection.name,
                numDocuments: collection.num_documents,
                createdAt: collection.created_at,
            };
        }
        catch (error) {
            console.error('Failed to get index stats:', error);
            throw error;
        }
    }
}
exports.SearchService = SearchService;
// Export singleton instance
exports.searchService = new SearchService();
