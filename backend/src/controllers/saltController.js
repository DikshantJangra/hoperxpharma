const saltService = require('../services/saltService');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Search salts
 * GET /api/salts/search?query=paracetamol&includeAliases=true&limit=20&page=1
 */
exports.searchSalts = asyncHandler(async (req, res) => {
    const { query, includeAliases, limit, page } = req.query;

    const result = await saltService.searchSalts({
        query,
        includeAliases: includeAliases !== 'false',
        limit,
        page
    });

    res.json(ApiResponse.success(result, 'Salts retrieved successfully'));
});

/**
 * Get all salts with pagination
 * GET /api/salts?page=1&limit=50&highRiskOnly=false&category=Antibiotic
 */
exports.getAllSalts = asyncHandler(async (req, res) => {
    const { page, limit, highRiskOnly, category } = req.query;

    const result = await saltService.getAllSalts({
        page,
        limit,
        highRiskOnly: highRiskOnly === 'true',
        category
    });

    res.json(ApiResponse.success(result, 'Salts retrieved successfully'));
});

/**
 * Get salt by ID
 * GET /api/salts/:id
 */
exports.getSaltById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const salt = await saltService.getSaltById(id);

    res.json(ApiResponse.success(salt, 'Salt retrieved successfully'));
});

/**
 * Create new salt
 * POST /api/salts
 */
exports.createSalt = asyncHandler(async (req, res) => {
    const saltData = {
        ...req.body,
        createdById: req.user?.id // From auth middleware
    };

    const salt = await saltService.createSalt(saltData);

    res.status(201).json(ApiResponse.success(salt, 'Salt created successfully'));
});

/**
 * Add alias to salt
 * POST /api/salts/:id/aliases
 */
exports.addAlias = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { alias } = req.body;

    const salt = await saltService.addAlias(id, alias);

    res.json(ApiResponse.success(salt, 'Alias added successfully'));
});

/**
 * Remove alias from salt
 * DELETE /api/salts/:id/aliases/:alias
 */
exports.removeAlias = asyncHandler(async (req, res) => {
    const { id, alias } = req.params;

    const salt = await saltService.removeAlias(id, decodeURIComponent(alias));

    res.json(ApiResponse.success(salt, 'Alias removed successfully'));
});

/**
 * Mark salt as high risk
 * PATCH /api/salts/:id/high-risk
 */
exports.markHighRisk = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const salt = await saltService.markHighRisk(id);

    res.json(ApiResponse.success(salt, 'Salt marked as high risk'));
});

/**
 * Get salt statistics
 * GET /api/salts/stats
 */
exports.getStatistics = asyncHandler(async (req, res) => {
    const stats = await saltService.getStatistics();

    res.json(ApiResponse.success(stats, 'Statistics retrieved successfully'));
});

/**
 * Find salt by name or alias
 * GET /api/salts/find/:name
 */
exports.findByNameOrAlias = asyncHandler(async (req, res) => {
    const { name } = req.params;

    const salt = await saltService.findByNameOrAlias(name);

    if (!salt) {
        res.json(ApiResponse.success(null, 'Salt not found'));
    } else {
        res.json(ApiResponse.success(salt, 'Salt found'));
    }
});
