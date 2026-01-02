/**
 * Pagination Helper
 * Standardized pagination for all list endpoints
 */

/**
 * Parse pagination parameters from request query
 */
function parsePaginationParams(query) {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
}

/**
 * Parse sorting parameters from request query
 */
function parseSortParams(query, defaultSort = { createdAt: 'desc' }) {
    if (!query.sortBy) {
        return defaultSort;
    }

    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    return {
        [query.sortBy]: sortOrder,
    };
}

/**
 * Create paginated response
 */
function createPaginatedResponse(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
        },
    };
}

/**
 * Get Prisma pagination options
 */
function getPaginationOptions(query) {
    const { skip, limit } = parsePaginationParams(query);
    const orderBy = parseSortParams(query);

    return {
        skip,
        take: limit,
        orderBy,
    };
}

/**
 * Execute paginated query
 * Handles both count and data fetch in parallel
 */
async function executePaginatedQuery(prismaModel, where, query, include = {}) {
    const { page, limit, skip } = parsePaginationParams(query);
    const orderBy = parseSortParams(query);

    // Execute count and data fetch in parallel
    const [total, data] = await Promise.all([
        prismaModel.count({ where }),
        prismaModel.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include,
        }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
}

module.exports = {
    parsePaginationParams,
    parseSortParams,
    createPaginatedResponse,
    getPaginationOptions,
    executePaginatedQuery,
};
