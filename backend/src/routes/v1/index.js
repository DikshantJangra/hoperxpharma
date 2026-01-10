const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const inventoryRoutes = require('./inventory.routes');
const patientRoutes = require('./patients.routes');
const salesRoutes = require('./sales.routes');
const purchaseOrderRoutes = require('./purchaseOrders.routes');
const supplierRoutes = require('./suppliers.routes');
const onboardingRoutes = require('./onboarding.routes');
const storeRoutes = require('./stores.routes');
const userRoutes = require('./user.routes');
const drugRoutes = require('./drug.routes');
const grnRoutes = require('./grn.routes');
const chatRoutes = require('./chatRoute');
const rbacRoutes = require('../rbac');
const geminiRoutes = require('../gemini.routes');
const whatsappRoutes = require('../whatsapp');
const auditRoutes = require('./audit.routes');
const reportsRoutes = require('./reports.routes');
const alertRoutes = require('./alerts.routes');
const dashboardRoutes = require('./dashboard.routes');
const avatarRoutes = require('../avatarRoutes');
const attachmentRoutes = require('../attachmentRoutes');
const grnAttachmentRoutes = require('../grnAttachmentRoutes');
const businessTypeRoutes = require('./businessType.routes');
const prescriptionRoutes = require('./prescriptions.routes');
const dispenseRoutes = require('./dispense.routes');
const portalRoutes = require('../portal.routes');
const consolidatedInvoicesRoutes = require('./consolidatedInvoices.routes');
const emailRoutes = require('../emailRoutes');
const loyaltyRoutes = require('../loyaltyRoutes');
const salesAnalyticsRoutes = require('../salesAnalyticsRoutes');
const gstRoutes = require('../gstRoutes');
const gdprRoutes = require('../gdprRoutes');
const cacheRoutes = require('../cacheRoutes');
const featuresRoutes = require('./features');
const platformConfigRoutes = require('../platformConfigRoutes');
const paymentRoutes = require('./payment.routes');
const subscriptionRoutes = require('./subscription.routes');
const scanRoutes = require('./scan.routes'); // Indian Pharmacy System - Barcode scanning
const fefoRoutes = require('./fefo.routes'); // Indian Pharmacy System - FEFO logic
const behavioralRoutes = require('./behavioral.routes'); // Indian Pharmacy System - Behavioral analytics
const locationRoutes = require('./location.routes'); // Indian Pharmacy System - Location intelligence
const supplierInvoiceRoutes = require('./supplierInvoice.routes'); // Supplier invoice compilation


const router = express.Router();

/**
 * API v1 Routes
 */
// Health checks (no authentication required)
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/stores', storeRoutes);
router.use('/users', userRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/patients', patientRoutes);
router.use('/sales', salesRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/drugs', drugRoutes);
router.use('/grn', grnRoutes);
router.use('/chat', chatRoutes);
router.use('/rbac', rbacRoutes);
router.use('/gemini', geminiRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/audit', auditRoutes);
router.use('/reports', reportsRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/avatar', avatarRoutes);
router.use('/po-attachments', attachmentRoutes);
router.use('/grn-attachments', grnAttachmentRoutes);
router.use('/business-types', businessTypeRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/dispense', dispenseRoutes);
router.use('/prescribers', require('./prescribers.routes'));
router.use('/portal', portalRoutes);
router.use('/consolidated-invoices', consolidatedInvoicesRoutes);
router.use('/supplier-invoices', supplierInvoiceRoutes); // New: Supplier invoice compilation
router.use('/email', emailRoutes);
router.use('/engage/loyalty', loyaltyRoutes);
router.use('/sales/analytics', salesAnalyticsRoutes);
router.use('/gst', gstRoutes);
router.use('/gdpr', gdprRoutes);  // GDPR compliance routes
router.use('/cache', cacheRoutes);  // Cache management (admin only)
router.use('/features', featuresRoutes);  // Feature toggle system
router.use('/platform', platformConfigRoutes);  // Platform configuration (SMTP setup)
router.use('/payments', paymentRoutes); // Razorpay Payment Routes
router.use('/subscriptions', subscriptionRoutes); // Subscription management
router.use('/scan', scanRoutes); // Indian Pharmacy System - Barcode/QR scanning
router.use('/fefo', fefoRoutes); // Indian Pharmacy System - FEFO logic
router.use('/behavioral', behavioralRoutes); // Indian Pharmacy System - Behavioral analytics
router.use('/location', locationRoutes); // Indian Pharmacy System - Location intelligence






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
