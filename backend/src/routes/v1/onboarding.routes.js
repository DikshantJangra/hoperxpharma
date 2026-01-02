const express = require('express');
const progressController = require('../../controllers/onboarding/onboarding.controller');
const onboardingController = require('../../controllers/onboarding/onboardingController');
const { authenticate, optionalAuth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { completeOnboardingSchema } = require('../../validators/store.validator');

const router = express.Router();

router.get('/progress', authenticate, progressController.getProgress);
router.post('/progress', authenticate, progressController.saveProgress);
router.post(
    '/complete',
    authenticate,
    validate(completeOnboardingSchema),
    onboardingController.completeOnboarding
);

// Asset upload routes for onboarding
router.post('/logo/upload-request', authenticate, onboardingController.requestLogoUpload);
router.post('/logo/process', authenticate, onboardingController.processLogoUpload);

// License document upload routes
router.post('/license/upload-request', authenticate, onboardingController.requestLicenseUpload);
router.post('/license/process', authenticate, onboardingController.processLicenseUpload);

// Setup Mode
router.post('/mode', authenticate, onboardingController.setSetupMode);
// Reset Mode (Demo only)
router.post('/reset', authenticate, onboardingController.resetMode);

// Data Import Routes
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/import/template/:type', authenticate, onboardingController.getImportTemplate);
router.post('/import/data/:type', authenticate, upload.single('file'), onboardingController.importData);

module.exports = router;
