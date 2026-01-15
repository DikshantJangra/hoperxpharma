/**
 * Medicine Search API Routes
 * 
 * Handles Typesense-powered search operations
 * Requirements: 3.1, 3.2, 3.3, 3.6
 */

const express = require('express');
const { searchService } = require('../../services/SearchService');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middlewares/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/medicines/search
 * Search medicines with fuzzy matching and filters
 * Requirements: 3.1, 3.2, 3.4, 3.5
 */
router.get('/', asyncHandler(async (req, res) => {
    const {
      q,
      manufacturer,
      schedule,
      requiresPrescription,
      discontinued,
      form,
      limit,
      offset,
    } = req.query;

    if (!q || q.length < 2) {
      throw ApiError.badRequest('Search query (q) must be at least 2 characters');
    }

    const filters = {};
    if (manufacturer) filters.manufacturer = manufacturer;
    if (schedule) filters.schedule = schedule;
    if (requiresPrescription !== undefined) {
      filters.requiresPrescription = requiresPrescription === 'true';
    }
    if (discontinued !== undefined) {
      filters.discontinued = discontinued === 'true';
    }
    if (form) filters.form = form;

    const results = await searchService.search({
      query: q,
      filters,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });

    res.json({
      query: q,
      results,
      count: results.length,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
  }));

/**
 * GET /api/v1/medicines/search/autocomplete
 * Autocomplete search with prefix matching
 * Requirements: 3.3
 */
router.get('/autocomplete', asyncHandler(async (req, res) => {
    const { q, limit, manufacturer, form } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [], count: 0 });
    }

    const filters = {};
    if (manufacturer) filters.manufacturer = manufacturer;
    if (form) filters.form = form;

    const result = await searchService.autocomplete(q, {
      limit: parseInt(limit) || 10,
      filters,
    });

    res.json(result);
  }));

/**
 * GET /api/v1/medicines/search/by-composition
 * Search medicines by salt/composition
 * Requirements: 3.6
 */
router.get('/by-composition', asyncHandler(async (req, res) => {
    const { salt } = req.query;

    if (!salt || salt.length < 2) {
      throw ApiError.badRequest('Salt name must be at least 2 characters');
    }

    const results = await searchService.searchByComposition(salt);

    res.json({
      salt,
      results,
      count: results.length,
    });
  }));

/**
 * GET /api/v1/medicines/search/by-manufacturer
 * Search medicines by manufacturer
 */
router.get('/by-manufacturer', asyncHandler(async (req, res) => {
    const { manufacturer } = req.query;

    if (!manufacturer || manufacturer.length < 2) {
      throw ApiError.badRequest('Manufacturer name must be at least 2 characters');
    }

    const results = await searchService.searchByManufacturer(manufacturer);

    res.json({
      manufacturer,
      results,
      count: results.length,
    });
  }));

/**
 * GET /api/v1/medicines/search/stats
 * Get search index statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const stats = await searchService.getIndexStats();
    res.json(stats);
  }));

module.exports = router;
