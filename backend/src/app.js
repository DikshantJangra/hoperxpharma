const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const { validateEnv } = require('./config/env');
const { specs, swaggerUi } = require('./config/swagger');
const requestLogger = require('./middlewares/requestLogger');
const { generalLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const routes = require('./routes/v1');
const logger = require('./config/logger');

// Validate environment variables
validateEnv();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Dynamically configure allowed origins based on environment
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://hoperxpharma.vercel.app'
];

// In development, always allow localhost
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000');
  logger.info('CORS: Development mode - allowing localhost origins');
}

logger.info(`CORS: Allowed origins - ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Request logging
app.use(requestLogger);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Rate limiting
app.use('/api', generalLimiter);

// API Routes
app.use('/api/v1', routes);

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

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