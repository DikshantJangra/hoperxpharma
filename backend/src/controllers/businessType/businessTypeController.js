const businessTypeService = require('../../services/businessTypeService');
const asyncHandler = require('../../middlewares/asyncHandler');

/**
 * @route   GET /api/v1/business-types
 * @desc    Get all business type configurations
 * @access  Public (for onboarding)
 */
exports.listBusinessTypes = asyncHandler(async (req, res) => {
    const configs = await businessTypeService.getAllConfigs();

    res.json({
        success: true,
        data: configs
    });
});

/**
 * @route   GET /api/v1/business-types/summary
 * @desc    Get simplified business type list (for dropdowns)
 * @access  Public (for onboarding)
 */
exports.getBusinessTypeSummary = asyncHandler(async (req, res) => {
    const summary = await businessTypeService.getBusinessTypeSummary();

    res.json({
        success: true,
        data: summary
    });
});

/**
 * @route   GET /api/v1/business-types/:type/config
 * @desc    Get configuration for a specific business type
 * @access  Public (for onboarding)
 */
exports.getBusinessTypeConfig = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const config = await businessTypeService.getConfig(type);

    if (!config) {
        return res.status(404).json({
            success: false,
            message: `Business type not found: ${type}`
        });
    }

    res.json({
        success: true,
        data: config
    });
});

/**
 * @route   GET /api/v1/business-types/:type/sidebar
 * @desc    Get sidebar configuration for a business type
 * @access  Authenticated
 */
exports.getSidebarConfig = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const sidebarConfig = await businessTypeService.getSidebarConfig(type);

    res.json({
        success: true,
        data: sidebarConfig
    });
});

/**
 * @route   GET /api/v1/business-types/:type/features
 * @desc    Get enabled features for a business type
 * @access  Authenticated
 */
exports.getEnabledFeatures = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const features = await businessTypeService.getEnabledFeatures(type);

    res.json({
        success: true,
        data: features
    });
});

/**
 * @route   GET /api/v1/stores/:storeId/feature-config
 * @desc    Get complete feature configuration for a store
 * @access  Authenticated (store member)
 */
exports.getStoreFeatureConfig = asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    // TODO: Add authorization check - user must be member of this store

    const config = await businessTypeService.getStoreFeatureConfig(storeId);

    res.json({
        success: true,
        data: config
    });
});

/**
 * @route   PUT /api/v1/stores/:storeId/feature-overrides
 * @desc    Update store-specific feature overrides
 * @access  Admin only
 */
exports.updateStoreFeatureOverrides = asyncHandler(async (req, res) => {
    const { storeId } = req.params;
    const { overrides } = req.body;

    // TODO: Add authorization check - user must be admin of this store

    const updatedStore = await businessTypeService.updateStoreFeatureOverrides(
        storeId,
        overrides,
        req.user.id
    );

    res.json({
        success: true,
        data: updatedStore,
        message: 'Feature overrides updated successfully'
    });
});

/**
 * @route   GET /api/v1/stores/:storeId/sidebar
 * @desc    Get sidebar configuration for a specific store (with overrides)
 * @access  Authenticated (store member)
 */
exports.getStoreSidebarConfig = asyncHandler(async (req, res) => {
    const { storeId } = req.params;

    // Get store details
    const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
            businessType: true,
            featureOverrides: true
        }
    });

    if (!store) {
        return res.status(404).json({
            success: false,
            message: 'Store not found'
        });
    }

    if (!store.businessType) {
        return res.status(400).json({
            success: false,
            message: 'Store has no business type configured'
        });
    }

    const sidebarConfig = await businessTypeService.getSidebarConfig(
        store.businessType,
        store.featureOverrides
    );

    res.json({
        success: true,
        data: sidebarConfig
    });
});
