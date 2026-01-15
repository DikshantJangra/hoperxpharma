/**
 * Medicine Image Routes
 * 
 * Handles image uploads, contribution workflow, and retrieval.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
 */

const express = require('express');
const multer = require('multer');
const { imageContributionService } = require('../../services/ImageContributionService');
const { authenticate } = require('../../middlewares/auth');
const { asyncHandler } = require('../../middlewares/errorHandler');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/medicines/:canonicalId/images
 * Upload image for a medicine
 */
router.post(
  '/:canonicalId/images',
  authenticate,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const { canonicalId } = req.params;
    const { imageType = 'FRONT' } = req.body;
    const storeId = req.user.storeId;

    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FILE',
          message: 'No image file provided',
        },
      });
    }

    const result = await imageContributionService.uploadImage({
      canonicalId,
      storeId,
      imageType,
      file: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    // Check if medicine needs global image contribution
    if (!result.isDuplicate) {
      const needsContribution = await imageContributionService.needsGlobalImageContribution(
        canonicalId,
        imageType
      );

      if (needsContribution) {
        result.contributionPrompt = {
          message: 'This medicine does not have a global image. Would you like to contribute yours?',
          canContribute: true,
        };
      }
    }

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/v1/medicines/:canonicalId/images
 * Get all images for a medicine
 */
router.get('/:canonicalId/images', authenticate, asyncHandler(async (req, res) => {
  const { canonicalId } = req.params;
  const storeId = req.user.storeId;

  const images = await imageContributionService.getImagesForMedicine(
    canonicalId,
    storeId
  );

  res.json({
    success: true,
    data: images,
    count: images.length,
  });
}));

/**
 * POST /api/v1/medicines/images/:imageId/contribute
 * Contribute store image as global image
 */
router.post('/images/:imageId/contribute', authenticate, asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const storeId = req.user.storeId;

  const result = await imageContributionService.contributeAsGlobal(
    imageId,
    storeId
  );

  if (!result.success) {
    return res.status(400).json({
      error: {
        code: 'CONTRIBUTION_FAILED',
        message: result.message,
      },
    });
  }

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * GET /api/v1/medicines/images/:imageId/status
 * Get contribution status for an image
 */
router.get('/images/:imageId/status', authenticate, asyncHandler(async (req, res) => {
  const { imageId } = req.params;

  const status = await imageContributionService.getContributionStatus(imageId);

  if (!status) {
    return res.status(404).json({
      error: {
        code: 'IMAGE_NOT_FOUND',
        message: 'Image not found',
      },
    });
  }

  res.json({
    success: true,
    data: status,
  });
}));

/**
 * DELETE /api/v1/medicines/images/:imageId
 * Delete an image (store-owned only)
 */
router.delete('/images/:imageId', authenticate, asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const storeId = req.user.storeId;

  const deleted = await imageContributionService.deleteImage(imageId, storeId);

  if (!deleted) {
    return res.status(404).json({
      error: {
        code: 'IMAGE_NOT_FOUND',
        message: 'Image not found',
      },
    });
  }

  res.json({
    success: true,
    message: 'Image deleted successfully',
  });
}));

/**
 * GET /api/v1/medicines/images/stats
 * Get image statistics (admin only)
 */
router.get('/images/stats', authenticate, asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  const stats = await imageContributionService.getImageStats();

  res.json({
    success: true,
    data: stats,
  });
}));

module.exports = router;
