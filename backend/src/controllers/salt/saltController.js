const prisma = require('../../db/prisma');
const ApiError = require('../../utils/ApiError');

/**
 * Salt Controller - Handles salt master management and drug-salt relationships
 */

/**
 * Search salts by name or category
 * Enhanced with alias matching
 * @route GET /api/v1/salt/search
 */
exports.searchSalts = async (req, res, next) => {
    try {
        const { q, category, highRisk, limit = 50, includeAliases = 'true' } = req.query;

        const where = {};

        if (q) {
            const searchQuery = q.toLowerCase().trim();

            if (includeAliases === 'true') {
                // Search in both name and aliases
                where.OR = [
                    {
                        name: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    }
                ];

                // Use raw SQL for case-insensitive alias search
                const aliasResults = await prisma.$queryRaw`
                    SELECT * FROM "Salt"
                    WHERE EXISTS (
                        SELECT 1 FROM unnest(aliases) AS alias
                        WHERE LOWER(alias) LIKE ${`%${searchQuery}%`}
                    )
                    ${category ? prisma.Prisma.sql`AND category = ${category}` : prisma.Prisma.empty}
                    ${highRisk !== undefined ? prisma.Prisma.sql`AND "highRisk" = ${highRisk === 'true'}` : prisma.Prisma.empty}
                    ORDER BY name ASC
                    LIMIT ${parseInt(limit)}
                `;

                // Also get name matches
                const nameResults = await prisma.salt.findMany({
                    where: {
                        name: {
                            contains: q,
                            mode: 'insensitive'
                        },
                        ...(category && { category }),
                        ...(highRisk !== undefined && { highRisk: highRisk === 'true' })
                    },
                    take: parseInt(limit),
                    orderBy: { name: 'asc' },
                    include: {
                        _count: {
                            select: { drugSaltLinks: true }
                        }
                    }
                });

                // Merge and deduplicate results
                const allResults = [...nameResults];
                const existingIds = new Set(nameResults.map(s => s.id));

                for (const aliasResult of aliasResults) {
                    if (!existingIds.has(aliasResult.id)) {
                        // Add count for alias results
                        const count = await prisma.drugSaltLink.count({
                            where: { saltId: aliasResult.id }
                        });
                        allResults.push({
                            ...aliasResult,
                            _count: { drugSaltLinks: count }
                        });
                        existingIds.add(aliasResult.id);
                    }
                }

                return res.json({
                    success: true,
                    data: allResults.slice(0, parseInt(limit))
                });
            } else {
                // Name-only search
                where.name = {
                    contains: q,
                    mode: 'insensitive'
                };
            }
        }

        if (category) {
            where.category = category;
        }

        if (highRisk !== undefined) {
            where.highRisk = highRisk === 'true';
        }

        const salts = await prisma.salt.findMany({
            where,
            take: parseInt(limit),
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { drugSaltLinks: true }
                }
            }
        });

        res.json({
            success: true,
            data: salts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all salts with pagination
 * @route GET /api/v1/salt
 */
exports.getAllSalts = async (req, res, next) => {
    try {
        const { page = 1, limit = 100, category } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = category ? { category } : {};

        const [salts, total] = await Promise.all([
            prisma.salt.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { drugSaltLinks: true }
                    }
                }
            }),
            prisma.salt.count({ where })
        ]);

        res.json({
            success: true,
            data: salts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get salt by ID with linked drugs
 * @route GET /api/v1/salt/:id
 */
exports.getSaltById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const salt = await prisma.salt.findUnique({
            where: { id },
            include: {
                drugSaltLinks: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                manufacturer: true,
                                form: true
                            }
                        }
                    }
                }
            }
        });

        if (!salt) {
            throw ApiError.notFound('Salt not found');
        }

        res.json({
            success: true,
            data: salt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new salt (admin only)
 * @route POST /api/v1/salt
 */
exports.createSalt = async (req, res, next) => {
    try {
        const { name, category, therapeuticClass, highRisk } = req.body;

        // Validate required fields
        if (!name) {
            throw ApiError.badRequest('Salt name is required');
        }

        // Check for duplicates
        const existing = await prisma.salt.findUnique({
            where: { name: name.trim() }
        });

        if (existing) {
            throw ApiError.conflict('Salt with this name already exists');
        }

        const salt = await prisma.salt.create({
            data: {
                name: name.trim(),
                category: category || null,
                therapeuticClass: therapeuticClass || null,
                highRisk: highRisk || false
            }
        });

        res.status(201).json({
            success: true,
            data: salt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update salt (admin only)
 * @route PUT /api/v1/salt/:id
 */
exports.updateSalt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, category, therapeuticClass, highRisk } = req.body;

        // Check if salt exists
        const existing = await prisma.salt.findUnique({ where: { id } });
        if (!existing) {
            throw ApiError.notFound('Salt not found');
        }

        // Check for name conflicts if name is being changed
        if (name && name !== existing.name) {
            const duplicate = await prisma.salt.findUnique({
                where: { name: name.trim() }
            });
            if (duplicate) {
                throw ApiError.conflict('Salt with this name already exists');
            }
        }

        const salt = await prisma.salt.update({
            where: { id },
            data: {
                ...(name && { name: name.trim() }),
                ...(category !== undefined && { category }),
                ...(therapeuticClass !== undefined && { therapeuticClass }),
                ...(highRisk !== undefined && { highRisk })
            }
        });

        res.json({
            success: true,
            data: salt
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete salt (admin only) 
 * @route DELETE /api/v1/salt/:id
 */
exports.deleteSalt = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if salt is linked to any drugs
        const linkCount = await prisma.drugSaltLink.count({
            where: { saltId: id }
        });

        if (linkCount > 0) {
            throw ApiError.badRequest(
                `Cannot delete salt: it is linked to ${linkCount} medicine(s). Remove all links first.`
            );
        }

        await prisma.salt.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Salt deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add alias to salt
 * @route POST /api/v1/salt/:id/aliases
 */
exports.addAlias = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { alias } = req.body;

        if (!alias || alias.trim().length < 2) {
            throw ApiError.badRequest('Alias must be at least 2 characters');
        }

        const salt = await prisma.salt.findUnique({
            where: { id }
        });

        if (!salt) {
            throw ApiError.notFound('Salt not found');
        }

        // Check if alias already exists for this salt
        const normalizedAlias = alias.toLowerCase().trim();
        const existingAliases = salt.aliases.map(a => a.toLowerCase());

        if (existingAliases.includes(normalizedAlias)) {
            throw ApiError.conflict('This alias already exists for this salt');
        }

        // Check if alias conflicts with other salt names or aliases
        const conflictBySaltName = await prisma.salt.findFirst({
            where: {
                name: {
                    equals: alias,
                    mode: 'insensitive'
                },
                id: { not: id }
            }
        });

        if (conflictBySaltName) {
            throw ApiError.conflict(
                `Alias "${alias}" conflicts with existing salt name "${conflictBySaltName.name}"`
            );
        }

        // Check for alias conflicts using raw SQL
        const conflictByAlias = await prisma.$queryRaw`
            SELECT * FROM "Salt"
            WHERE id != ${id}
            AND EXISTS (
                SELECT 1 FROM unnest(aliases) AS existing_alias
                WHERE LOWER(existing_alias) = ${normalizedAlias}
            )
            LIMIT 1
        `;

        if (conflictByAlias.length > 0) {
            throw ApiError.conflict(
                `Alias "${alias}" already used by salt "${conflictByAlias[0].name}"`
            );
        }

        // Add alias
        const updatedSalt = await prisma.salt.update({
            where: { id },
            data: {
                aliases: {
                    push: alias.trim()
                }
            }
        });

        res.json({
            success: true,
            data: updatedSalt,
            message: 'Alias added successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove alias from salt
 * @route DELETE /api/v1/salt/:id/aliases/:alias
 */
exports.removeAlias = async (req, res, next) => {
    try {
        const { id, alias } = req.params;

        const salt = await prisma.salt.findUnique({
            where: { id }
        });

        if (!salt) {
            throw ApiError.notFound('Salt not found');
        }

        const updatedAliases = salt.aliases.filter(
            a => a.toLowerCase() !== decodeURIComponent(alias).toLowerCase()
        );

        if (updatedAliases.length === salt.aliases.length) {
            throw ApiError.notFound('Alias not found for this salt');
        }

        const updatedSalt = await prisma.salt.update({
            where: { id },
            data: {
                aliases: updatedAliases
            }
        });

        res.json({
            success: true,
            data: updatedSalt,
            message: 'Alias removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Find salt by name or alias
 * @route GET /api/v1/salt/find/:name
 */
exports.findByNameOrAlias = async (req, res, next) => {
    try {
        const { name } = req.params;
        const normalizedName = name.toLowerCase().trim();

        // Try exact name match first
        let salt = await prisma.salt.findFirst({
            where: {
                name: {
                    equals: name,
                    mode: 'insensitive'
                }
            },
            include: {
                _count: {
                    select: { drugSaltLinks: true }
                }
            }
        });

        // If not found, search in aliases
        if (!salt) {
            const results = await prisma.$queryRaw`
                SELECT * FROM "Salt"
                WHERE EXISTS (
                    SELECT 1 FROM unnest(aliases) AS alias
                    WHERE LOWER(alias) = ${normalizedName}
                )
                LIMIT 1
            `;

            if (results.length > 0) {
                salt = results[0];
                // Add count
                const count = await prisma.drugSaltLink.count({
                    where: { saltId: salt.id }
                });
                salt._count = { drugSaltLinks: count };
            }
        }

        if (!salt) {
            return res.json({
                success: true,
                data: null,
                message: 'Salt not found'
            });
        }

        res.json({
            success: true,
            data: salt,
            message: 'Salt found'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get salts for a specific drug
 * @route GET /api/v1/salt/drug/:drugId/salts
 */
exports.getDrugSalts = async (req, res, next) => {
    try {
        const { drugId } = req.params;

        const links = await prisma.drugSaltLink.findMany({
            where: { drugId },
            include: {
                salt: true
            },
            orderBy: { order: 'asc' }
        });

        res.json({
            success: true,
            data: links.map(link => ({
                id: link.id,
                salt: link.salt,
                strengthValue: link.strengthValue,
                strengthUnit: link.strengthUnit,
                role: link.role,
                order: link.order
            }))
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Link a salt to a drug
 * @route POST /api/v1/salt/drug/:drugId/salts
 */
exports.linkSaltToDrug = async (req, res, next) => {
    try {
        const { drugId } = req.params;
        const { saltId, strengthValue, strengthUnit, role = 'PRIMARY', order = 1 } = req.body;

        // Validate required fields
        if (!saltId || !strengthValue || !strengthUnit) {
            throw ApiError.badRequest('saltId, strengthValue, and strengthUnit are required');
        }

        // Check if drug exists
        const drug = await prisma.drug.findUnique({
            where: { id: drugId }
        });
        if (!drug) {
            throw ApiError.notFound('Drug not found');
        }

        // Check if salt exists
        const salt = await prisma.salt.findUnique({
            where: { id: saltId }
        });
        if (!salt) {
            throw ApiError.notFound('Salt not found');
        }

        // Check for duplicate mapping
        const existing = await prisma.drugSaltLink.findFirst({
            where: {
                drugId,
                saltId
            }
        });

        if (existing) {
            throw ApiError.conflict('This drug-salt mapping already exists');
        }

        const link = await prisma.drugSaltLink.create({
            data: {
                drugId,
                saltId,
                strengthValue: parseFloat(strengthValue),
                strengthUnit,
                role,
                order: parseInt(order)
            },
            include: {
                salt: true
            }
        });

        res.status(201).json({
            success: true,
            data: link
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Unlink a salt from a drug
 * @route DELETE /api/v1/salt/drug/:drugId/salts/:saltId
 */
exports.unlinkSaltFromDrug = async (req, res, next) => {
    try {
        const { drugId, saltId } = req.params;

        const link = await prisma.drugSaltLink.findFirst({
            where: { drugId, saltId }
        });

        if (!link) {
            throw ApiError.notFound('Drug-salt mapping not found');
        }

        await prisma.drugSaltLink.delete({
            where: { id: link.id }
        });

        res.json({
            success: true,
            message: 'Drug-salt mapping removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * CORE POS FEATURE: Get alternative medicines with same salt composition
 * @route GET /api/v1/salt/alternatives
 * @query drugId - ID of the requested medicine
 * @query storeId - ID of the store (for stock filtering)
 * @query strengthValue - Optional: filter by specific strength
 * @query strengthUnit - Optional: filter by specific strength unit
 * @query form - Optional: filter by dosage form
 * @query minStock - Minimum stock required (default: 1)
 */
exports.getAlternatives = async (req, res, next) => {
    try {
        const {
            drugId,
            storeId,
            strengthValue,
            strengthUnit,
            form,
            minStock = 1
        } = req.query;

        // Validate required params
        if (!drugId || !storeId) {
            throw ApiError.badRequest('drugId and storeId are required');
        }

        // Step 1: Get original drug with its salt composition
        const originalDrug = await prisma.drug.findUnique({
            where: { id: drugId },
            include: {
                saltLinks: {
                    include: {
                        salt: true
                    },
                    orderBy: { order: 'asc' }
                },
                inventory: {
                    where: {
                        storeId,
                        deletedAt: null
                    },
                    select: {
                        baseUnitQuantity: true,
                    }
                }
            }
        });

        if (!originalDrug) {
            throw ApiError.notFound('Drug not found');
        }

        // Calculate total stock
        const totalStock = originalDrug.inventory.reduce(
            (sum, batch) => sum + (Number(batch.baseUnitQuantity) || 0),
            0
        );

        // Extract salt IDs from original drug
        const saltIds = originalDrug.saltLinks.map(link => link.saltId);

        if (saltIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    originalDrug: {
                        id: originalDrug.id,
                        name: originalDrug.name,
                        form: originalDrug.form,
                        salts: [],
                        available: totalStock > 0,
                        totalStock
                    },
                    alternatives: [],
                    warnings: ['Original drug has no salt composition mapped'],
                    totalAlternatives: 0
                }
            });
        }

        // Step 2: Find other drugs with the SAME salt composition
        // For simplicity, we match drugs that have ALL the same salts
        const alternativeDrugs = await prisma.drug.findMany({
            where: {
                storeId,
                id: { not: drugId }, // Exclude original drug
                saltLinks: {
                    some: {
                        saltId: { in: saltIds }
                    }
                },
                ...(form && { form })
            },
            include: {
                saltLinks: {
                    include: {
                        salt: true
                    },
                    orderBy: { order: 'asc' }
                },
                inventory: {
                    where: {
                        storeId,
                        deletedAt: null,
                        baseUnitQuantity: { gte: parseInt(minStock) }
                    },
                    orderBy: {
                        expiryDate: 'asc' // FEFO
                    }
                }
            }
        });

        // Step 3: Filter and enrich alternatives
        const alternatives = [];

        for (const drug of alternativeDrugs) {
            // Check if salt composition EXACTLY matches
            const drugSaltIds = drug.saltLinks.map(l => l.saltId).sort();
            const originalSaltIds = saltIds.sort();

            if (JSON.stringify(drugSaltIds) !== JSON.stringify(originalSaltIds)) {
                continue; // Skip if salt composition doesn't match exactly
            }

            // Calculate total stock
            const drugTotalStock = drug.inventory.reduce(
                (sum, batch) => sum + (Number(batch.baseUnitQuantity) || 0),
                0
            );

            if (drugTotalStock < parseInt(minStock)) {
                continue; // Skip if insufficient stock
            }

            // Check strength match
            let strengthMatch = 'UNKNOWN';
            const originalStrength = originalDrug.saltLinks[0];
            const altStrength = drug.saltLinks[0];

            if (originalStrength && altStrength) {
                if (
                    parseFloat(originalStrength.strengthValue) === parseFloat(altStrength.strengthValue) &&
                    originalStrength.strengthUnit === altStrength.strengthUnit
                ) {
                    strengthMatch = 'EXACT';
                } else {
                    strengthMatch = 'DIFFERENT';
                }
            }

            // Check form match
            const formMatch = originalDrug.form === drug.form;

            // Calculate price difference
            const originalPrice = originalDrug.inventory[0]?.mrp || 0;
            const altPrice = drug.inventory[0]?.mrp || 0;
            const priceDifference = altPrice - originalPrice;
            const priceDifferencePercent = originalPrice > 0
                ? ((priceDifference / originalPrice) * 100).toFixed(1)
                : 0;

            alternatives.push({
                drugId: drug.id,
                name: drug.name,
                manufacturer: drug.manufacturer,
                form: drug.form,
                salts: drug.saltLinks.map(link => ({
                    name: link.salt.name,
                    strength: `${link.strengthValue} ${link.strengthUnit}`
                })),
                mrp: altPrice,
                totalStock: drugTotalStock,
                batches: drug.inventory.map(batch => ({
                    id: batch.id,
                    batchNumber: batch.batchNumber,
                    quantity: batch.baseUnitQuantity,
                    expiryDate: batch.expiryDate,
                    location: batch.location
                })),
                strengthMatch,
                formMatch,
                priceDifference,
                priceDifferencePercent: parseFloat(priceDifferencePercent)
            });
        }

        // Step 4: Sort alternatives (exact matches first, then by price)
        alternatives.sort((a, b) => {
            if (a.strengthMatch === 'EXACT' && b.strengthMatch !== 'EXACT') return -1;
            if (a.strengthMatch !== 'EXACT' && b.strengthMatch === 'EXACT') return 1;
            return a.mrp - b.mrp;
        });

        res.json({
            success: true,
            data: {
                originalDrug: {
                    id: originalDrug.id,
                    name: originalDrug.name,
                    form: originalDrug.form,
                    salts: originalDrug.saltLinks.map(link => ({
                        name: link.salt.name,
                        strength: `${link.strengthValue} ${link.strengthUnit}`
                    })),
                    available: totalStock > 0,
                    totalStock
                },
                alternatives,
                warnings: [],
                totalAlternatives: alternatives.length
            }
        });
    } catch (error) {
        next(error);
    }
};
