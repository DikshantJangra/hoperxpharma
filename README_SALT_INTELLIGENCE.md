# Salt Intelligence Production System

A production-grade system for retail pharmacy operations that enables efficient medicine ingestion through assisted OCR, intelligent salt matching, human-confirmed mapping, and substitute discovery.

## 🎯 Features

### Core Capabilities
- **Intelligent Medicine Ingestion** - OCR-powered strip scanning with confidence scoring
- **Substitute Discovery** - Fast substitute search with exact and partial matching
- **Bulk Correction** - Mass editing of salt mappings with smart filtering
- **Dashboard Integration** - Real-time monitoring of unmapped medicines
- **POS Integration** - Automatic substitute suggestions at point of sale
- **Comprehensive Audit** - Complete change tracking and CSV export

### Performance
- ⚡ Substitute queries < 200ms
- ⚡ OCR processing < 5 seconds
- ⚡ Bulk updates handle 500+ records
- ⚡ Handles 10,000+ medicines

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Run automated setup
chmod +x setup.sh
./setup.sh

# Or manual setup:
npm install
cd backend && npm install
```

### Configuration

1. Copy environment files:
```bash
cp .env.example .env.local
cp .env.example backend/.env
```

2. Update with your database URL and settings

3. Run migrations:
```bash
cd backend
npx prisma migrate deploy
```

### Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
├── app/
│   ├── api/                      # Next.js API routes
│   │   ├── drugs/               # Drug management endpoints
│   │   ├── substitutes/         # Substitute search endpoints
│   │   └── salt-intelligence/   # Analytics & stats endpoints
│   └── (main)/inventory/
│       ├── ingest/              # Medicine ingestion interface
│       └── maintenance/         # Bulk correction tool
│
├── backend/
│   ├── src/
│   │   ├── services/            # Business logic
│   │   │   ├── drugService.js
│   │   │   ├── substituteService.js
│   │   │   ├── validationService.js
│   │   │   ├── auditService.js
│   │   │   └── cacheService.js
│   │   ├── repositories/        # Data access
│   │   └── routes/v1/           # API routes
│   ├── tests/unit/              # Property-based tests
│   └── prisma/                  # Database schema & migrations
│
├── components/
│   ├── dashboard/               # Dashboard widgets
│   └── pos/                     # POS components
│
└── lib/salt-intelligence/       # Core libraries
    ├── regex-matcher.ts         # Composition parser
    └── ocr-service.ts           # OCR processing
```

## 🧪 Testing

```bash
# Run all tests
cd backend
npm test

# Run specific test suite
npm test -- drugIngestionStatus.property.test.js

# Run with coverage
npm test -- --coverage
```

**Test Coverage**: 29+ property tests with 100 iterations each

## 📚 API Documentation

### Substitute Search
```bash
GET /api/v1/substitutes?drugId={id}&storeId={id}&includePartialMatches=true
```

### Drug Management
```bash
GET  /api/v1/drugs?storeId={id}&status=SALT_PENDING
POST /api/v1/drugs
POST /api/v1/drugs/:id/activate
POST /api/v1/drugs/bulk-update
```

### Analytics
```bash
GET /api/v1/salt-intelligence/stats?storeId={id}
GET /api/v1/salt-intelligence/analytics?storeId={id}
GET /api/v1/salt-intelligence/audit/export
```

## 🎨 User Interfaces

### 1. Medicine Ingestion (`/inventory/ingest`)
- Upload strip image or use camera
- Automatic OCR processing
- Edit extracted salts
- Confidence indicators
- Mobile-responsive

### 2. Bulk Correction (`/inventory/maintenance`)
- Filter by status, manufacturer, search
- Inline editing
- Batch save
- Priority highlighting (>7 days)

### 3. Dashboard Widget
- Real-time unmapped count
- Color-coded status (green/yellow/red)
- Quick navigation to corrections
- Oldest pending alert

### 4. POS Substitute Modal
- Automatic out-of-stock detection
- Ranked substitute list
- One-click replacement
- Stock and price display

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Backend API
BACKEND_URL="http://localhost:3001"

# Optional: Redis for production caching
REDIS_URL="redis://localhost:6379"
```

### Performance Tuning

**Database Indexes** (automatically created):
- `Drug(storeId, ingestionStatus)`
- `DrugSaltLink(saltId, strengthValue, strengthUnit)`
- `InventoryBatch(drugId, storeId, quantityInStock)`

**Caching**:
- Substitute queries: 1-hour TTL
- Automatic invalidation on updates
- Pattern-based cache clearing

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:3001/api/v1/drugs

# Cache statistics
curl http://localhost:3001/api/v1/substitutes/stats
```

### Logs
```bash
# Using PM2
pm2 logs salt-backend
pm2 logs salt-frontend

# Direct logs
tail -f backend/logs/app.log
```

## 🐛 Troubleshooting

### Common Issues

**OCR not working**
```bash
npm install tesseract.js --save
```

**Database connection errors**
```bash
cd backend
npx prisma db push
npx prisma generate
```

**Slow queries**
```sql
ANALYZE "Drug";
ANALYZE "DrugSaltLink";
```

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Implementation Summary](./SALT_INTELLIGENCE_IMPLEMENTATION_COMPLETE.md) - Technical details
- [Requirements](./kiro/specs/salt-intelligence-production/requirements.md) - Full requirements
- [Design](./kiro/specs/salt-intelligence-production/design.md) - System design

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Implement changes
3. Add property tests
4. Run test suite
5. Submit PR

### Code Style

- Backend: JavaScript with JSDoc
- Frontend: TypeScript with strict mode
- Tests: Property-based with fast-check

## 📝 License

[Your License Here]

## 🎉 Acknowledgments

Built with:
- Next.js 14
- Prisma ORM
- Tesseract.js
- fast-check
- PostgreSQL

---

**Status**: ✅ Production Ready

For support or questions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
