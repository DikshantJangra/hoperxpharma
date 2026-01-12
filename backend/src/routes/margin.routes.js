const express = require('express');
const router = express.Router();
const marginController = require('../controllers/margin/marginController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate); // Ensure all routes are authenticated

// Routes are protected by router.use(authenticate)
router.get('/sale/:saleId', marginController.getSaleMargin);
router.get('/stats', marginController.getMarginStats);
router.post('/estimate', marginController.estimateMargin);

module.exports = router;
