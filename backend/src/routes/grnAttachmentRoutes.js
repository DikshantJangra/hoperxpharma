const express = require('express');
const router = express.Router();
const grnAttachmentController = require('../controllers/grnAttachmentController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/grn-attachments/request-upload
 * @desc    Request presigned URL for GRN attachment upload
 * @access  Private
 */
router.post('/request-upload', grnAttachmentController.requestUpload);

/**
 * @route   POST /api/v1/grn-attachments/complete-upload
 * @desc    Complete GRN attachment upload and process file
 * @access  Private
 */
router.post('/complete-upload', grnAttachmentController.completeUpload);

/**
 * @route   GET /api/v1/grn-attachments/:grnId
 * @desc    Get all attachments for a GRN
 * @access  Private
 */
router.get('/:grnId', grnAttachmentController.getAttachments);

/**
 * @route   DELETE /api/v1/grn-attachments/:id
 * @desc    Delete GRN attachment
 * @access  Private
 */
router.delete('/:id', grnAttachmentController.deleteAttachment);

module.exports = router;
