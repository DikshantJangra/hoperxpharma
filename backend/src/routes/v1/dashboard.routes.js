const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard/dashboard.controller');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/action-queues', dashboardController.getActionQueues);
router.get('/insights', dashboardController.getInsights);

module.exports = router;
