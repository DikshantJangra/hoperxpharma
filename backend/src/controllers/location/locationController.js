const locationRepository = require('../../repositories/locationRepository');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');
const dayjs = require('dayjs');

/**
 * Location Controller - HTTP handlers for location intelligence
 */

/**
 * Create or update location
 */
exports.upsertLocation = asyncHandler(async (req, res) => {
    const { code, name, type, parentLocationId } = req.body;
    const storeId = req.user.storeId;

    const location = await locationRepository.upsertLocation(storeId, {
        code,
        name,
        type,
        parentLocationId
    });

    res.json({
        success: true,
        message: 'Location saved successfully',
        data: location
    });
});

/**
 * Get all locations for store
 */
exports.getStoreLocations = asyncHandler(async (req, res) => {
    const storeId = req.user.storeId;

    const locations = await locationRepository.getStoreLocations(storeId);

    res.json({
        success: true,
        data: locations
    });
});

/**
 * Map drug to location
 */
exports.mapDrugToLocation = asyncHandler(async (req, res) => {
    const { drugId, locationId, confidence } = req.body;

    const mapping = await locationRepository.mapDrugToLocation(drugId, locationId, confidence);

    res.json({
        success: true,
        message: 'Drug mapped to location',
        data: mapping
    });
});

/**
 * Get drug location mapping
 */
exports.getDrugLocation = asyncHandler(async (req, res) => {
    const { drugId } = req.params;

    const mapping = await locationRepository.getDrugLocation(drugId);

    res.json({
        success: true,
        data: mapping
    });
});

/**
 * Get location mismatches for analysis
 */
exports.getLocationMismatches = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const storeId = req.user.storeId;

    const start = startDate ? new Date(startDate) : dayjs().subtract(30, 'days').toDate();
    const end = endDate ? new Date(endDate) : new Date();

    const mismatches = await locationRepository.getLocationMismatches(storeId, start, end);

    res.json({
        success: true,
        data: mismatches
    });
});

module.exports = exports;
