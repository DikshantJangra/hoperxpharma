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

module.exports = router;
