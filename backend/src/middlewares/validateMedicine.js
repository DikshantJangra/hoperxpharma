/**
 * Medicine Input Validation Middleware
 * 
 * Validates medicine data before processing
 * Requirements: 9.7
 */

const ApiError = require('../utils/ApiError');

/**
 * Validate medicine creation input
 */
const validateCreateMedicine = (req, res, next) => {
  const { body } = req;
  const errors = [];

  // Required fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
    errors.push('name must be at least 3 characters');
  }

  if (!body.compositionText || typeof body.compositionText !== 'string' || body.compositionText.trim().length < 3) {
    errors.push('compositionText must be at least 3 characters');
  }

  if (!body.manufacturerName || typeof body.manufacturerName !== 'string' || body.manufacturerName.trim().length < 2) {
    errors.push('manufacturerName must be at least 2 characters');
  }

  if (!body.form || typeof body.form !== 'string' || body.form.trim().length === 0) {
    errors.push('form is required');
  }

  if (!body.packSize || typeof body.packSize !== 'string' || body.packSize.trim().length === 0) {
    errors.push('packSize is required');
  }

  if (body.requiresPrescription === undefined || typeof body.requiresPrescription !== 'boolean') {
    errors.push('requiresPrescription must be a boolean');
  }

  if (body.defaultGstRate === undefined || typeof body.defaultGstRate !== 'number' || body.defaultGstRate < 0 || body.defaultGstRate > 28) {
    errors.push('defaultGstRate must be a number between 0 and 28');
  }

  // Optional fields validation
  if (body.genericName !== undefined && (typeof body.genericName !== 'string' || body.genericName.trim().length < 2)) {
    errors.push('genericName must be at least 2 characters if provided');
  }

  if (body.schedule !== undefined && typeof body.schedule !== 'string') {
    errors.push('schedule must be a string if provided');
  }

  if (body.hsnCode !== undefined && typeof body.hsnCode !== 'string') {
    errors.push('hsnCode must be a string if provided');
  }

  if (body.primaryBarcode !== undefined && typeof body.primaryBarcode !== 'string') {
    errors.push('primaryBarcode must be a string if provided');
  }

  if (body.alternateBarcodes !== undefined && !Array.isArray(body.alternateBarcodes)) {
    errors.push('alternateBarcodes must be an array if provided');
  }

  if (body.confidenceScore !== undefined && (typeof body.confidenceScore !== 'number' || body.confidenceScore < 0 || body.confidenceScore > 100)) {
    errors.push('confidenceScore must be a number between 0 and 100 if provided');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(`Validation failed: ${errors.join(', ')}`));
  }

  next();
};

/**
 * Validate medicine update input
 */
const validateUpdateMedicine = (req, res, next) => {
  const { body } = req;
  const errors = [];

  // All fields are optional for update, but if provided must be valid
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length < 3)) {
    errors.push('name must be at least 3 characters if provided');
  }

  if (body.compositionText !== undefined && (typeof body.compositionText !== 'string' || body.compositionText.trim().length < 3)) {
    errors.push('compositionText must be at least 3 characters if provided');
  }

  if (body.manufacturerName !== undefined && (typeof body.manufacturerName !== 'string' || body.manufacturerName.trim().length < 2)) {
    errors.push('manufacturerName must be at least 2 characters if provided');
  }

  if (body.form !== undefined && (typeof body.form !== 'string' || body.form.trim().length === 0)) {
    errors.push('form cannot be empty if provided');
  }

  if (body.packSize !== undefined && (typeof body.packSize !== 'string' || body.packSize.trim().length === 0)) {
    errors.push('packSize cannot be empty if provided');
  }

  if (body.requiresPrescription !== undefined && typeof body.requiresPrescription !== 'boolean') {
    errors.push('requiresPrescription must be a boolean if provided');
  }

  if (body.defaultGstRate !== undefined && (typeof body.defaultGstRate !== 'number' || body.defaultGstRate < 0 || body.defaultGstRate > 28)) {
    errors.push('defaultGstRate must be a number between 0 and 28 if provided');
  }

  if (body.confidenceScore !== undefined && (typeof body.confidenceScore !== 'number' || body.confidenceScore < 0 || body.confidenceScore > 100)) {
    errors.push('confidenceScore must be a number between 0 and 100 if provided');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(`Validation failed: ${errors.join(', ')}`));
  }

  next();
};

/**
 * Validate store overlay input
 */
const validateStoreOverlay = (req, res, next) => {
  const { body } = req;
  const errors = [];

  if (body.customMrp !== undefined && (typeof body.customMrp !== 'number' || body.customMrp < 0)) {
    errors.push('customMrp must be a positive number if provided');
  }

  if (body.customDiscount !== undefined && (typeof body.customDiscount !== 'number' || body.customDiscount < 0 || body.customDiscount > 100)) {
    errors.push('customDiscount must be a number between 0 and 100 if provided');
  }

  if (body.customGstRate !== undefined && (typeof body.customGstRate !== 'number' || body.customGstRate < 0 || body.customGstRate > 28)) {
    errors.push('customGstRate must be a number between 0 and 28 if provided');
  }

  if (body.stockQuantity !== undefined && (typeof body.stockQuantity !== 'number' || body.stockQuantity < 0)) {
    errors.push('stockQuantity must be a non-negative number if provided');
  }

  if (body.reorderLevel !== undefined && (typeof body.reorderLevel !== 'number' || body.reorderLevel < 0)) {
    errors.push('reorderLevel must be a non-negative number if provided');
  }

  if (body.internalQrCode !== undefined && typeof body.internalQrCode !== 'string') {
    errors.push('internalQrCode must be a string if provided');
  }

  if (body.customNotes !== undefined && typeof body.customNotes !== 'string') {
    errors.push('customNotes must be a string if provided');
  }

  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    errors.push('isActive must be a boolean if provided');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(`Validation failed: ${errors.join(', ')}`));
  }

  next();
};

/**
 * Validate ingestion input
 */
const validateIngestion = (req, res, next) => {
  const { body } = req;
  const errors = [];

  // Same as create medicine validation plus source
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
    errors.push('name must be at least 3 characters');
  }

  if (!body.compositionText || typeof body.compositionText !== 'string' || body.compositionText.trim().length < 3) {
    errors.push('compositionText must be at least 3 characters');
  }

  if (!body.manufacturerName || typeof body.manufacturerName !== 'string' || body.manufacturerName.trim().length < 2) {
    errors.push('manufacturerName must be at least 2 characters');
  }

  if (!body.form || typeof body.form !== 'string' || body.form.trim().length === 0) {
    errors.push('form is required');
  }

  if (!body.packSize || typeof body.packSize !== 'string' || body.packSize.trim().length === 0) {
    errors.push('packSize is required');
  }

  if (body.requiresPrescription === undefined || typeof body.requiresPrescription !== 'boolean') {
    errors.push('requiresPrescription must be a boolean');
  }

  if (body.defaultGstRate === undefined || typeof body.defaultGstRate !== 'number' || body.defaultGstRate < 0 || body.defaultGstRate > 28) {
    errors.push('defaultGstRate must be a number between 0 and 28');
  }

  if (!body.source || !['SCAN', 'MANUAL', 'CSV_IMPORT', 'API', 'SYSTEM'].includes(body.source)) {
    errors.push('source must be one of: SCAN, MANUAL, CSV_IMPORT, API, SYSTEM');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(`Validation failed: ${errors.join(', ')}`));
  }

  next();
};

module.exports = {
  validateCreateMedicine,
  validateUpdateMedicine,
  validateStoreOverlay,
  validateIngestion,
};
