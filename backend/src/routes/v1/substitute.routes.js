const express = require('express');
const substituteService = require('../../services/substituteService');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

/**
 * GET /api/v1/substitutes
 * Find substitute medicines
 */
router.get('/', async (req, res, next) => {
  try {
    const { drugId, storeId, includePartialMatches } = req.query;

    if (!drugId || !storeId) {
      throw ApiError.badRequest('drugId and storeId are required');
    }

    const substitutes = await substituteService.findSubstitutes({
      drugId,
      storeId,
      includePartialMatches: includePartialMatches === 'true',
    });

    res.json(substitutes);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/substitutes/stats
 * Get substitute statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const stats = await substituteService.getStatistics(storeId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/substitutes/invalidate
 * Invalidate substitute cache
 */
router.post('/invalidate', async (req, res, next) => {
  try {
    const { drugId, storeId } = req.body;

    if (drugId) {
      substituteService.invalidateCache(drugId);
    } else if (storeId) {
      substituteService.invalidateStoreCache(storeId);
    } else {
      throw ApiError.badRequest('drugId or storeId is required');
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
