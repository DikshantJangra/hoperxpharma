const savedFilterService = require('../../services/audit/savedFilterService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

class SavedFilterController {
    createSavedFilter = asyncHandler(async (req, res) => {
        const filter = await savedFilterService.createSavedFilter(req.user.id, req.body);
        res.status(201).json(new ApiResponse(201, filter, 'Saved filter created successfully'));
    });

    getSavedFilters = asyncHandler(async (req, res) => {
        const filters = await savedFilterService.getSavedFilters(req.user.id);
        res.status(200).json(new ApiResponse(200, filters, 'Saved filters retrieved successfully'));
    });

    deleteSavedFilter = asyncHandler(async (req, res) => {
        await savedFilterService.deleteSavedFilter(req.user.id, req.params.id);
        res.status(200).json(new ApiResponse(200, null, 'Saved filter deleted successfully'));
    });
}

module.exports = new SavedFilterController();
