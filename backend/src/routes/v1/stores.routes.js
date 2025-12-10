const express = require('express');
const storeController = require('../../controllers/stores/storeController');
const { authenticate } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { storeUpdateSchema } = require('../../validators/store.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Store routes
 */
router.get('/me', storeController.getMyStore); // Get current user's primary store
router.get('/', storeController.getUserStores);
router.get('/:id', storeController.getStoreById);
router.put('/:id', validate(storeUpdateSchema), storeController.updateStore);
router.patch('/:id', validate(storeUpdateSchema), storeController.updateStore); // PATCH for partial updates
router.get('/:id/stats', storeController.getStoreStats);

/**
 * Asset upload routes
 */
router.post('/:id/logo/upload-request', storeController.requestLogoUpload);
router.post('/:id/logo/process', storeController.processLogoUpload);
router.post('/:id/signature/upload-request', storeController.requestSignatureUpload);
router.post('/:id/signature/process', storeController.processSignatureUpload);

/**
 * Subscription routes
 */
router.get('/subscriptions/plans', storeController.getPlans);
router.get('/:storeId/subscription', storeController.getStoreSubscription);
router.get('/:storeId/subscription/usage', storeController.getUsage);

module.exports = router;
