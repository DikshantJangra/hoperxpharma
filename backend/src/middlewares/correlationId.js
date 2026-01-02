const { v4: uuidv4 } = require('uuid');

/**
 * Correlation ID Middleware
 * 
 * Adds a unique correlation ID to every request for distributed tracing.
 * - Checks for existing X-Correlation-ID header (from client or upstream)
 * - Generates new UUID if not present
 * - Attaches to request object for use in logging
 * - Returns in response header for client-side tracking
 * 
 * Example usage in logs:
 *   const reqLogger = logger.withCorrelationId(req.correlationId);
 *   reqLogger.info('Processing payment', { amount: 100 });
 */

const correlationId = (req, res, next) => {
    // Check if correlation ID already exists in request header
    // This allows clients or API gateways to pass their own correlation IDs
    const existingId = req.headers['x-correlation-id'] ||
        req.headers['x-request-id'] ||
        req.headers['x-trace-id'];

    // Use existing ID or generate new one
    const correlationId = existingId || uuidv4();

    // Attach to request object for access in controllers/services
    req.correlationId = correlationId;

    // Return in response header so client can track the request
    res.setHeader('X-Correlation-ID', correlationId);

    // Also set as X-Request-ID for compatibility with common tools
    res.setHeader('X-Request-ID', correlationId);

    next();
};

module.exports = correlationId;
