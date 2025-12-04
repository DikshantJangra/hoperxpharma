const drugService = require('../../services/drugs/drugService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const multer = require('multer');
const path = require('path');

// Configure multer for CSV upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/drugs/');
    },
    filename: (req, file, cb) => {
        cb(null, `drugs-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * Search drugs with fuzzy matching
 */
const searchDrugs = asyncHandler(async (req, res) => {
    const { q, supplierId, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
        return res.status(200).json(ApiResponse.success([]));
    }

    // Extract storeId from authenticated user
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;

    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const drugs = await drugService.searchDrugs({
        query: q.trim(),
        storeId,
        supplierId,
        limit: parseInt(limit)
    });

    const response = ApiResponse.success(drugs);
    res.status(response.statusCode).json(response);
});

/**
 * Get drug by ID with inventory details
 */
const getDrugById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { storeId } = req.query;

    const drug = await drugService.getDrugById(id, storeId);

    const response = ApiResponse.success(drug);
    res.status(response.statusCode).json(response);
});

/**
 * Import drugs from CSV file
 */
const importDrugsFromCSV = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json(ApiResponse.error('No file uploaded', 400));
    }

    const result = await drugService.importFromCSV(req.file.path);

    const response = ApiResponse.success(result, 'Drugs imported successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Create a new drug manually
 */
const createDrug = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;

    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const drugData = { ...req.body, storeId };
    const drug = await drugService.createDrug(drugData);

    const response = ApiResponse.created(drug, 'Drug created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update drug
 */
const updateDrug = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const drug = await drugService.updateDrug(id, req.body);

    const response = ApiResponse.success(drug, 'Drug updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get all drugs (paginated)
 */
const getAllDrugs = asyncHandler(async (req, res) => {
    // Extract storeId from authenticated user
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;

    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const filters = { ...req.query, storeId };
    const { drugs, total } = await drugService.getAllDrugs(filters);

    const response = ApiResponse.paginated(drugs, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

module.exports = {
    searchDrugs,
    getDrugById,
    importDrugsFromCSV,
    createDrug,
    updateDrug,
    getAllDrugs,
    upload
};
