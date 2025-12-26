const express = require('express');
const router = express.Router();
const dispenseService = require('../services/prescriptions/dispenseService');
const { authenticate } = require('../middlewares/auth');

/**
 * Dispense API Routes
 * Manages operational workflow for prescription dispensing
 * Powers the Workbench Kanban board
 */

/**
 * @route   POST /api/dispenses
 * @desc    Create a dispense record (initiate dispensing)
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { refillId, prescriptionVersionId } = req.body;
        const userId = req.user.id;

        const dispense = await dispenseService.createDispense(
            refillId,
            prescriptionVersionId,
            userId
        );

        res.status(201).json({
            success: true,
            data: dispense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/dispenses/workbench
 * @desc    Get dispenses for Workbench (grouped by status)
 * @access  Private
 */
router.get('/workbench', authenticate, async (req, res) => {
    try {
        const { storeId } = req.user;

        const workbench = await dispenseService.getWorkbenchByColumns(storeId);

        res.json({
            success: true,
            data: workbench
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/dispenses/:id
 * @desc    Get dispense by ID with full details
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const dispense = await dispenseService.getDispenseById(id);

        if (!dispense) {
            return res.status(404).json({
                success: false,
                message: 'Dispense not found'
            });
        }

        res.json({
            success: true,
            data: dispense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   PATCH /api/dispenses/:id/status
 * @desc    Update dispense workflow status
 * @access  Private
 */
router.patch('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user.id;

        const updated = await dispenseService.updateStatus(id, status, userId, notes);

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/dispenses/:id/complete
 * @desc    Complete dispense after sale
 * @access  Private
 */
router.post('/:id/complete', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantityDispensed } = req.body;
        const userId = req.user.id;

        const completed = await dispenseService.completeDispense(id, userId, quantityDispensed);

        res.json({
            success: true,
            data: completed
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/dispenses/:id/cancel
 * @desc    Cancel dispense with reason
 * @access  Private
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const cancelled = await dispenseService.cancelDispense(id, userId, reason);

        res.json({
            success: true,
            data: cancelled
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
