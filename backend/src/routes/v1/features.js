const express = require('express');
const featureToggleController = require('../../controllers/featureToggleController');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * /api/v1/features:
 *   get:
 *     summary: Get features for current user's store
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Features retrieved successfully
 */
router.get('/', authenticate, featureToggleController.getFeaturesForCurrentStore);

/**
 * @swagger
 * /api/v1/features/business-type/{businessType}:
 *   get:
 *     summary: Get features for a specific business type
 *     tags: [Features]
 *     parameters:
 *       - in: path
 *         name: businessType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business type features retrieved successfully
 */
router.get('/business-type/:businessType', featureToggleController.getFeaturesForBusinessType);

/**
 * @swagger
 * /api/v1/features/store/{storeId}:
 *   put:
 *     summary: Update feature overrides for a store
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               featureOverrides:
 *                 type: object
 *     responses:
 *       200:
 *         description: Store features updated successfully
 */
router.put('/store/:storeId', authenticate, featureToggleController.updateStoreFeatures);

/**
 * @swagger
 * /api/v1/features/seed:
 *   post:
 *     summary: Seed business type configurations (admin only)
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Business type configurations seeded successfully
 */
router.post('/seed', authenticate, featureToggleController.seedBusinessTypeConfigs);

module.exports = router;
