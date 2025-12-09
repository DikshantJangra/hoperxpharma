const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboard/dashboard.controller');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

// Dashboard routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/action-queues', dashboardController.getActionQueues);
router.get('/insights', dashboardController.getInsights);

module.exports = router;
