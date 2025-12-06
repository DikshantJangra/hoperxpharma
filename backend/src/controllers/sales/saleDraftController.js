const saleDraftService = require('../../services/sales/saleDraftService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Save draft (create or update)
 */
const saveDraft = asyncHandler(async (req, res) => {
    const draft = await saleDraftService.saveDraft({
        ...req.body,
        storeId: req.storeId,
        createdBy: req.user.id,
    });

    const response = ApiResponse.created(draft, 'Draft saved successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update existing draft
 */
const updateDraft = asyncHandler(async (req, res) => {
    const draft = await saleDraftService.updateDraft(req.params.id, req.body);

    const response = ApiResponse.success(draft, 'Draft updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get all drafts
 */
const getDrafts = asyncHandler(async (req, res) => {
    const { drafts, total } = await saleDraftService.getDrafts(req.storeId, req.query);

    const response = ApiResponse.paginated(drafts, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get draft by ID
 */
const getDraftById = asyncHandler(async (req, res) => {
    const draft = await saleDraftService.getDraftById(req.params.id);

    const response = ApiResponse.success(draft);
    res.status(response.statusCode).json(response);
});

/**
 * Convert draft to sale
 */
const convertDraftToSale = asyncHandler(async (req, res) => {
    const sale = await saleDraftService.convertDraftToSale(
        req.params.id,
        req.body.paymentSplits
    );

    const response = ApiResponse.success(sale, 'Draft converted to sale successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete draft
 */
const deleteDraft = asyncHandler(async (req, res) => {
    await saleDraftService.deleteDraft(req.params.id);

    const response = ApiResponse.success(null, 'Draft deleted successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Cleanup expired drafts (cron endpoint)
 */
const cleanupExpiredDrafts = asyncHandler(async (req, res) => {
    const count = await saleDraftService.cleanupExpiredDrafts();

    const response = ApiResponse.success({ count }, `Cleaned up ${count} expired drafts`);
    res.status(response.statusCode).json(response);
});

module.exports = {
    saveDraft,
    updateDraft,
    getDrafts,
    getDraftById,
    convertDraftToSale,
    deleteDraft,
    cleanupExpiredDrafts,
};
