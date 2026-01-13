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
 * GET /api/v1/drugs/bulk
 * Get drugs for bulk correction
 */
router.get('/bulk', async (req, res, next) => {
  try {
    const { storeId, status, search, manufacturer } = req.query;

    console.log('[Bulk Drugs] Request params:', { storeId, status, search, manufacturer });

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    // Build query filters
    const filters = { storeId };
    if (status) filters.ingestionStatus = status;
    if (manufacturer) filters.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (search) filters.name = { contains: search, mode: 'insensitive' };

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

module.exports = router;
