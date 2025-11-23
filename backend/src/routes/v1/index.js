const express = require('express');
const authRoutes = require('./auth.routes');
const inventoryRoutes = require('./inventory.routes');
const patientRoutes = require('./patients.routes');
const salesRoutes = require('./sales.routes');
const purchaseOrderRoutes = require('./purchaseOrders.routes');
const onboardingRoutes = require('./onboarding.routes');
const storeRoutes = require('./stores.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

/**
 * API v1 Routes
 */
router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/stores', storeRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/patients', patientRoutes);
router.use('/sales', salesRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);

// Health check route
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

module.exports = router;
