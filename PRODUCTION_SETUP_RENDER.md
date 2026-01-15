# 🚀 Production Setup Guide - Render Deployment

## Quick Start (30 minutes to production!)

This guide will get your Medicine Master system running in production on Render with Typesense Cloud.

---

## Prerequisites

- [ ] GitHub/GitLab account with your code
- [ ] Render account (free to start)
- [ ] Credit card for Typesense Cloud (free trial available)

---

## Part 1: Typesense Cloud Setup (10 minutes)

### Step 1: Create Typesense Cloud Account
1. Go to https://cloud.typesense.org
2. Click "Sign Up" (free trial available)
3. Verify your email

### Step 2: Create Production Cluster
1. Click "Create Cluster"
2. Configure:
   ```
   Name: medicine-master-prod
   Region: us-east-1 (or closest to you)
   Plan: Production - 2GB RAM ($22/month)
   High Availability: Yes (recommended for production)
   ```
3. Click "Create Cluster"
4. Wait 2-3 minutes

### Step 3: Save Credentials
Once ready, copy these details:
```
Host: xxx-1.a1.typesense.net
Port: 443
Protocol: https
API Key: ts_xxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANT: Save these credentials securely!**

---

## Part 2: Render Setup (15 minutes)

### Step 1: Create Render Account
1. Go to https://dashboard.render.com
2. Sign up with GitHub/GitLab
3. Connect your repository

### Step 2: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   ```
   Name: medicine-master-db
   Database: hoperxpharma
   User: hoperxuser
   Region: Oregon (or your preferred region)
   Plan: Starter ($7/month)
   ```
3. Click "Create Database"
4. **Save the Internal Database URL** (starts with `postgresql://`)

### Step 3: Create Backend Web Service
1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   ```
   Name: medicine-master-backend
   Region: Oregon (same as database)
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install && npx prisma generate
   Start Command: npm start
   Plan: Starter ($7/month)
   ```

### Step 4: Add Environment Variables to Backend
In the backend service, add these environment variables:

**Required**:
```bash
NODE_ENV=production
PORT=8000

# Database (use the Internal Database URL from Step 2)
DATABASE_URL=postgresql://user:pass@host/db
DIRECT_URL=postgresql://user:pass@host/db

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your-64-char-secret-here
JWT_REFRESH_SECRET=your-64-char-refresh-secret-here
MAGIC_LINK_SECRET=your-32-char-magic-link-secret

# Typesense (from Part 1, Step 3)
TYPESENSE_HOST=xxx-1.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=ts_xxxxxxxxxxxxxxxxxxxxx
TYPESENSE_COLLECTION_NAME=medicines

# API Configuration
LOG_LEVEL=info
API_RATE_LIMIT=1000
CORS_ORIGIN=*
FRONTEND_URL=https://your-frontend.onrender.com
```

**Optional (if using)**:
```bash
# Cloudflare R2 for images
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=medicine-images
R2_PUBLIC_URL=https://your-bucket.r2.dev

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=YourAppName
SMTP_FROM_EMAIL=your-email@gmail.com
```

### Step 5: Deploy Backend
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Check logs for: "Server is running on port 8000"
4. Note your backend URL: `https://medicine-master-backend.onrender.com`

### Step 6: Create Frontend Web Service
1. Click "New +" → "Web Service"
2. Connect same repository
3. Configure:
   ```
   Name: medicine-master-frontend
   Region: Oregon (same as backend)
   Branch: main
   Root Directory: (leave empty - root of repo)
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   Plan: Starter ($7/month)
   ```

### Step 7: Add Environment Variables to Frontend
```bash
NEXT_PUBLIC_USE_MEDICINE_API=true
NEXT_PUBLIC_API_URL=https://medicine-master-backend.onrender.com/api/v1
```

### Step 8: Deploy Frontend
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Note your frontend URL: `https://medicine-master-frontend.onrender.com`

---

## Part 3: Initialize System (5 minutes)

### Step 1: Run Database Migrations
From your local machine:

```bash
# Set database URL (use External Database URL from Render)
export DATABASE_URL="postgresql://user:pass@host/db"

cd backend

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Step 2: Initialize Typesense Collection
```bash
# Set Typesense credentials
export TYPESENSE_HOST=xxx-1.a1.typesense.net
export TYPESENSE_PORT=443
export TYPESENSE_PROTOCOL=https
export TYPESENSE_API_KEY=ts_xxxxxxxxxxxxxxxxxxxxx
export TYPESENSE_COLLECTION_NAME=medicines

# Initialize collection
npm run medicine:init-search
```

Expected output:
```
✅ Collection created successfully!
Collection Details:
  Name: medicines
  Fields: 15
  Default Sorting: usageCount
```

### Step 3: Build Search Index (if you have data)
```bash
# Keep same environment variables from Step 2
# Add database URL
export DATABASE_URL="postgresql://user:pass@host/db"

