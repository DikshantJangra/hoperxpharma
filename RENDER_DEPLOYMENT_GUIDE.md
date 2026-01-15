# Medicine Master Deployment Guide for Render

## Overview

This guide shows how to deploy the Medicine Master system on Render **without Docker**. Render supports deploying Node.js applications directly, which is perfect for your setup.

---

## Architecture on Render

```
┌─────────────────────────────────────────────────────────┐
│                  Render Services                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Backend Service │  │  Frontend Service│           │
│  │  (Node.js)       │  │  (Next.js)       │           │
│  │  Port: 8000      │  │  Port: 3000      │           │
│  └────────┬─────────┘  └──────────────────┘           │
│           │                                             │
│           │ Connects to                                 │
│           │                                             │
│  ┌────────▼─────────┐  ┌──────────────────┐           │
│  │  PostgreSQL      │  │  Typesense Cloud │           │
│  │  (Render)        │  │  (External)      │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### ✅ What You Already Have
- [x] Render account
- [x] Backend deployed as Web Service
- [x] PostgreSQL database on Render (NeonDB)
- [x] Git repository

### ⚠️ What You Need to Add
- [ ] Typesense Cloud account (or alternative)
- [ ] Environment variables updated

---

## Step 1: Set Up Typesense (Choose One Option)

### Option A: Typesense Cloud (Recommended - Easiest)

**Why**: Managed service, no setup needed, free tier available

1. **Sign up**: https://cloud.typesense.org
2. **Create cluster**:
   - Choose region closest to your Render region
   - Select plan (free tier available)
3. **Get credentials**:
   - Host: `xxx.a1.typesense.net`
   - Port: `443`
   - Protocol: `https`
   - API Key: (shown in dashboard)

**Cost**: Free tier available, paid plans start at $0.03/hour (~$22/month)

### Option B: Typesense on Render (Alternative)

**Why**: Keep everything on Render, more control

1. **Create new Web Service** on Render
2. **Use Docker image**: `typesense/typesense:26.0`
3. **Set environment variables**:
   ```
   TYPESENSE_API_KEY=your-secret-key-here
   TYPESENSE_DATA_DIR=/data
   ```
4. **Add persistent disk**: 10GB at `/data`
5. **Expose port**: 8108
6. **Get URL**: `https://your-typesense-service.onrender.com`

**Cost**: ~$7/month (Starter plan)

### Option C: Self-Hosted on VPS (Advanced)

**Why**: Cheapest option, full control

1. Get a VPS (DigitalOcean, Linode, etc.)
2. Install Docker
3. Run Typesense container
4. Configure firewall
5. Set up SSL certificate

**Cost**: ~$5-10/month

---

## Step 2: Update Backend Environment Variables on Render

### Navigate to Your Backend Service
1. Go to Render Dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Add/Update these variables:

### Required Variables

```bash
# Typesense Configuration (REQUIRED)
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-api-key-from-typesense-cloud
TYPESENSE_COLLECTION_NAME=medicines

# Existing variables (keep as is)
NODE_ENV=production
PORT=8000
DATABASE_URL=your-existing-database-url
JWT_SECRET=your-existing-jwt-secret
# ... other existing variables
```

### Click "Save Changes"
- Render will automatically redeploy your backend

---

## Step 3: Initialize Typesense Collection

### Option A: Using Render Shell (Recommended)

1. **Open Shell** in your backend service:
   - Go to your backend service on Render
   - Click "Shell" tab
   - Wait for shell to connect

2. **Run initialization**:
   ```bash
   npm run medicine:init-search
   ```

3. **Expected output**:
   ```
   ✅ Collection created successfully!
   Collection Details:
     Name: medicines
     Fields: 15
     Default Sorting: usageCount
   ```

### Option B: Using Local Script with Remote Connection

1. **Update local `.env`** with production Typesense credentials:
   ```bash
   TYPESENSE_HOST=xxx.a1.typesense.net
   TYPESENSE_PORT=443
   TYPESENSE_PROTOCOL=https
   TYPESENSE_API_KEY=your-api-key
   ```

2. **Run locally**:
   ```bash
   cd backend
   npm run medicine:init-search
   ```

---

## Step 4: Build Search Index (If You Have Data)

### If You Have Existing Medicine Data

1. **Open Render Shell** (or use local with production DB):
   ```bash
   npm run medicine:rebuild-index
   ```

2. **Monitor progress**:
   ```
   🔄 Starting full index rebuild...
   Found 10000 medicines to index
   Progress: 1000/10000 (1000 success, 0 failed)
   Progress: 2000/10000 (2000 success, 0 failed)
   ...
   ✅ Index rebuild complete: 10000/10000 indexed, 0 failed
   ```

### If You Don't Have Data Yet

