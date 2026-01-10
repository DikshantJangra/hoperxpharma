const express = require('express');
const router = express.Router();
const locationController = require('../../controllers/location/locationController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/location
 * @desc    Create or update location
 * @access  Private
 */
router.post('/', locationController.upsertLocation);

/**
 * @route   GET /api/v1/location
 * @desc    Get all locations for store
 * @access  Private
 */
router.get('/', locationController.getStoreLocations);

/**
 * @route   POST /api/v1/location/map
 * @desc    Map drug to location
 * @access  Private
 */
router.post('/map', locationController.mapDrugToLocation);

/**
 * @route   GET /api/v1/location/drug/:drugId
 * @desc    Get drug location mapping
 * @access  Private
 */
router.get('/drug/:drugId', locationController.getDrugLocation);

/**
 * @route   GET /api/v1/location/mismatches
 * @desc    Get location mismatches
 * @access  Private
 */
router.get('/mismatches', locationController.getLocationMismatches);

module.exports = router;