# Build index
npm run medicine:rebuild-index
```

---

## Part 4: Verification (5 minutes)

### Test Backend Health
```bash
curl https://medicine-master-backend.onrender.com/api/v1/health
```

Expected:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" }
  }
}
```

### Test Search
```bash
curl "https://medicine-master-backend.onrender.com/api/v1/medicines/search?q=test"
```

Expected: JSON array (empty if no data yet)

### Test Frontend
1. Open: `https://medicine-master-frontend.onrender.com`
2. Try searching for medicines
3. Check browser console for API calls

---

## Part 5: Update CORS (Important!)

### Update Backend Environment Variables
Go back to Render dashboard → Backend service → Environment:

Update these variables:
```bash
CORS_ORIGIN=https://medicine-master-frontend.onrender.com
FRONTEND_URL=https://medicine-master-frontend.onrender.com
```

Click "Save Changes" - backend will redeploy automatically.

---

## 🎉 You're Live!

Your Medicine Master system is now running in production!

### Your URLs
- **Backend API**: https://medicine-master-backend.onrender.com
- **Frontend**: https://medicine-master-frontend.onrender.com
- **Health Check**: https://medicine-master-backend.onrender.com/api/v1/health

### Monthly Costs
- Render Backend: $7/month
- Render Frontend: $7/month
- Render Database: $7/month
- Typesense Cloud: $22/month (or $44 with HA)
- **Total**: $43-65/month

---

## Next Steps

### 1. Add Custom Domain (Optional)
1. Go to service → Settings → Custom Domain
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as shown
4. SSL certificate is automatic!

### 2. Set Up Monitoring
1. Go to service → Metrics
2. View CPU, memory, requests
3. Set up alerts: Settings → Notifications

### 3. Enable Auto-Deploy
Already enabled! Push to `main` branch to deploy.

### 4. Add More Data
```bash
# Import medicines from CSV/JSON
# Use the migration scripts in backend/scripts/
```

---

## Troubleshooting

### Backend Won't Start
Check logs in Render dashboard:
```
Dashboard → Backend Service → Logs
```

Common issues:
- Missing environment variables
- Database connection failed
- Typesense API key incorrect

### Search Not Working
Test Typesense directly:
```bash
curl "https://xxx-1.a1.typesense.net:443/health" \
  -H "X-TYPESENSE-API-KEY: your-key"
```

If fails, check:
- API key is correct
- Cluster is running in Typesense Cloud dashboard

### Frontend Can't Connect to Backend
Check CORS settings:
- `CORS_ORIGIN` in backend must match frontend URL
- Include `https://` in the URL

---

## Scaling

### When to Scale Up

**Backend/Frontend** (upgrade to Standard $25/month):
- Response times >200ms
- CPU usage >80%
- Memory usage >90%

**Database** (upgrade to Standard $20/month):
- Query times >50ms
- Storage >90% full
- Connection pool exhausted

**Typesense** (upgrade cluster):
- Search times >100ms
- Memory usage >90%
- Index size >2GB

### How to Scale
1. Go to service → Settings
2. Change "Instance Type" to Standard or Pro
3. Click "Save Changes"
4. Service will redeploy with more resources

---

## Support

### Render Support
- Docs: https://render.com/docs
- Community: https://community.render.com
- Email: support@render.com

### Typesense Support
- Docs: https://typesense.org/docs
- Community: https://github.com/typesense/typesense/discussions
- Email: support@typesense.org

### Project Documentation
- Full Guide: `RENDER_DEPLOYMENT_GUIDE.md`
- API Docs: `MEDICINE_MASTER_PRODUCTION_COMPLETE.md`
- Checklist: `MEDICINE_MASTER_DEPLOYMENT_CHECKLIST.md`

---

## Quick Reference

### Generate Secrets
```bash
# JWT Secret (64 characters)
openssl rand -base64 64

# Magic Link Secret (32 characters)
openssl rand -base64 32
```

### View Logs
```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# View logs
render logs medicine-master-backend --tail
```

### Database Operations
```bash
# Connect to database
psql $DATABASE_URL

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

### Typesense Operations
```bash
# Test connection
npm run medicine:setup-cloud

# Initialize collection
npm run medicine:init-search

# Rebuild index
npm run medicine:rebuild-index
```

---

## Success Checklist

- [ ] Typesense Cloud cluster created
- [ ] Render PostgreSQL database created
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Database migrations applied
- [ ] Typesense collection created
- [ ] Search index built (if data exists)
- [ ] Health check passing
- [ ] Search working
- [ ] CORS configured correctly
- [ ] Monitoring enabled
- [ ] Auto-deploy enabled

---

**Status**: Production Ready ✅  
**Setup Time**: 30 minutes  
**Monthly Cost**: $43-65  
**Uptime**: 99.9%+ (Render SLA)  

🚀 **Your Medicine Master system is live!**
