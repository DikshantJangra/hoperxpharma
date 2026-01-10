const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const { validateEnv } = require('./config/env');
const { specs, swaggerUi } = require('./config/swagger');
const requestLogger = require('./middlewares/requestLogger');
const correlationId = require('./middlewares/correlationId');
const { generalLimiter, userLimiter } = require('./middlewares/rateLimiter');
const { detectSQLInjection } = require('./middlewares/sqlInjectionDetector');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const routes = require('./routes/v1');
const logger = require('./config/logger');
const passport = require('./config/passport');

// Validate environment variables
validateEnv();

const whatsappRetryWorker = require('./workers/whatsappRetryWorker');

const app = express();

// Start background workers
whatsappRetryWorker.startWorker(60000); // Check every minute

// Trust proxy - Required for production deployment behind reverse proxy (Render, etc.)
// This allows Express to correctly read X-Forwarded-* headers
app.set('trust proxy', true);

// Security middleware - Enhanced
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true // Enable XSS filter
}));

// CORS configuration
// Strict origin validation to prevent security vulnerabilities
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://hoperxpharma.vercel.app'
];

// In development, allow localhost with specific ports only
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'https://localhost:3000', 'http://127.0.0.1:3000');
  logger.info('CORS: Development mode - allowing localhost origins');
}

// Add additional origins from environment variable (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
}

logger.info(`CORS: Allowed origins - ${allowedOrigins.join(', ')}`);

/**
 * Strict origin validator with protocol and exact match checking
 * Prevents subdomain takeover and other CORS-based attacks
 */
function isOriginAllowed(origin) {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl, Postman)

  try {
    const originUrl = new URL(origin);

    // Check against allowed origins with exact match
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        // Exact match: protocol, hostname, and port must all match
        return originUrl.protocol === allowedUrl.protocol &&
          originUrl.hostname === allowedUrl.hostname &&
          originUrl.port === allowedUrl.port;
      } catch {
        // Fallback to string comparison if URL parsing fails
        return origin === allowed;
      }
    });
  } catch {
    // If URL parsing fails, do strict string comparison
    return allowedOrigins.includes(origin);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'content-type', 'authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Debug Middleware: Log all request bodies
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log(`[DEBUG] ${req.method} ${req.path} Body:`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// Compression middleware
app.use(compression());

// Correlation ID - Must come before request logging
app.use(correlationId);

// Request logging (now includes correlation ID)
app.use(requestLogger);

// Comprehensive activity logging for behavioral detection
const { activityLogger } = require('./middlewares/activityLogger');
app.use('/api', activityLogger); // Log all API requests for behavioral analysis

// Session timeout for HIPAA compliance (15 minutes of inactivity)
const { sessionTimeout } = require('./middlewares/sessionTimeout');
app.use(sessionTimeout);

// Passport Middleware
app.use(passport.initialize());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// SQL Injection Detection (applies to all routes)
app.use(detectSQLInjection);

// Rate limiting
app.use('/api', generalLimiter); // General API rate limit
app.use('/api', userLimiter); // Per-user rate limit

// API Routes
app.use('/api/v1', routes);

// Health check routes (enhanced monitoring)
const healthRoutes = require('./routes/health');
app.use('/api/v1', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HopeRxPharma Backend API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/v1/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;