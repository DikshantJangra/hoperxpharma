const express = require('express');
const progressController = require('../../controllers/onboarding/onboarding.controller');
const onboardingController = require('../../controllers/onboarding/onboardingController');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.get('/progress', progressController.getProgress);
router.post('/progress', progressController.saveProgress);
router.post('/complete', onboardingController.completeOnboarding);

module.exports = router;
