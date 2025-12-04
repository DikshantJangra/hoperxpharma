const { PAGINATION } = require('./constants');

/**
 * Query Parser Utility
 * Provides functions to parse and validate query parameters for pagination, sorting, and filtering
 */

/**
 * Parse pagination parameters from query
 * @param {Object} query - Express req.query object
 * @returns {Object} { page, limit, skip }
 */
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        PAGINATION.MAX_LIMIT,
        Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * Parse sort parameters from query
 * Supports two formats:
 * 1. ?sortBy=name&sortOrder=asc
 * 2. ?sort=name:asc,createdAt:desc (multi-field)
 * 
 * @param {Object} query - Express req.query object
 * @param {Array<string>} allowedFields - Whitelist of sortable fields (empty array = allow all)
 * @returns {Array<{field: string, order: string}>|null} Array of sort configs or null
 */
function parseSort(query, allowedFields = []) {
    const sortBy = query.sortBy || query.sort;
    const sortOrder = query.sortOrder || 'asc';

    if (!sortBy) {
        return null;
    }

    // Handle comma-separated multi-field sorting: "name:asc,createdAt:desc"
    if (sortBy.includes(',')) {
        const sorts = sortBy.split(',').map(s => {
            const [field, order = 'asc'] = s.trim().split(':');
            return { field, order: order.toLowerCase() };
        });

        // Validate all fields
        const validSorts = sorts.filter(s =>
            allowedFields.length === 0 || allowedFields.includes(s.field)
        );

        return validSorts.length > 0 ? validSorts : null;
    }

    // Handle single field: ?sortBy=name&sortOrder=desc
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
        return null; // Invalid field
    }

    return [{ field: sortBy, order: sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc' }];
}

/**
 * Build Prisma orderBy clause from parsed sort configuration
 * @param {Array<{field: string, order: string}>|null} sortConfig - Parsed sort config
 * @param {Object} defaultSort - Default sort to use if no config provided
 * @returns {Object|Array<Object>} Prisma orderBy clause
 */
function buildOrderBy(sortConfig, defaultSort = { createdAt: 'desc' }) {
    if (!sortConfig || sortConfig.length === 0) {
        return defaultSort;
    }

    if (sortConfig.length === 1) {
        return { [sortConfig[0].field]: sortConfig[0].order };
    }

    // Multiple fields - return array for Prisma
    return sortConfig.map(s => ({ [s.field]: s.order }));
}

/**
 * Parse filter parameters from query
 * @param {Object} query - Express req.query object
 * @param {Array<string>} allowedFilters - Whitelist of filterable fields
 * @returns {Object} Filtered parameters
 */
function parseFilters(query, allowedFilters = []) {
    const filters = {};

    allowedFilters.forEach(field => {
        if (query[field] !== undefined && query[field] !== '') {
            filters[field] = query[field];
        }
    });

    return filters;
}

/**
 * Build pagination metadata for API response
 * @param {number} total - Total count of records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {Object} Pagination metadata
 */
function buildPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

module.exports = {
    parsePagination,
    parseSort,
    buildOrderBy,
    parseFilters,
    buildPaginationMeta,
};
