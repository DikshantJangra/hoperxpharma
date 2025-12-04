# HopeRxPharma Backend API

Scalable, industry-standard backend for comprehensive pharmacy management system.

## Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens, RBAC, multi-store support
- **Inventory Management**: Drug catalog, batch tracking, FIFO/FEFO, low stock & expiry alerts
- **Patient Management**: CRUD operations, consent management, GDPR/DPDPA compliance
- **Sales & Payments**: Invoice generation, payment splits, inventory deduction
- **Purchase Orders**: Supplier management, PO workflow, receipt tracking
- **Comprehensive Logging**: Winston logger with file rotation
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Security**: Helmet, rate limiting, input validation, CORS
- **Error Handling**: Centralized error handling with detailed logging

## Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

## Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=8000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hoperxpharma"

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters"
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# View database in Prisma Studio
npx prisma studio
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/api-docs
- **Health Check**: http://localhost:8000/api/v1/health

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files (database, logger, swagger, env)
│   ├── middlewares/      # Express middlewares (auth, RBAC, validation, error handling)
│   ├── controllers/      # Route handlers organized by domain
│   ├── services/         # Business logic layer
│   ├── repositories/     # Data access layer (Prisma queries)
│   ├── validators/       # Zod validation schemas
│   ├── routes/           # API routes (versioned)
│   ├── utils/            # Utility functions (ApiError, ApiResponse, constants)
│   ├── app.js            # Express app setup
│   └── server.js         # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema (68 tables)
│   ├── seed.ts           # Database seeding
│   └── migrations/       # Database migrations
├── logs/                 # Application logs
└── tests/                # Test files

```

## Authentication

### Signup
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "9876543210",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Protected Routes
Include the access token in the Authorization header:
```bash
Authorization: Bearer <access_token>
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/profile` - Get user profile

### Inventory
- `GET /api/v1/inventory/drugs` - List all drugs
- `POST /api/v1/inventory/drugs` - Create drug
- `GET /api/v1/inventory/drugs/:id` - Get drug details
- `PUT /api/v1/inventory/drugs/:id` - Update drug
- `GET /api/v1/inventory/batches` - List inventory batches
- `POST /api/v1/inventory/batches` - Create batch
- `GET /api/v1/inventory/batches/:id` - Get batch details
- `PUT /api/v1/inventory/batches/:id` - Update batch
- `POST /api/v1/inventory/stock/adjust` - Adjust stock
- `GET /api/v1/inventory/alerts/low-stock` - Low stock alerts
- `GET /api/v1/inventory/alerts/expiring` - Expiring items
- `GET /api/v1/inventory/summary` - Inventory summary

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Prevention**: Input sanitization
- **CORS**: Configured allowed origins
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds

## Database Schema

68 tables organized into 16 categories:
1. Core Infrastructure (12 tables)
2. Patient & Clinical (5 tables)
3. Drug Catalog (2 tables)
4. Inventory (6 tables)
5. Prescription & Dispensing (7 tables)
6. Purchase Orders (5 tables)
7. Sales & Payments (9 tables)
8. Bank Reconciliation (3 tables)
9. Payment Gateway (4 tables)
10. GST & Compliance (4 tables)
11. WhatsApp (4 tables)
12. Multi-Channel Messaging (2 tables)
13. Engagement (5 tables)
14. Audit & Compliance (3 tables)
15. API Integration (3 tables)
16. Backup & Documents (3 tables)

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## Deployment

1. Set `NODE_ENV=production`
2. Update JWT secrets with strong random values
3. Configure production database URL
4. Set up SSL/TLS certificates
5. Configure reverse proxy (Nginx/Apache)
6. Set up monitoring and alerting
7. Configure automated backups

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update API documentation
4. Follow ESLint rules
5. Use conventional commits

## License

Proprietary - HopeRxPharma

## Support

For issues and questions, contact: support@hoperxpharma.com
