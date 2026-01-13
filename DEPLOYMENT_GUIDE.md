# Salt Intelligence Production System - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Step 1: Install Dependencies

### Backend
```bash
cd backend
npm install
```

Required packages (should already be in package.json):
- `uuid` - For generating unique IDs
- `fast-check` - For property-based testing
- `jest` - For testing

### Frontend
```bash
npm install
```

Required packages:
- `tesseract.js` - For OCR processing
- `lucide-react` - For icons (if not already installed)

## Step 2: Database Setup

### Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

Or manually run the SQL migration:
```bash
psql -d your_database < prisma/migrations/add_salt_intelligence_enhancements.sql
```

### Verify Schema
```bash
npx prisma db pull
npx prisma generate
```

## Step 3: Environment Configuration

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
PORT=3001
NODE_ENV=production
```

### Frontend (.env.local)
```env
BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Step 4: Backend Server Setup

### Update your main server file (backend/src/index.js or app.js)

```javascript
const express = require('express');
const cors = require('cors');
const v1Routes = require('./routes/v1');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount v1 routes
app.use('/api/v1', v1Routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

## Step 5: Start Services

### Development Mode

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### Production Mode

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
npm run build
npm start
```

## Step 6: Verify Installation

### Test Backend API
```bash
# Health check
curl http://localhost:3001/api/v1/drugs

# Test substitute search
curl "http://localhost:3001/api/v1/substitutes?drugId=test&storeId=test"

# Test stats
curl "http://localhost:3001/api/v1/salt-intelligence/stats?storeId=test"
```

### Test Frontend
1. Navigate to `http://localhost:3000/inventory/ingest`
2. Upload a test image
3. Verify OCR processing works
4. Check dashboard widget at main dashboard

## Step 7: Run Tests

```bash
cd backend
npm test
```

Expected output:
- 29+ property tests passing
- All unit tests passing
- Test coverage > 80%

## Step 8: Performance Verification

### Database Indexes
Verify indexes are created:
```sql
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('Drug', 'DrugSaltLink', 'InventoryBatch', 'SaltMappingAudit');
```

Expected indexes:
- `Drug_storeId_ingestionStatus_idx`
- `DrugSaltLink_saltId_strengthValue_strengthUnit_idx`
- `InventoryBatch_drugId_storeId_quantityInStock_idx`
- `SaltMappingAudit_drugId_createdAt_idx`

### Performance Benchmarks
Test substitute query performance:
```bash
# Should return in < 200ms
time curl "http://localhost:3001/api/v1/substitutes?drugId=test&storeId=test"
```

## Step 9: Production Deployment

### Using PM2 (Recommended)

Backend:
```bash
cd backend
pm2 start npm --name "salt-backend" -- start
pm2 save
```

Frontend:
```bash
pm2 start npm --name "salt-frontend" -- start
pm2 save
```

### Using Docker

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:3001
    depends_on:
      - backend

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

## Step 10: Monitoring & Maintenance

### Log Monitoring
```bash
# Backend logs
pm2 logs salt-backend

# Frontend logs
pm2 logs salt-frontend
```

### Database Maintenance
```bash
# Vacuum and analyze
psql -d your_database -c "VACUUM ANALYZE;"

# Check table sizes
psql -d your_database -c "SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Cache Monitoring
Check cache statistics:
```bash
curl http://localhost:3001/api/v1/substitutes/stats
```

## Troubleshooting

### Issue: OCR not working
**Solution**: Ensure Tesseract.js is properly installed:
```bash
npm install tesseract.js --save
```

### Issue: Database connection errors
**Solution**: Verify DATABASE_URL and run:
```bash
npx prisma db push
```

### Issue: API routes returning 404
**Solution**: Verify routes are mounted in backend server:
```javascript
app.use('/api/v1', require('./routes/v1'));
```

### Issue: Slow substitute queries
**Solution**: Verify indexes exist and run:
```sql
ANALYZE "Drug";
ANALYZE "DrugSaltLink";
ANALYZE "InventoryBatch";
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS in production
- [ ] Set up authentication middleware
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up database backups
- [ ] Configure environment variables securely
- [ ] Enable audit logging
- [ ] Set up monitoring alerts

## Performance Checklist

- [ ] Database indexes created
- [ ] Cache service running
- [ ] Image optimization enabled
- [ ] API response times < 200ms
- [ ] OCR processing < 5 seconds
- [ ] Bulk updates handle 500+ records

## Success Criteria

✅ All services running without errors
✅ Database migrations applied
✅ All tests passing
✅ API endpoints responding
✅ Frontend pages loading
✅ OCR processing working
✅ Substitute search functional
✅ Dashboard widget displaying data
✅ Bulk correction tool operational

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Verify environment variables
3. Test API endpoints individually
4. Check database connectivity
5. Review error messages in browser console

---

**Deployment Complete!** 🚀

Your Salt Intelligence Production System is now ready for use.
