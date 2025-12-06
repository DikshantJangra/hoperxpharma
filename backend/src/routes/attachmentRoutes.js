const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/po-attachments/request-upload
 * @desc    Request presigned URL for attachment upload
 * @access  Private
 */
router.post('/request-upload', attachmentController.requestUpload);

/**
 * @route   POST /api/v1/po-attachments/complete-upload
 * @desc    Complete attachment upload and process file
 * @access  Private
 */
router.post('/complete-upload', attachmentController.completeUpload);

/**
 * @route   GET /api/v1/po-attachments/:poId
 * @desc    Get all attachments for a PO
 * @access  Private
 */
router.get('/:poId', attachmentController.getAttachments);

/**
 * @route   DELETE /api/v1/po-attachments/:id
 * @desc    Delete an attachment
 * @access  Private
 */
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
