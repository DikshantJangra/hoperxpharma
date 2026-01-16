/**
 * Medicine Master API Routes
 * 
 * Handles medicine master CRUD, search, and store overlays
 * Requirements: 9.1, 3.1, 3.2, 3.3, 2.1, 2.4
 */

const express = require('express');
const { medicineMasterService } = require('../../services/MedicineMasterService');
const { storeOverlayService } = require('../../services/StoreOverlayService');
const { ingestionPipelineService } = require('../../services/IngestionPipelineService');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { rateLimit } = require('express-rate-limit');
const { validateCreateMedicine, validateUpdateMedicine } = require('../../middlewares/validateMedicine');

// Use PostgreSQL Search (memory-efficient, prevents OOM errors)
// InMemorySearchService was causing >512MB memory usage by loading all medicines into RAM
const searchService = require('../../services/PostgresSearchService').postgresSearchService;
console.log(`🔍 Using PostgreSQL Search for medicines (memory-efficient)`);

const router = express.Router();

// Rate limiter: 1000 requests per minute per store
// Uses store ID from authenticated user (from cookies)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'Too many requests from this store, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting if no user/storeId (let auth middleware handle it)
    return !req.user || !req.user.storeId;
  },
  keyGenerator: (req) => {
    // Store ID from authenticated user (set by auth middleware from cookies)
    const storeId = req.user?.storeId || 'unknown';
    return `store:${storeId}`;
  },
});

// Apply rate limiting to all routes
router.use(apiLimiter);

/**
 * GET /api/v1/medicines/search
 * Search medicines
 * Requirements: 3.1, 3.2
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, manufacturer, schedule, requiresPrescription, discontinued, form, limit = 20, offset = 0 } = req.query;

  if (!q) {
    throw ApiError.badRequest('Search query (q) is required');
  }

  const results = await searchService.search({
    query: q,
    manufacturer,
    schedule,
    requiresPrescription: requiresPrescription === 'true',
    discontinued: discontinued === 'true',
    form,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({ success: true, data: results });
}));

/**
 * GET /api/v1/medicines/autocomplete
 * Autocomplete suggestions
 * Requirements: 3.3
 */
router.get('/autocomplete', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    throw ApiError.badRequest('Search query (q) is required');
  }

  const results = await searchService.autocomplete({
    query: q,
    limit: parseInt(limit)
  });

  res.json({ success: true, data: results });
}));

/**
 * GET /api/v1/medicines/search/by-composition
 * Search by salt composition
 * Requirements: 2.1
 */
router.get('/search/by-composition', asyncHandler(async (req, res) => {
  const { salt, limit = 20 } = req.query;

  if (!salt) {
    throw ApiError.badRequest('Salt name is required');
  }

  const results = await searchService.searchByComposition(salt, parseInt(limit));
  res.json({ success: true, data: results });
}));

/**
 * GET /api/v1/medicines/search/by-manufacturer
 * Search by manufacturer
 * Requirements: 2.4
 */
router.get('/search/by-manufacturer', asyncHandler(async (req, res) => {
  const { manufacturer, limit = 20 } = req.query;

  if (!manufacturer) {
    throw ApiError.badRequest('Manufacturer name is required');
  }

  const results = await searchService.searchByManufacturer(manufacturer, parseInt(limit));
  res.json({ success: true, data: results });
}));

/**
 * GET /api/v1/medicines/stats
 * Get search statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await searchService.getIndexStats();
  res.json({ success: true, data: stats });
}));

// Note: reload-search endpoint removed - not needed for PostgresSearchService
// PostgreSQL search queries the database directly, no index reloading required

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
