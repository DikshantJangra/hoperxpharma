const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 200, // Increased for testing and legitimate retries
};

module.exports = {
    RATE_LIMIT,
};
