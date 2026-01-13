const prisma = require('../db/prisma');

/**
 * Salt Repository - Data access layer for salt operations
 */
class SaltRepository {
    /**
     * Search salts with name and alias matching
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @param {boolean} options.includeAliases - Whether to search in aliases
     * @param {number} options.limit - Maximum results to return
     * @param {number} options.page - Page number for pagination
     * @returns {Promise<{salts: Array, total: number}>}
     */
    async searchSalts(query, options = {}) {
        const {
            includeAliases = true,
            limit = 20,
            page = 1
        } = options;

        const skip = (page - 1) * limit;
        const searchQuery = query.toLowerCase().trim();

        // Build where clause for case-insensitive search
        const where = {
            OR: [
                {
                    name: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }
                }
            ]
        };

        // Add alias search if enabled
        if (includeAliases) {
            where.OR.push({
                aliases: {
                    hasSome: [searchQuery] // Exact match in array
                }
            });

            // Also search for partial matches in aliases using raw SQL for better performance
            // This will be handled by a separate query if needed
        }

        const [salts, total] = await Promise.all([
            prisma.salt.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { name: 'asc' }
                ],
                select: {
                    id: true,
                    name: true,
                    aliases: true,
                    category: true,
                    therapeuticClass: true,
                    highRisk: true,
                    createdAt: true,
                }
            }),
            prisma.salt.count({ where })
        ]);

        return { salts, total };
    }

    /**
     * Find salt by exact name or alias match
     * @param {string} name - Salt name to search for
     * @returns {Promise<Object|null>}
     */
    async findByNameOrAlias(name) {
        if (!name) return null;

        const normalizedName = name.toLowerCase().trim();

        // First try exact name match
        let salt = await prisma.salt.findFirst({
            where: {
                name: {
                    equals: normalizedName,
                    mode: 'insensitive'
                }
            }
        });

        // If not found, search in aliases
        if (!salt) {
            // Use raw SQL for case-insensitive array search
            const results = await prisma.$queryRaw`
                SELECT * FROM "Salt"
                WHERE EXISTS (
                    SELECT 1 FROM unnest(aliases) AS alias
                    WHERE LOWER(alias) = ${normalizedName}
                )
                LIMIT 1
            `;

            salt = results.length > 0 ? results[0] : null;
        }

        return salt;
    }

    /**
     * Create a new salt
     * @param {Object} saltData - Salt data
     * @returns {Promise<Object>}
     */
    async createSalt(saltData) {
        return await prisma.salt.create({
            data: {
                name: saltData.name,
                aliases: saltData.aliases || [],
                category: saltData.category,
                therapeuticClass: saltData.therapeuticClass,
                highRisk: saltData.highRisk || false,
                createdById: saltData.createdById
            }
        });
    }

    /**
     * Add alias to existing salt
     * @param {string} saltId - Salt ID
     * @param {string} alias - Alias to add
     * @returns {Promise<Object>}
     */
    async addAlias(saltId, alias) {
        const salt = await prisma.salt.findUnique({
            where: { id: saltId }
        });

        if (!salt) {
            throw new Error('Salt not found');
        }

        // Check if alias already exists
        const normalizedAlias = alias.toLowerCase().trim();
        const existingAliases = salt.aliases.map(a => a.toLowerCase());

        if (existingAliases.includes(normalizedAlias)) {
            return salt; // Already exists, no change needed
        }

        // Add new alias
        return await prisma.salt.update({
            where: { id: saltId },
            data: {
                aliases: {
                    push: alias
                }
            }
        });
    }

    /**
     * Remove alias from salt
     * @param {string} saltId - Salt ID
     * @param {string} alias - Alias to remove
     * @returns {Promise<Object>}
     */
    async removeAlias(saltId, alias) {
        const salt = await prisma.salt.findUnique({
            where: { id: saltId }
        });

        if (!salt) {
            throw new Error('Salt not found');
        }

        const updatedAliases = salt.aliases.filter(
            a => a.toLowerCase() !== alias.toLowerCase()
        );

        return await prisma.salt.update({
            where: { id: saltId },
            data: {
                aliases: updatedAliases
            }
        });
    }

    /**
     * Mark salt as high risk
     * @param {string} saltId - Salt ID
     * @returns {Promise<Object>}
     */
    async markHighRisk(saltId) {
        return await prisma.salt.update({
            where: { id: saltId },
            data: {
                highRisk: true
            }
        });
    }

    /**
     * Get salt by ID
     * @param {string} saltId - Salt ID
     * @returns {Promise<Object|null>}
     */
    async findById(saltId) {
        return await prisma.salt.findUnique({
            where: { id: saltId },
            include: {
                drugSaltLinks: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                manufacturer: true
                            }
                        }
                    },
                    take: 10 // Limit to prevent large responses
                }
            }
        });
    }

    /**
     * Get all salts with pagination
     * @param {Object} options - Query options
     * @returns {Promise<{salts: Array, total: number}>}
     */
    async findAll(options = {}) {
        const {
            page = 1,
            limit = 50,
            highRiskOnly = false,
            category = null
        } = options;

        const skip = (page - 1) * limit;

        const where = {};
        if (highRiskOnly) {
            where.highRisk = true;
        }
        if (category) {
            where.category = category;
        }

        const [salts, total] = await Promise.all([
            prisma.salt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.salt.count({ where })
        ]);

        return { salts, total };
    }

    /**
     * Check for duplicate salt by name or aliases
     * @param {string} name - Salt name
     * @param {Array<string>} aliases - Salt aliases
     * @returns {Promise<Object|null>}
     */
    async findDuplicate(name, aliases = []) {
        const normalizedName = name.toLowerCase().trim();
        const normalizedAliases = aliases.map(a => a.toLowerCase().trim());

        // Check if name matches existing salt name or alias
        const existingByName = await this.findByNameOrAlias(normalizedName);
        if (existingByName) {
            return existingByName;
        }

        // Check if any alias matches existing salt name or alias
        for (const alias of normalizedAliases) {
            const existingByAlias = await this.findByNameOrAlias(alias);
            if (existingByAlias) {
                return existingByAlias;
            }
        }

        return null;
    }
}

module.exports = new SaltRepository();
