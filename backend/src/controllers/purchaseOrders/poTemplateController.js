const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const poTemplateService = require('../../services/purchaseOrders/poTemplateService');

/**
 * Get all templates for a store
 */
const getTemplates = asyncHandler(async (req, res) => {
    const { storeId } = req.user;
    const { isActive, limit } = req.query;

    const templates = await poTemplateService.getTemplates(storeId, {
        isActive: isActive !== 'false',
        limit: limit ? parseInt(limit) : 50
    });

    const response = ApiResponse.success(templates, 'Templates retrieved successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get template by ID
 */
const getTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId } = req.user;

    const template = await poTemplateService.getTemplateById(id, storeId);

    const response = ApiResponse.success(template, 'Template retrieved successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Create new template
 */
const createTemplate = asyncHandler(async (req, res) => {
    const { storeId, userId } = req.user;

    const template = await poTemplateService.createTemplate(storeId, req.body, userId);

    const response = ApiResponse.success(template, 'Template created successfully', 201);
    res.status(response.statusCode).json(response);
});

/**
 * Update template
 */
const updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId, userId } = req.user;

    const template = await poTemplateService.updateTemplate(id, storeId, req.body, userId);

    const response = ApiResponse.success(template, 'Template updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete template
 */
const deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId } = req.user;

    await poTemplateService.deleteTemplate(id, storeId);

    const response = ApiResponse.success(null, 'Template deleted successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Load template (returns template data for PO creation)
 */
const loadTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId } = req.user;

    const templateData = await poTemplateService.loadTemplate(id, storeId);

    const response = ApiResponse.success(templateData, 'Template loaded successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Duplicate template
 */
const duplicateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId, userId } = req.user;

    const duplicate = await poTemplateService.duplicateTemplate(id, storeId, userId);

    const response = ApiResponse.success(duplicate, 'Template duplicated successfully', 201);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    loadTemplate,
    duplicateTemplate
};