- Skip this step
- Index will be built automatically as medicines are added
- Each medicine creation/update triggers automatic indexing

---

## Step 5: Verify Backend Deployment

### Test Health Check

```bash
curl https://your-backend.onrender.com/api/v1/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

### Test Search Endpoint

```bash
curl "https://your-backend.onrender.com/api/v1/medicines/search?q=test"
```

**Expected response**:
```json
{
  "query": "test",
  "results": [],
  "count": 0,
  "limit": 20,
  "offset": 0
}
```

### Test Typesense Connection

```bash
curl "https://your-backend.onrender.com/api/v1/medicines/search/stats"
```

**Expected response**:
```json
{
  "collectionName": "medicines",
  "documentsInIndex": 0,
  "documentsInDatabase": 0,
  "inSync": true
}
```

---

## Step 6: Update Frontend Environment Variables

### Navigate to Your Frontend Service (if separate)
1. Go to Render Dashboard
2. Click on your frontend service
3. Go to "Environment" tab

### Add These Variables

```bash
# Enable Medicine Master API
NEXT_PUBLIC_USE_MEDICINE_API=true

# Backend URL (your Render backend URL)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1

# Optional: Store ID
# NEXT_PUBLIC_STORE_ID=your-store-id
```

### Click "Save Changes"
- Render will automatically redeploy your frontend

---

## Step 7: Test Frontend Integration

### Open Your Frontend
```
https://your-frontend.onrender.com
```

### Test Medicine Search
1. Go to medicine search page
2. Search for a medicine
3. Check browser console:
   - Should see: "🚀 Using Medicine Master API for search"
   - Should see: "✅ Connected to medicine API"

### Check Network Tab
1. Open browser DevTools
2. Go to Network tab
3. Search for a medicine
4. Should see API calls to: `https://your-backend.onrender.com/api/v1/medicines/search`

---

## Troubleshooting

### Issue: Backend Won't Start

**Check Logs**:
1. Go to backend service on Render
2. Click "Logs" tab
3. Look for errors

**Common Issues**:
- Missing `TYPESENSE_API_KEY`: Add it in environment variables
- Database connection failed: Check `DATABASE_URL`
- Port already in use: Render handles this automatically

**Solution**:
```bash
# Make sure these are set:
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your-key-here
```

### Issue: "Collection not found"

**Cause**: Typesense collection not initialized

**Solution**:
1. Open Render Shell
2. Run: `npm run medicine:init-search`
3. Restart backend service

### Issue: Search Returns No Results

**Possible Causes**:
1. No data in database
2. Index not built
3. Typesense not connected

**Solution**:
```bash
# Check if collection exists
curl "https://your-backend.onrender.com/api/v1/medicines/search/stats"

# If collection exists but empty, rebuild index
npm run medicine:rebuild-index
```

### Issue: Frontend Still Using Legacy Mode

**Check**:
1. Environment variable is set: `NEXT_PUBLIC_USE_MEDICINE_API=true`
2. Frontend was redeployed after adding variable
3. Clear browser cache
4. Check browser console for messages

**Solution**:
1. Verify env var in Render dashboard
2. Manually trigger redeploy
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

---

## Monitoring

### Backend Logs
```
Render Dashboard → Backend Service → Logs
```

**What to watch**:
- Search query performance
- Error rates
- Typesense connection status

### Frontend Logs
```
Render Dashboard → Frontend Service → Logs
```

**What to watch**:
- API connection errors
- Search failures
- Performance issues

### Typesense Logs (if using Typesense Cloud)
```
Typesense Cloud Dashboard → Your Cluster → Logs
```

**What to watch**:
- Query performance
- Index size
- Error rates

---

## Performance Optimization

### 1. Enable Render CDN
- Go to backend service settings
- Enable "CDN" if available
- Improves API response times

### 2. Use Render Regions Wisely
- Backend and Typesense should be in same region
- Frontend can be in different region (uses CDN)

### 3. Database Connection Pooling
Already configured in your backend:
```bash
CONNECTION_POOL_MAX=10
CONNECTION_POOL_TIMEOUT=20
```

### 4. Typesense Caching
Typesense automatically caches frequent queries

---

## Cost Breakdown

### Minimum Setup (Free Tier)
- Backend: $0 (Free tier - 750 hours/month)
- Frontend: $0 (Static site)
- Database: $0 (NeonDB free tier)
- Typesense: $0 (Typesense Cloud free tier)
- **Total: $0/month**

### Recommended Setup (Production)
- Backend: $7/month (Starter plan)
- Frontend: $0 (Static site)
- Database: $0 (NeonDB free tier) or $19/month (Render PostgreSQL)
- Typesense: $22/month (Typesense Cloud)
- **Total: $29-48/month**

