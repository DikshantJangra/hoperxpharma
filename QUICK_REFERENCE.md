# Salt Intelligence System - Quick Reference

## 🚀 5-Minute Deployment

```bash
# 1. Install
cd backend && npm install && cd ..

# 2. Migrate
cd backend && npx prisma migrate deploy && cd ..

# 3. Test
cd backend && npm test && cd ..

# 4. Start
# Terminal 1:
cd backend && npm start

# Terminal 2:
npm run dev
```

## 📁 Key Files

### Backend Services
```
backend/src/services/
├── saltService.js           # Salt CRUD + search
├── substituteService.js     # Substitute discovery
├── validationService.js     # Data validation
├── auditService.js          # Audit logging
├── cacheService.js          # Caching layer
└── drugService.js           # Drug management
```

### Backend Routes
```
backend/src/routes/v1/
├── drug.routes.js           # /api/v1/drugs
├── substitute.routes.js     # /api/v1/substitutes
└── saltIntelligence.routes.js  # /api/v1/salt-intelligence
```

### Frontend Pages
```
app/(main)/inventory/
├── ingest/page.tsx          # Medicine ingestion
└── maintenance/page.tsx     # Bulk correction

components/dashboard/
└── SaltIntelligenceWidget.tsx  # Dashboard widget
```

### Tests
```
backend/tests/unit/
├── drugIngestionStatus.property.test.js
├── saltNameMatching.property.test.js
├── saltDeduplication.property.test.js
├── substituteMatching.property.test.js
├── substituteRanking.property.test.js
├── substituteCache.property.test.js
├── regexMatcher.property.test.js
└── confidenceScoring.property.test.js
```

## 🔗 API Endpoints

### Drug Management
```
GET    /api/v1/drugs?storeId=X&status=Y
GET    /api/v1/drugs/bulk?storeId=X&status=Y
POST   /api/v1/drugs
POST   /api/v1/drugs/:id/activate
POST   /api/v1/drugs/bulk-update
POST   /api/v1/drugs/import
GET    /api/v1/drugs/:id
```

### Substitute Discovery
```
GET    /api/v1/substitutes?drugId=X&storeId=Y
GET    /api/v1/substitutes/stats?storeId=X
POST   /api/v1/substitutes/invalidate
```

### Salt Intelligence
```
GET    /api/v1/salt-intelligence/stats?storeId=X
GET    /api/v1/salt-intelligence/audit
GET    /api/v1/salt-intelligence/audit/export
GET    /api/v1/salt-intelligence/analytics?storeId=X
```

## 🧪 Testing Commands

```bash
# Run all tests
npm test

# Run specific test
npm test -- saltNameMatching.property.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## 🔍 Debugging

### Check Backend Health
```bash
curl http://localhost:4000/api/v1/health
```

### Check Stats
```bash
curl "http://localhost:4000/api/v1/salt-intelligence/stats?storeId=YOUR_STORE_ID"
```

### Check Substitutes
```bash
curl "http://localhost:4000/api/v1/substitutes?drugId=DRUG_ID&storeId=STORE_ID"
```

### View Logs
```bash
# Backend logs
tail -f backend/logs/combined.log

# Error logs
tail -f backend/logs/error.log
```

## 🐛 Common Issues

### "Cannot connect to database"
```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
cd backend && npx prisma db pull
```

### "Tests failing"
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install

# Run migration
npx prisma migrate deploy

# Run tests
npm test
```

### "CORS error"
```env
# Add to backend/.env
ALLOWED_ORIGINS="http://localhost:3000"
```

### "OCR not working"
```bash
# Install Tesseract.js
npm install tesseract.js

# Check installation
npm list tesseract.js
```

## 📊 Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| Substitute Query | <200ms | Check API response time |
| OCR Processing | <5s | Check browser console |
| Bulk Update | 500+ records | Test with large dataset |
| Cache Hit Rate | >70% | Check cache stats endpoint |

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
PORT=4000
NODE_ENV=production
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000"
JWT_SECRET="your-secret"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
BACKEND_URL="http://localhost:4000"
NEXT_PUBLIC_ENV=development
```

## 📱 User Flows

### 1. Add New Medicine
1. Go to `/inventory/ingest`
2. Upload strip image or use camera
3. Wait for OCR (2-5 seconds)
4. Review extracted salts
5. Edit if needed
6. Click "Confirm & Activate"
7. Medicine is now ACTIVE

### 2. Bulk Correction
1. Go to `/inventory/maintenance`
2. Filter by SALT_PENDING
3. Click "Edit" on a medicine
4. Update composition
5. Click "Save Changes"
6. Audit log created

### 3. Find Substitutes
1. Go to POS or inventory
2. Select a medicine
3. Click "Find Substitutes"
4. View ranked alternatives
5. Select substitute
6. Add to sale/order

### 4. View Dashboard
1. Go to `/dashboard`
2. See Salt Intelligence widget
3. Click widget to go to bulk correction
4. Filter automatically applied

## 🎯 Success Indicators

### System is Working When:
- ✅ All tests pass
- ✅ Health check responds
- ✅ Can create medicines
- ✅ OCR extracts salts
- ✅ Substitutes are found
- ✅ Dashboard shows stats
- ✅ Audit logs are created

### System Needs Attention When:
- ❌ Tests failing
- ❌ Health check fails
- ❌ API errors in console
- ❌ OCR times out
- ❌ No substitutes found
- ❌ Dashboard shows errors

## 📞 Quick Help

### Issue: Can't start backend
```bash
# Check if port is in use
lsof -i :4000

# Kill process if needed
kill -9 <PID>

# Restart
npm start
```

### Issue: Can't start frontend
```bash
# Check if port is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Restart
npm run dev
```

### Issue: Database connection error
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

## 🎓 Key Concepts

### Ingestion Status
- **DRAFT**: Not ready for use
- **SALT_PENDING**: Needs salt mapping
- **ACTIVE**: Ready for POS

### Confidence Levels
- **HIGH**: Name + strength + unit detected
- **MEDIUM**: Name + partial info
- **LOW**: Name only or parsing failed

### Substitute Ranking
1. **Stock availability** (in stock > low stock > out of stock)
2. **Price** (lower is better)
3. **Manufacturer** (same manufacturer preferred)

## 📚 Documentation

- `EXECUTIVE_SUMMARY.md` - Project overview
- `DEPLOYMENT_READY_CHECKLIST.md` - Deployment guide
- `SALT_INTELLIGENCE_STATUS_AND_NEXT_STEPS.md` - Detailed status
- `SALT_INTELLIGENCE_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `QUICK_REFERENCE.md` - This file

## ✨ Quick Tips

1. **Always run tests** before deploying
2. **Check logs** when debugging
3. **Use property tests** to verify correctness
4. **Monitor performance** metrics
5. **Keep audit trail** for compliance

---

**Need more help?** Check the detailed documentation files above.
