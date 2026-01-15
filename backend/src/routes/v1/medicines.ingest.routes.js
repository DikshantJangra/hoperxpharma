/**
 * Medicine Ingestion API Routes
 * 
 * Handles new medicine ingestion from stores
 * Requirements: 4.1, 4.3, 4.4, 4.5, 4.6
 */

const express = require('express');
const { ingestionPipelineService } = require('../../services/IngestionPipelineService');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validateIngestion } = require('../../middlewares/validateMedicine');

const router = express.Router();

/**
 * POST /api/v1/medicines/ingest
 * Ingest a new medicine
 * Requirements: 4.1
 */
router.post('/', validateIngestion, asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const result = await ingestionPipelineService.ingest(storeId, req.body);
    res.status(201).json(result);
  }));

/**
 * POST /api/v1/medicines/ingest/bulk
 * Bulk ingest medicines
 * Requirements: 4.1
 */
router.post('/bulk', asyncHandler(async (req, res) => {
    const { storeId } = req.query;
    const { medicines } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    if (!Array.isArray(medicines)) {
      throw ApiError.badRequest('medicines must be an array');
    }

    const result = await ingestionPipelineService.bulkIngest(storeId, medicines);
    res.json(result);
  }));

/**
 * POST /api/v1/medicines/ingest/:id/usage
 * Increment usage count when another store uses a medicine
 */
router.post('/:id/usage', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    await ingestionPipelineService.incrementUsage(id, storeId);
    res.json({ message: 'Usage incremented successfully' });
  }));

/**
 * GET /api/v1/medicines/ingest/pending
 * Get pending medicines for review
 */
router.get('/pending', asyncHandler(async (req, res) => {
    const { skip, take, status } = req.query;

    const medicines = await ingestionPipelineService.getPendingMedicines({
      skip: parseInt(skip) || 0,
      take: parseInt(take) || 50,
      status,
    });

    res.json(medicines);
  }));

/**
 * GET /api/v1/medicines/ingest/stats
 * Get ingestion statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await ingestionPipelineService.getIngestionStats();
    res.json(stats);
  }));

/**
 * POST /api/v1/medicines/ingest/:id/promote
 * Manually promote a medicine to VERIFIED
 * Requirements: 4.6
 */
router.post('/:id/promote', asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ingestionPipelineService.promoteToVerified(id);
    res.json({ message: 'Medicine promoted to VERIFIED' });
  }));

module.exports = router;
