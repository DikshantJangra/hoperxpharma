# Salt Intelligence System - Deployment Ready Checklist

## 🎯 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (if not already installed)
cd ..
npm install tesseract.js
```

### Step 2: Run Database Migration
```bash
cd backend
npx prisma migrate deploy
```

### Step 3: Verify Tests Pass
```bash
cd backend
npm test
```

Expected output: All tests passing ✅

### Step 4: Start the System
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd ..
npm run dev
```

### Step 5: Test the Flow
1. Open browser: `http://localhost:3000`
2. Navigate to `/inventory/ingest`
3. Upload a medicine strip image
4. Verify OCR extracts salts
5. Click "Confirm & Activate"
6. Check `/inventory/maintenance` for the new medicine

## ✅ Pre-Deployment Checklist

### Backend Verification
- [ ] `npm install` completes without errors
- [ ] `npx prisma migrate deploy` succeeds
- [ ] `npm test` shows all tests passing
- [ ] Backend starts on port 4000
- [ ] Health check responds: `curl http://localhost:4000/api/v1/health`

### Frontend Verification
- [ ] `npm install` completes without errors
- [ ] `npm run build` succeeds
- [ ] Frontend starts on port 3000
- [ ] Can access `/inventory/ingest`
- [ ] Can access `/inventory/maintenance`
- [ ] Dashboard widget appears on `/dashboard`

### Integration Verification
- [ ] Frontend can call backend APIs
- [ ] OCR processes images successfully
- [ ] Medicines can be created
- [ ] Bulk correction works
- [ ] Dashboard shows correct stats

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Server
PORT=4000
NODE_ENV=production

# CORS
FRONTEND_URL="https://yourdomain.com"
ALLOWED_ORIGINS="https://yourdomain.com"

# JWT (if using auth)
JWT_SECRET="your-secret-key"
```

### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
BACKEND_URL="https://api.yourdomain.com"

# Environment
NEXT_PUBLIC_ENV=production
```

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)

#### Deploy Backend to Render
1. Create new Web Service
2. Connect your repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

#### Deploy Frontend to Vercel
1. Import project
2. Set root directory: `.`
3. Add environment variables
4. Deploy

### Option 2: Railway (Full Stack)

#### Deploy Backend
```bash
railway login
railway init
railway add
# Select PostgreSQL
railway up
```

#### Deploy Frontend
```bash
railway link
railway up
```

### Option 3: Docker (Self-Hosted)

#### Build Images
```bash
# Backend
cd backend
docker build -t salt-intelligence-backend .

# Frontend
cd ..
docker build -t salt-intelligence-frontend .
```

#### Run Containers
```bash
docker-compose up -d
```

## 📊 Post-Deployment Verification

### 1. Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/api/v1/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 2. API Endpoints
```bash
# Test stats endpoint
curl "https://api.yourdomain.com/api/v1/salt-intelligence/stats?storeId=YOUR_STORE_ID"

# Expected: {"unmappedCount":0,"pendingCount":0,"activeCount":0,...}
```

### 3. Frontend Pages
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Ingestion page: `https://yourdomain.com/inventory/ingest`
- [ ] Bulk correction: `https://yourdomain.com/inventory/maintenance`
- [ ] Dashboard: `https://yourdomain.com/dashboard`

### 4. End-to-End Flow
1. Upload medicine strip image
2. Verify OCR extracts composition
3. Confirm and activate
4. Check medicine appears in inventory
5. Verify audit log created
6. Check dashboard stats updated

## 🔍 Monitoring

### Key Metrics to Track
- **Response Times**: Substitute queries should be <200ms
- **OCR Performance**: Processing should be <5 seconds
- **Error Rates**: Should be <1%
- **Cache Hit Rate**: Should be >70%
- **Database Connections**: Monitor for leaks

### Logging
```javascript
// Backend logs to check
- API request logs
- Error logs
- Audit logs
- Performance logs
```

### Alerts to Set Up
- [ ] High error rate (>5%)
- [ ] Slow queries (>500ms)
- [ ] Database connection issues
- [ ] High memory usage
- [ ] Disk space low

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**: Check DATABASE_URL format
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
```

### Issue: "CORS error"
**Solution**: Add frontend URL to ALLOWED_ORIGINS
```env
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### Issue: "OCR not working"
**Solution**: Verify Tesseract.js is installed
```bash
npm list tesseract.js
```

### Issue: "Tests failing"
**Solution**: Check database connection and run migrations
```bash
npx prisma migrate deploy
npm test
```

### Issue: "Slow substitute queries"
**Solution**: Verify indexes exist
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'Drug';
```

## 📈 Performance Optimization

### Database
- [ ] Indexes created on frequently queried columns
- [ ] Connection pooling configured
- [ ] Query timeout set (5 seconds)

### Caching
- [ ] Redis configured (optional)
- [ ] In-memory cache working
- [ ] Cache invalidation on updates

### Frontend
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Lazy loading for heavy components

## 🔒 Security Checklist

### Backend
- [ ] Environment variables not committed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection active
- [ ] Input validation on all endpoints

### Frontend
- [ ] API keys not exposed
- [ ] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Secure cookies (if using auth)

### Database
- [ ] Strong password
- [ ] SSL connection enabled
- [ ] Backup configured
- [ ] Access restricted to backend only

## 📚 Documentation

### For Developers
- [ ] API documentation available
- [ ] Code comments in place
- [ ] README updated
- [ ] Architecture diagram created

### For Users
- [ ] User guide written
- [ ] Video tutorial recorded (optional)
- [ ] FAQ created
- [ ] Support contact provided

## 🎉 Go Live Checklist

### Pre-Launch (1 day before)
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Backup strategy in place
- [ ] Rollback plan ready

### Launch Day
- [ ] Deploy backend
- [ ] Run database migration
- [ ] Deploy frontend
- [ ] Verify health checks
- [ ] Test critical flows
- [ ] Monitor logs for errors

### Post-Launch (1 week)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Fix any issues
- [ ] Optimize based on usage

## 📞 Support

### If Something Goes Wrong
1. Check logs: `tail -f logs/error.log`
2. Verify environment variables
3. Test database connection
4. Check API endpoints manually
5. Review recent changes

### Rollback Procedure
```bash
# Backend
git revert HEAD
railway up

# Frontend
vercel rollback
```

## ✨ Success Criteria

Your deployment is successful when:
- ✅ All health checks pass
- ✅ Users can create medicines via OCR
- ✅ Substitute discovery works
- ✅ Bulk correction functions properly
- ✅ Dashboard shows accurate stats
- ✅ No critical errors in logs
- ✅ Response times meet targets
- ✅ Users report positive experience

## 🚀 You're Ready!

Follow this checklist step by step, and your Salt Intelligence Production System will be live and running smoothly.

**Estimated deployment time**: 30-60 minutes
**Difficulty**: Medium
**Prerequisites**: Node.js, PostgreSQL, Git

Good luck! 🎉
