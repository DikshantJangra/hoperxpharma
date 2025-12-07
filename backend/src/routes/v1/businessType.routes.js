const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middlewares/auth');
const { requireAdmin } = require('../../middlewares/rbac');
const businessTypeController = require('../../controllers/businessType/businessTypeController');

/**
 * Public routes (for onboarding)
 */
router.get('/summary', businessTypeController.getBusinessTypeSummary);
router.get('/:type/config', businessTypeController.getBusinessTypeConfig);

/**
 * Authenticated routes
 */
router.use(authenticate);

router.get('/', businessTypeController.listBusinessTypes);
router.get('/:type/sidebar', businessTypeController.getSidebarConfig);
router.get('/:type/features', businessTypeController.getEnabledFeatures);

/**
 * Store-specific routes
 */
router.get('/stores/:storeId/feature-config', businessTypeController.getStoreFeatureConfig);
router.get('/stores/:storeId/sidebar', businessTypeController.getStoreSidebarConfig);

/**
 * Admin-only routes
 */
router.put(
    '/stores/:storeId/feature-overrides',
    requireAdmin,
    businessTypeController.updateStoreFeatureOverrides
);

module.exports = router;
