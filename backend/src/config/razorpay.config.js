/**
 * Razorpay Configuration Module
 * Environment-aware configuration for Razorpay integration
 */

const Razorpay = require('razorpay');

/**
 * Get Razorpay configuration based on environment
 */
const getRazorpayConfig = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';

    // Determine mode from environment variable or infer from NODE_ENV
    const mode = process.env.RAZORPAY_MODE || (isProduction ? 'live' : 'test');

    const config = {
        mode,
        isLiveMode: mode === 'live',
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    };

    // Validate configuration
    validateConfig(config);

    return config;
};

/**
 * Validate Razorpay configuration
 */
const validateConfig = (config) => {
    const { mode, keyId, keySecret } = config;

    if (!keyId || !keySecret) {
        throw new Error(
            'Razorpay configuration incomplete. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
        );
    }

    // Validate key format based on mode
    if (mode === 'live') {
        if (!keyId.startsWith('rzp_live_')) {
            console.warn(
                '⚠️  WARNING: RAZORPAY_MODE is set to "live" but key ID does not start with "rzp_live_"'
            );
        }
    } else {
        if (!keyId.startsWith('rzp_test_')) {
            console.warn(
                '⚠️  WARNING: RAZORPAY_MODE is set to "test" but key ID does not start with "rzp_test_"'
            );
        }
    }

    // Warn if webhook secret is missing
    if (!config.webhookSecret) {
        console.warn(
            '⚠️  WARNING: RAZORPAY_WEBHOOK_SECRET not set. Webhook signature verification will fail.'
        );
    }
};

/**
 * Create Razorpay client instance
 */
const createRazorpayInstance = () => {
    const config = getRazorpayConfig();

    const instance = new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret
    });

    // Log configuration (without exposing secrets)
    console.log(`✅ Razorpay initialized in ${config.mode.toUpperCase()} mode`);
    console.log(`   Key ID: ${config.keyId.substring(0, 15)}...`);

    return instance;
};

/**
 * Get public Razorpay key (safe to send to frontend)
 */
const getPublicKey = () => {
    const config = getRazorpayConfig();
    return config.keyId;
};

/**
 * Get webhook secret (for signature verification)
 */
const getWebhookSecret = () => {
    const config = getRazorpayConfig();
    return config.webhookSecret;
};

/**
 * Check if currently in live mode
 */
const isLiveMode = () => {
    const config = getRazorpayConfig();
    return config.isLiveMode;
};

/**
 * Get mode string
 */
const getMode = () => {
    const config = getRazorpayConfig();
    return config.mode;
};

module.exports = {
    getRazorpayConfig,
    createRazorpayInstance,
    getPublicKey,
    getWebhookSecret,
    isLiveMode,
    getMode
};
