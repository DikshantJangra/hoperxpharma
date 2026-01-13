const express = require('express');
const router = express.Router();
const saltController = require('../controllers/saltController');
const { authenticate } = require('../middlewares/auth');

// Public routes (read-only)
router.get('/search', saltController.searchSalts);
router.get('/stats', saltController.getStatistics);
router.get('/find/:name', saltController.findByNameOrAlias);
router.get('/:id', saltController.getSaltById);
router.get('/', saltController.getAllSalts);

// Protected routes (require authentication)
router.post('/', authenticate, saltController.createSalt);
router.post('/:id/aliases', authenticate, saltController.addAlias);
router.delete('/:id/aliases/:alias', authenticate, saltController.removeAlias);
router.patch('/:id/high-risk', authenticate, saltController.markHighRisk);

module.exports = router;
