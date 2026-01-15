/**
 * Medicine Master API Routes
 * 
 * Handles medicine master CRUD, search, and store overlays
 * Requirements: 9.1, 3.1, 3.2, 3.3, 2.1, 2.4
 */

const express = require('express');
const { medicineMasterService } = require('../../services/MedicineMasterService');
const { searchService } = require('../../services/SearchService');
const { storeOverlayService } = require('../../services/StoreOverlayService');
const { ingestionPipelineService } = require('../../services/IngestionPipelineService');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { rateLimit } = require('express-rate-limit');
const { validateCreateMedicine, validateUpdateMedicine } = require('../../middlewares/validateMedicine');

const router = express.Router();

// Rate limiter: 1000 requests per minute per store
// Uses store ID from authenticated user (from cookies)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Too many requests from this store, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Store ID from authenticated user (set by auth middleware from cookies)
    const storeId = req.user && req.user.storeId ? req.user.storeId : 'unknown';
    return `store:${storeId}`;
  },
});

// Apply rate limiting to all routes
router.use(apiLimiter);

/**
 * POST /api/v1/medicines
 * Create a new medicine
 * Requirements: 9.1
 */
router.post('/', validateCreateMedicine, asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'system';
  const medicine = await medicineMasterService.create(req.body, userId);
  res.status(201).json({ success: true, data: medicine });
}));

/**
 * GET /api/v1/medicines/:id
 * Get medicine by canonical ID
 * Requirements: 9.1
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const medicine = await medicineMasterService.getById(id);
  
  if (!medicine) {
    throw ApiError.notFound(`Medicine ${id} not found`);
  }
  
  res.json({ success: true, data: medicine });
}));

/**
 * PUT /api/v1/medicines/:id
 * Update medicine
 * Requirements: 9.1
 */
router.put('/:id', validateUpdateMedicine, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || 'system';
  const medicine = await medicineMasterService.update(id, req.body, userId);
  res.json({ success: true, data: medicine });
}));

/**
 * DELETE /api/v1/medicines/:id
 * Soft delete medicine (mark as DISCONTINUED)
 * Requirements: 9.1
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || 'system';
  const medicine = await medicineMasterService.softDelete(id, userId);
  res.json({ success: true, data: medicine });
}));

/**
 * GET /api/v1/medicines/:id/versions
 * Get version history for a medicine
 * Requirements: 8.1, 8.2
 */
router.get('/:id/versions', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const versions = await medicineMasterService.getVersionHistory(id);
  res.json({ success: true, data: versions });
}));

/**
 * POST /api/v1/medicines/:id/rollback
 * Rollback medicine to a previous version
 * Requirements: 8.4
 */
router.post('/:id/rollback', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { versionNumber } = req.body;
  const userId = req.user?.id || 'system';
  
  if (!versionNumber) {
    throw ApiError.badRequest('versionNumber is required');
  }
  
  const medicine = await medicineMasterService.rollback(id, versionNumber, userId);
  res.json({ success: true, data: medicine });
}));

/**
 * GET /api/v1/medicines/barcode/:barcode
 * Find medicine by barcode
 * Requirements: 1.6
 */
router.get('/barcode/:barcode', asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const medicine = await medicineMasterService.findByBarcode(barcode);
  
  if (!medicine) {
    throw ApiError.notFound(`Medicine with barcode ${barcode} not found`);
  }
  
  res.json({ success: true, data: medicine });
}));

/**
 * POST /api/v1/medicines/bulk
 * Bulk create medicines
 * Requirements: 9.2
 */
router.post('/bulk', asyncHandler(async (req, res) => {
  const { medicines } = req.body;
  const userId = req.user?.id || 'system';
  
  if (!Array.isArray(medicines)) {
    throw ApiError.badRequest('medicines must be an array');
  }
  
  const result = await medicineMasterService.bulkCreate(medicines, userId);
  res.json({ success: true, data: result });
}));

/**
 * PUT /api/v1/medicines/bulk
 * Bulk update medicines
 * Requirements: 9.2
 */
router.put('/bulk', asyncHandler(async (req, res) => {
  const { updates } = req.body;
  const userId = req.user?.id || 'system';
  
  if (!Array.isArray(updates)) {
    throw ApiError.badRequest('updates must be an array');
  }
  
  const result = await medicineMasterService.bulkUpdate(updates, userId);
  res.json({ success: true, data: result });
}));

module.exports = router;
