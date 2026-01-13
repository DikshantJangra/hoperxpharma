const saltRepository = require('../repositories/saltRepository');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Salt Service - Business logic for salt management
 */
class SaltService {
    /**
     * Search salts with alias matching
     * @param {Object} options - Search options
     * @returns {Promise<{salts: Array, total: number}>}
     */
    async searchSalts(options) {
        const { query, includeAliases = true, limit = 20, page = 1 } = options;

        if (!query || query.trim().length < 2) {
            throw ApiError.badRequest('Search query must be at least 2 characters');
        }

        const result = await saltRepository.searchSalts(query, {
            includeAliases,
            limit: parseInt(limit, 10),
            page: parseInt(page, 10)
        });

        logger.debug(`Salt search for "${query}" returned ${result.salts.length} results`);

        return result;
    }

    /**
     * Create a new salt with duplicate checking
     * @param {Object} saltData - Salt data
     * @returns {Promise<Object>}
     */
    async createSalt(saltData) {
        // Validate required fields
        if (!saltData.name) {
            throw ApiError.badRequest('Salt name is required');
        }

        // Check for duplicates
        const duplicate = await saltRepository.findDuplicate(
            saltData.name,
            saltData.aliases || []
        );

        if (duplicate) {
            throw ApiError.conflict(
                `Salt already exists: "${duplicate.name}" (ID: ${duplicate.id})`
            );
        }

        // Create salt
        const salt = await saltRepository.createSalt({
            name: saltData.name.trim(),
            aliases: saltData.aliases ? saltData.aliases.map(a => a.trim()) : [],
            category: saltData.category,
            therapeuticClass: saltData.therapeuticClass,
            highRisk: saltData.highRisk || false,
            createdById: saltData.createdById
        });

        logger.info(`Salt created: ${salt.name} (ID: ${salt.id})`);

        return salt;
    }

    /**
     * Add alias to salt with duplicate checking
     * @param {string} saltId - Salt ID
     * @param {string} alias - Alias to add
     * @returns {Promise<Object>}
     */
    async addAlias(saltId, alias) {
        if (!alias || alias.trim().length < 2) {
            throw ApiError.badRequest('Alias must be at least 2 characters');
        }

        // Check if alias conflicts with existing salt name or alias
        const existing = await saltRepository.findByNameOrAlias(alias);
        if (existing && existing.id !== saltId) {
            throw ApiError.conflict(
                `Alias "${alias}" already used by salt "${existing.name}"`
            );
        }

        const salt = await saltRepository.addAlias(saltId, alias.trim());

        logger.info(`Alias "${alias}" added to salt ${salt.name} (ID: ${saltId})`);

        return salt;
    }

    /**
     * Remove alias from salt
     * @param {string} saltId - Salt ID
     * @param {string} alias - Alias to remove
     * @returns {Promise<Object>}
     */
    async removeAlias(saltId, alias) {
        const salt = await saltRepository.removeAlias(saltId, alias);

        logger.info(`Alias "${alias}" removed from salt ${salt.name} (ID: ${saltId})`);

        return salt;
    }

    /**
     * Mark salt as high risk
     * @param {string} saltId - Salt ID
     * @returns {Promise<Object>}
     */
    async markHighRisk(saltId) {
        const salt = await saltRepository.markHighRisk(saltId);

        logger.warn(`Salt marked as high risk: ${salt.name} (ID: ${saltId})`);

        return salt;
    }

    /**
     * Get salt by ID
     * @param {string} saltId - Salt ID
     * @returns {Promise<Object>}
     */
    async getSaltById(saltId) {
        const salt = await saltRepository.findById(saltId);

        if (!salt) {
            throw ApiError.notFound('Salt not found');
        }

        return salt;
    }

    /**
     * Find salt by name or alias
     * @param {string} name - Salt name or alias
     * @returns {Promise<Object|null>}
     */
    async findByNameOrAlias(name) {
        return await saltRepository.findByNameOrAlias(name);
    }

    /**
     * Get all salts with pagination
     * @param {Object} options - Query options
     * @returns {Promise<{salts: Array, total: number, page: number, totalPages: number}>}
     */
    async getAllSalts(options = {}) {
        const result = await saltRepository.findAll(options);

        const page = parseInt(options.page || 1, 10);
        const limit = parseInt(options.limit || 50, 10);
        const totalPages = Math.ceil(result.total / limit);

        return {
            ...result,
            page,
            totalPages
        };
    }

    /**
     * Get salt statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const [total, highRisk, withAliases] = await Promise.all([
            saltRepository.findAll({ limit: 1 }).then(r => r.total),
            saltRepository.findAll({ highRiskOnly: true, limit: 1 }).then(r => r.total),
            // Count salts with at least one alias
            prisma.salt.count({
                where: {
                    aliases: {
                        isEmpty: false
                    }
                }
            })
        ]);

        return {
            total,
            highRisk,
            withAliases,
            withoutAliases: total - withAliases
        };
    }
}

// Import prisma for statistics
const prisma = require('../db/prisma');

module.exports = new SaltService();
