/**
 * Store Overlay API Routes
 * 
 * Handles store-specific medicine customizations
 * Requirements: 2.1, 2.4
 */

const express = require('express');
const { storeOverlayService } = require('../../services/StoreOverlayService');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { validateStoreOverlay } = require('../../middlewares/validateMedicine');

const router = express.Router({ mergeParams: true }); // To access :storeId from parent router

/**
 * GET /api/v1/stores/:storeId/medicines/:id
 * Get merged medicine (master + overlay)
 * Requirements: 2.4
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const medicine = await storeOverlayService.getMergedMedicine(storeId, id);

    if (!medicine) {
      throw ApiError.notFound(`Medicine ${id} not found`);
    }

    res.json(medicine);
  }));

/**
 * POST /api/v1/stores/:storeId/medicines/bulk
 * Get merged medicines for multiple IDs
 * Requirements: 2.4
 */
router.post('/bulk', asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { canonicalIds } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    if (!Array.isArray(canonicalIds)) {
      throw ApiError.badRequest('canonicalIds must be an array');
    }

    const medicines = await storeOverlayService.getMergedMedicines(storeId, canonicalIds);
    res.json(medicines);
  }));

/**
 * PUT /api/v1/stores/:storeId/medicines/:id/overlay
 * Set or update store overlay
 * Requirements: 2.2
 */
router.put('/:id/overlay', validateStoreOverlay, asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const overlay = await storeOverlayService.setOverlay(storeId, id, req.body);
    res.json(overlay);
  }));

/**
 * DELETE /api/v1/stores/:storeId/medicines/:id/overlay
 * Remove store overlay
 * Requirements: 2.2
 */
router.delete('/:id/overlay', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    await storeOverlayService.removeOverlay(storeId, id);
    res.json({ message: 'Overlay removed successfully' });
  }));

/**
 * GET /api/v1/stores/:storeId/medicines/:id/overlay
 * Get store overlay (without master data)
 */
router.get('/:id/overlay', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const overlay = await storeOverlayService.getOverlay(storeId, id);
    res.json(overlay);
  }));

/**
 * PUT /api/v1/stores/:storeId/medicines/:id/stock
 * Update stock quantity
 */
router.put('/:id/stock', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;
    const { quantity } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    if (quantity === undefined || quantity === null) {
      throw ApiError.badRequest('quantity is required');
    }

    const overlay = await storeOverlayService.updateStock(storeId, id, quantity);
    res.json(overlay);
  }));

/**
 * POST /api/v1/stores/:storeId/medicines/:id/stock/increment
 * Increment stock quantity
 */
router.post('/:id/stock/increment', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;
    const { amount } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    if (!amount || amount <= 0) {
      throw ApiError.badRequest('amount must be greater than 0');
    }

    const overlay = await storeOverlayService.incrementStock(storeId, id, amount);
    res.json(overlay);
  }));

/**
 * POST /api/v1/stores/:storeId/medicines/:id/stock/decrement
 * Decrement stock quantity
 */
router.post('/:id/stock/decrement', asyncHandler(async (req, res) => {
    const { storeId, id } = req.params;
    const { amount } = req.body;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    if (!amount || amount <= 0) {
      throw ApiError.badRequest('amount must be greater than 0');
    }

    const overlay = await storeOverlayService.decrementStock(storeId, id, amount);
    res.json(overlay);
  }));

/**
 * GET /api/v1/stores/:storeId/medicines/low-stock
 * Get medicines with low stock
 */
router.get('/low-stock', asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    const medicines = await storeOverlayService.getLowStockMedicines(storeId);
    res.json(medicines);
  }));

module.exports = router;
