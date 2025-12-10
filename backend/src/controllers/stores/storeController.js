const storeService = require('../../services/stores/storeService');
const subscriptionService = require('../../services/subscriptions/subscriptionService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get current user's primary store
 */
const getMyStore = asyncHandler(async (req, res) => {
    const stores = await storeService.getUserStores(req.user.id);
    const primaryStore = stores.find(s => s.isPrimary) || stores[0];

    const response = ApiResponse.success(primaryStore);
    res.status(response.statusCode).json(response);
});

/**
 * Get user's stores
 */
const getUserStores = asyncHandler(async (req, res) => {
    const stores = await storeService.getUserStores(req.user.id);

    const response = ApiResponse.success(stores);
    res.status(response.statusCode).json(response);
});

/**
 * Get store by ID
 */
const getStoreById = asyncHandler(async (req, res) => {
    const store = await storeService.getStoreById(req.params.id);

    const response = ApiResponse.success(store);
    res.status(response.statusCode).json(response);
});

/**
 * Update store
 */
const updateStore = asyncHandler(async (req, res) => {
    console.log('Controller UpdateStore Body:', JSON.stringify(req.body, null, 2));
    const store = await storeService.updateStore(req.params.id, req.body, req.user.id);

    const response = ApiResponse.success(store, 'Store updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get store statistics
 */
const getStoreStats = asyncHandler(async (req, res) => {
    const stats = await storeService.getStoreStats(req.params.id);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

/**
 * Get subscription plans
 */
const getPlans = asyncHandler(async (req, res) => {
    const plans = await subscriptionService.getPlans();

    const response = ApiResponse.success(plans);
    res.status(response.statusCode).json(response);
});

/**
 * Get store subscription
 */
const getStoreSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.getStoreSubscription(req.params.storeId);

    const response = ApiResponse.success(subscription);
    res.status(response.statusCode).json(response);
});

/**
 * Get subscription usage
 */
const getUsage = asyncHandler(async (req, res) => {
    const usage = await subscriptionService.getUsage(req.params.storeId);

    const response = ApiResponse.success(usage);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getMyStore,
    getUserStores,
    getStoreById,
    updateStore,
    getStoreStats,
    getPlans,
    getStoreSubscription,
    getUsage,
};
