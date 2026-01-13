const express = require('express');
const { extractTextFromImage } = require('../../services/ocrService');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

/**
 * POST /api/v1/ocr/extract
 * Extract text from image using Google Vision API
 */
router.post('/extract', async (req, res, next) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      throw ApiError.badRequest('Image data is required');
    }

    console.log('[OCR] Processing image, size:', image.length, 'bytes');

    const result = await extractTextFromImage(image, mimeType);

    console.log('[OCR] Extraction complete, text length:', result.text.length);

    res.json(result);
  } catch (error) {
    console.error('[OCR] Error:', error);
    next(error);
  }
});

module.exports = router;
