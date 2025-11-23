const express = require('express');
const saleController = require('../../controllers/sales/saleController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const { saleCreateSchema, saleQuerySchema } = require('../../validators/sale.validator');

const router = express.Router();

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

/**
 * Sale routes
 */
router.get('/', validate(saleQuerySchema, 'query'), saleController.getSales);
router.get('/stats', saleController.getSalesStats);
router.get('/top-selling', saleController.getTopSellingDrugs);
router.get('/invoice/:invoiceNumber', saleController.getSaleByInvoiceNumber);
router.get('/:id', saleController.getSaleById);
router.post('/', validate(saleCreateSchema), saleController.createSale);

module.exports = router;
