const express = require('express');
const router = express.Router();
const supplierController = require('../../controllers/suppliers/supplierController');
const { authenticate } = require('../../middlewares/auth');
const auditLogger = require('../../middlewares/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management endpoints
 */

/**
 * @swagger
 * /api/v1/suppliers:
 *   get:
 *     summary: Get all suppliers
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get('/', authenticate, supplierController.getSuppliers);

/**
 * @swagger
 * /api/v1/suppliers/stats:
 *   get:
 *     summary: Get supplier statistics
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supplier statistics
 */
router.get('/stats', authenticate, supplierController.getSupplierStats);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier details
 *       404:
 *         description: Supplier not found
 */
router.get('/:id', authenticate, supplierController.getSupplierById);

/**
 * @swagger
 * /api/v1/suppliers:
 *   post:
 *     summary: Create new supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Supplier created successfully
 */
router.post('/', authenticate, auditLogger.logActivity('SUPPLIER_CREATED', 'supplier'), supplierController.createSupplier);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Supplier updated successfully
 */
router.put('/:id', authenticate, auditLogger.logActivity('SUPPLIER_UPDATED', 'supplier'), supplierController.updateSupplier);

/**
 * @swagger
 * /api/v1/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier deleted successfully
 */
router.delete('/:id', authenticate, auditLogger.logActivity('SUPPLIER_DELETED', 'supplier'), supplierController.deleteSupplier);

module.exports = router;