### High-Traffic Setup
- Backend: $25/month (Standard plan)
- Frontend: $0 (Static site)
- Database: $19/month (Render PostgreSQL)
- Typesense: $50/month (Typesense Cloud Pro)
- **Total: $94/month**

---

## Scaling Strategy

### Phase 1: Start Small (Current)
- Free tier for testing
- Single backend instance
- Typesense free tier

### Phase 2: Production Launch
- Upgrade backend to Starter ($7/month)
- Upgrade Typesense to paid plan ($22/month)
- Monitor performance

### Phase 3: Scale Up (When Needed)
- Upgrade backend to Standard ($25/month)
- Add Redis for caching
- Upgrade Typesense cluster
- Consider multiple backend instances

---

## Backup Strategy

### Database Backups
- Render PostgreSQL: Automatic daily backups
- NeonDB: Automatic backups included

### Typesense Backups
- Typesense Cloud: Automatic backups
- Self-hosted: Set up cron job for backups

### Code Backups
- Git repository (already done)
- Render automatically deploys from Git

---

## Rollback Plan

### If Issues Occur

#### 1. Disable New API (Instant)
**Frontend**:
```bash
# In Render environment variables
NEXT_PUBLIC_USE_MEDICINE_API=false
```
- Save and redeploy
- Frontend falls back to legacy MiniSearch
- Zero downtime

#### 2. Rollback Backend (5 minutes)
**Render Dashboard**:
1. Go to backend service
2. Click "Manual Deploy"
3. Select previous successful deploy
4. Click "Deploy"

#### 3. Database Rollback (if needed)
**Render Dashboard**:
1. Go to PostgreSQL service
2. Click "Backups"
3. Select backup to restore
4. Click "Restore"

---

## Security Checklist

### ✅ Environment Variables
- [x] `TYPESENSE_API_KEY` is secret (not in code)
- [x] `JWT_SECRET` is strong (32+ characters)
- [x] `DATABASE_URL` is secure
- [x] No secrets in Git repository

### ✅ API Security
- [x] Rate limiting enabled (1000 req/min per store)
- [x] Authentication on protected routes
- [x] Input validation on all endpoints
- [x] CORS configured properly

### ✅ Database Security
- [x] Connection pooling enabled
- [x] SSL/TLS for connections
- [x] Regular backups
- [x] Access restricted

---

## Next Steps

### Immediate (Required)
1. ✅ Choose Typesense option (Cloud recommended)
2. ✅ Add environment variables to Render
3. ✅ Initialize Typesense collection
4. ✅ Test backend health check
5. ✅ Enable frontend API mode

### Short-term (Recommended)
1. Build search index (if you have data)
2. Test all search functionality
3. Monitor logs for errors
4. Set up alerts
5. Document any custom configurations

### Long-term (Optional)
1. Set up monitoring dashboard
2. Configure auto-scaling
3. Add Redis caching
4. Implement analytics
5. Optimize query performance

---

## Support Resources

### Render Documentation
- Web Services: https://render.com/docs/web-services
- Environment Variables: https://render.com/docs/environment-variables
- Shell Access: https://render.com/docs/shell

### Typesense Documentation
- Cloud Setup: https://cloud.typesense.org/docs
- API Reference: https://typesense.org/docs/latest/api/
- Search Guide: https://typesense.org/docs/latest/guide/

### Medicine Master Documentation
- `MEDICINE_MASTER_PRODUCTION_COMPLETE.md` - Complete guide
- `FRONTEND_CHANGES_SUMMARY.md` - Frontend integration
- `MEDICINE_MASTER_DEPLOYMENT_CHECKLIST.md` - Deployment checklist

---

## Summary

### What You Need to Do

1. **Set up Typesense** (15 minutes)
   - Sign up for Typesense Cloud
   - Get credentials

2. **Update Render Environment Variables** (5 minutes)
   - Add Typesense config to backend
   - Add API flag to frontend

3. **Initialize Collection** (2 minutes)
   - Run `npm run medicine:init-search` in Render Shell

4. **Test** (10 minutes)
   - Check backend health
   - Test search endpoint
   - Verify frontend integration

**Total Time**: ~30 minutes

### What You Get

- ✅ Powerful search with Typesense
- ✅ 34 production-ready API endpoints
- ✅ Store-specific customizations
- ✅ Real-time data from database
- ✅ Backward compatible (can rollback instantly)
- ✅ Scalable architecture
- ✅ Zero downtime migration

---

**Status**: ✅ Ready for Deployment on Render  
**Docker Required**: NO ❌  
**Estimated Setup Time**: 30 minutes  
**Rollback Time**: Instant (change env variable)  
**Cost**: Free tier available, $29-48/month recommended
