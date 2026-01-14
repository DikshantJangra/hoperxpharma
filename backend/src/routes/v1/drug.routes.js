const express = require('express');
const drugService = require('../../services/drugService');
const ApiError = require('../../utils/ApiError');
const prisma = require('../../db/prisma');

const router = express.Router();

/**
 * GET /api/v1/drugs
 * Get drugs with filters
 */
router.get('/', async (req, res, next) => {
  try {
    const { storeId, status, limit, offset } = req.query;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const drugs = await drugService.getDrugsByStatus(storeId, status, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
    });

    res.json(drugs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/drugs/similar
 * Find medicines with similar names that have composition
 */
router.get('/similar', async (req, res, next) => {
  try {
    const { name, limit } = req.query;

    if (!name || name.length < 2) {
      throw ApiError.badRequest('name parameter is required (min 2 chars)');
    }

    console.log('[Similar Drugs] Searching for:', name);

    // Find drugs with similar names that have composition
    const drugs = await prisma.drug.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' },
        saltLinks: { some: {} }, // Must have composition
      },
      include: {
        saltLinks: {
          include: { salt: true },
          orderBy: { order: 'asc' },
        },
      },
      take: parseInt(limit) || 10,
    });

    console.log('[Similar Drugs] Found:', drugs.length);
    res.json(drugs);
  } catch (error) {
    console.error('[Similar Drugs] Error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/drugs/substitutes
 * Find substitute medicines with the same salt composition
 */
router.get('/substitutes', async (req, res, next) => {
  try {
    const { drugId, storeId } = req.query;

    if (!drugId) {
      throw ApiError.badRequest('drugId is required');
    }

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    console.log('[Substitutes] Finding substitutes for drug:', drugId);

    // Get the original drug with its salt composition
    const originalDrug = await prisma.drug.findUnique({
      where: { id: drugId },
      include: {
        saltLinks: {
          include: { salt: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!originalDrug) {
      throw ApiError.notFound('Drug not found');
    }

    if (!originalDrug.saltLinks || originalDrug.saltLinks.length === 0) {
      return res.json({
        original: originalDrug,
        substitutes: [],
        message: 'No composition data available for this medicine',
      });
    }

    // Get salt IDs and strengths from original drug
    const saltSignature = originalDrug.saltLinks.map(link => ({
      saltId: link.saltId,
      strengthValue: link.strengthValue,
      strengthUnit: link.strengthUnit,
    }));

    // Find drugs with the same salt composition in the same store
    const substitutes = await prisma.drug.findMany({
      where: {
        storeId,
        id: { not: drugId }, // Exclude original drug
        ingestionStatus: 'ACTIVE',
        AND: saltSignature.map(salt => ({
          saltLinks: {
            some: {
              saltId: salt.saltId,
              strengthValue: salt.strengthValue,
              strengthUnit: salt.strengthUnit,
            },
          },
        })),
      },
      include: {
        saltLinks: {
          include: { salt: true },
          orderBy: { order: 'asc' },
        },
        batches: {
          where: {
            currentQuantity: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          select: {
            id: true,
            batchNumber: true,
            currentQuantity: true,
            expiryDate: true,
            mrp: true,
            purchaseRate: true,
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      take: 20,
    });

    // Filter to only include drugs with exact same number of salts
    const exactMatches = substitutes.filter(
      drug => drug.saltLinks.length === originalDrug.saltLinks.length
    );

    // Calculate total stock for each substitute
    const substitutesWithStock = exactMatches.map(drug => ({
      ...drug,
      totalStock: drug.batches.reduce((sum, batch) => sum + batch.currentQuantity, 0),
      lowestPrice: drug.batches.length > 0 
        ? Math.min(...drug.batches.map(b => b.mrp))
        : null,
    }));

    // Sort by stock availability
    substitutesWithStock.sort((a, b) => b.totalStock - a.totalStock);

    console.log('[Substitutes] Found:', substitutesWithStock.length, 'substitutes');

    res.json({
      original: {
        id: originalDrug.id,
        name: originalDrug.name,
        manufacturer: originalDrug.manufacturer,
        composition: originalDrug.saltLinks.map(link => ({
          name: link.salt.name,
          strength: link.strengthValue,
          unit: link.strengthUnit,
        })),
      },
      substitutes: substitutesWithStock,
      totalFound: substitutesWithStock.length,
    });
  } catch (error) {
    console.error('[Substitutes] Error:', error);
    next(error);
  }
});

/**
 * GET /api/v1/drugs/bulk
 * Get drugs for bulk correction
 */
router.get('/bulk', async (req, res, next) => {
  try {
    const { storeId, status, search, manufacturer, hasComposition } = req.query;

    console.log('[Bulk Drugs] Request params:', { storeId, status, search, manufacturer, hasComposition });

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    // Build query filters
    const filters = { storeId };
    if (status) filters.ingestionStatus = status;
    if (manufacturer) filters.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (search) filters.name = { contains: search, mode: 'insensitive' };

    // Handle composition filter
    if (hasComposition !== undefined) {
      if (hasComposition === 'false' || hasComposition === false) {
        // Filter for medicines WITHOUT composition (no saltLinks or empty saltLinks)
        filters.saltLinks = { none: {} };
      } else if (hasComposition === 'true' || hasComposition === true) {
        // Filter for medicines WITH composition (has saltLinks)
        filters.saltLinks = { some: {} };
      }
    }

    console.log('[Bulk Drugs] Query filters:', JSON.stringify(filters, null, 2));

    const drugs = await prisma.drug.findMany({
      where: filters,
      include: {
        saltLinks: {
          include: { salt: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { ingestionStatus: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });

    console.log('[Bulk Drugs] Found drugs:', drugs.length);
    res.json(drugs);
  } catch (error) {
    console.error('[Bulk Drugs] Error:', error);
    next(error);
  }
});

/**
 * POST /api/v1/drugs
 * Create a new drug
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user?.id || 'system'; // Get from auth middleware
    const drug = await drugService.createDrug(req.body, userId);
    res.status(201).json(drug);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/drugs/:id/activate
 * Activate a medicine
 */
router.post('/:id/activate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId || 'system';

    const drug = await drugService.activateMedicine(id, userId);
    res.json(drug);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/drugs/bulk-update
 * Bulk update drugs
 */
router.post('/bulk-update', async (req, res, next) => {
  try {
    const { updates } = req.body;
    const userId = req.user?.id || 'system';

    const result = await drugService.bulkUpdate(updates, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/drugs/import
 * Import medicines
 */
router.post('/import', async (req, res, next) => {
  try {
    const { medicines } = req.body;
    const userId = req.user?.id || 'system';

    const result = await drugService.importMedicines(medicines, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/drugs/:id
 * Get drug by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const drug = await drugService.getDrugById(id);
    res.json(drug);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/drugs/:id/units
 * Get available units for a drug
 */
router.get('/:id/units', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get drug with unit configurations (relation) and batches for tabletsPerStrip
    const drug = await prisma.drug.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        baseUnit: true,
        displayUnit: true,
        unitConfigurations: {
          select: {
            id: true,
            baseUnit: true,
            parentUnit: true,
            childUnit: true,
            conversion: true,
            isDefault: true,
          },
        },
        inventory: {
          where: { deletedAt: null },
          select: { tabletsPerStrip: true },
          take: 1,
        },
      },
    });

    if (!drug) {
      throw ApiError.notFound('Drug not found');
    }

    // Build units array
    const units = [];

    // Determine display and base units
    const displayUnit = drug.displayUnit || 'Strip';
    const baseUnit = drug.baseUnit || 'Tablet';
    
    // Get conversion factor from:
    // 1. DrugUnit configurations (if exists)
    // 2. InventoryBatch.tabletsPerStrip (if exists)
    // 3. Default to 10
    let conversionFactor = 10;
    
    // Check DrugUnit configurations first
    if (drug.unitConfigurations && drug.unitConfigurations.length > 0) {
      const defaultConfig = drug.unitConfigurations.find(c => c.isDefault) || drug.unitConfigurations[0];
      conversionFactor = Number(defaultConfig.conversion) || 10;
    } 
    // Fallback to batch tabletsPerStrip
    else if (drug.inventory && drug.inventory.length > 0 && drug.inventory[0].tabletsPerStrip) {
      conversionFactor = drug.inventory[0].tabletsPerStrip;
    }

    // Add display unit (primary selling unit, e.g., Strip)
    units.push({
      name: displayUnit,
      unit: displayUnit,
      isDefault: true,
      isBase: displayUnit === baseUnit,
      conversionFactor: 1, // Display unit is the reference (1 Strip = 1 Strip)
    });

    // Add base unit if different from display unit
    if (baseUnit !== displayUnit) {
      units.push({
        name: baseUnit,
        unit: baseUnit,
        isDefault: false,
        isBase: true,
        conversionFactor: conversionFactor, // e.g., 10 Tablets = 1 Strip
      });
    }

    // Add any additional unit configurations from DrugUnit relation
    if (drug.unitConfigurations && Array.isArray(drug.unitConfigurations)) {
      drug.unitConfigurations.forEach((config) => {
        const unitName = config.childUnit || config.parentUnit;
        // Avoid duplicates
        if (unitName && !units.find(u => u.unit === unitName)) {
          units.push({
            name: unitName,
            unit: unitName,
            isDefault: config.isDefault || false,
            isBase: unitName === baseUnit,
            conversionFactor: Number(config.conversion || 1),
          });
        }
      });
    }

    res.json({
      drugId: drug.id,
      drugName: drug.name,
      baseUnit,
      displayUnit,
      conversionFactor,
      units,
    });
  } catch (error) {
    console.error('[Drug Units] Error:', error);
    next(error);
  }
});

/**
 * PUT /api/v1/drugs/:id/composition
 * Update drug composition (salt links)
 */
router.put('/:id/composition', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { saltLinks } = req.body;
    const userId = req.user?.id || 'system';

    if (!saltLinks || !Array.isArray(saltLinks)) {
      throw ApiError.badRequest('saltLinks must be an array');
    }

    // Validate each salt entry (only if there are salts)
    if (saltLinks.length > 0) {
      const validationErrors = [];
      saltLinks.forEach((link, index) => {
        if (!link.name || typeof link.name !== 'string' || link.name.trim().length < 2) {
          validationErrors.push(`Salt ${index + 1}: Name must be at least 2 characters`);
        }
        if (link.strengthValue === null || link.strengthValue === undefined || link.strengthValue <= 0) {
          validationErrors.push(`Salt ${index + 1}: Strength must be greater than 0`);
        }
        if (!link.strengthUnit || typeof link.strengthUnit !== 'string' || link.strengthUnit.trim().length === 0) {
          validationErrors.push(`Salt ${index + 1}: Unit is required`);
        }
      });

      if (validationErrors.length > 0) {
        throw ApiError.badRequest('Validation failed: ' + validationErrors.join('; '));
      }
    }

    console.log('[Drug Composition] Updating drug:', id, 'with salts:', saltLinks.length > 0 ? saltLinks : '(clearing composition)');

    // Delete existing salt links
    await prisma.drugSaltLink.deleteMany({
      where: { drugId: id },
    });

    // Create new salt links (only if there are salts)
    if (saltLinks.length > 0) {
      for (const link of saltLinks) {
        // Find or create salt
        let salt = await prisma.salt.findFirst({
          where: { name: { equals: link.name.trim(), mode: 'insensitive' } },
        });

        if (!salt) {
          salt = await prisma.salt.create({
            data: {
              name: link.name.trim(),
              aliases: [],
            },
          });
        }

        // Create salt link
        await prisma.drugSaltLink.create({
          data: {
            drugId: id,
            saltId: salt.id,
            strengthValue: Number(link.strengthValue),
            strengthUnit: link.strengthUnit.trim(),
            order: link.order || 0,
          },
        });
      }
    }

    // Update drug status - ACTIVE if has composition, SALT_PENDING if cleared
    const updatedDrug = await prisma.drug.update({
      where: { id },
      data: {
        ingestionStatus: saltLinks.length > 0 ? 'ACTIVE' : 'SALT_PENDING',
        updatedAt: new Date(),
      },
      include: {
        saltLinks: {
          include: { salt: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    console.log('[Drug Composition] Updated successfully:', updatedDrug.name);
    res.json(updatedDrug);
  } catch (error) {
    console.error('[Drug Composition] Error:', error);
    next(error);
  }
});

module.exports = router;
