# Typesense Deployment on Render (Free Tier)

## Overview
This guide shows how to deploy Typesense as a **separate service** alongside your existing Node.js backend on Render.

## Current Setup
- ✅ Backend: Already running as Web Service on Render
- ✅ Database: PostgreSQL on Render
- ⏳ Typesense: Need to add as separate service

## Prerequisites
- Render account (https://render.com)
- Backend already deployed on Render
- Medicine Master data migrated (253K medicines)
- Repository with `Dockerfile.typesense` (already present)

## Step 1: Push Typesense Dockerfile to Repository

The `Dockerfile.typesense` is already in your repo. Just make sure it's committed:

```bash
git add Dockerfile.typesense
git commit -m "Add Typesense Dockerfile for Render deployment"
git push
```

## Step 2: Create Typesense Service on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - You should see your existing backend service

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Select "Build and deploy from a Git repository"
   - Click "Next"

3. **Connect Repository**
   - Select your existing repository (same one as backend)
   - Click "Connect"

4. **Configure Service**
   Fill in these settings:

   **Basic Settings:**
   - **Name**: `hoperx-typesense` (or any name you prefer)
   - **Region**: Select same region as your backend (e.g., Singapore)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (Dockerfile is in root)

   **Build Settings:**
   - **Environment**: Select `Docker`
   - **Dockerfile Path**: `./Dockerfile.typesense`
   - **Docker Context**: `.` (current directory)
   - **Docker Command**: `--data-dir /data --api-key $TYPESENSE_API_KEY --enable-cors`

   **Instance Settings:**
   - **Plan**: Select `Free` (or `Starter` if you want no spin-down)

5. **Add Environment Variable**
   - Scroll to "Environment Variables" section
   - Click "Add Environment Variable"
   - **Key**: `TYPESENSE_API_KEY`
   - **Value**: Generate a secure key:
     ```bash
     # Run this locally to generate a key:
     openssl rand -base64 32
     ```
   - **IMPORTANT**: Copy and save this key! You'll need it for the backend.

6. **Add Persistent Disk**
   - Scroll to "Disk" section
   - Click "Add Disk"
   - **Name**: `typesense-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (free tier allows up to 1GB, sufficient for 253K medicines)

7. **Create Service**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Watch the logs for successful startup

## Step 3: Get Typesense URL and Test

After deployment completes:

1. **Find Your Typesense URL**
   - In Render dashboard, click on your Typesense service
   - At the top, you'll see the URL (e.g., `https://hoperx-typesense.onrender.com`)
   - Copy this URL

2. **Test Health Endpoint**
   ```bash
   curl https://hoperx-typesense.onrender.com/health
   ```
   
   Expected response:
   ```json
   {"ok":true}
   ```

   If you get an error, wait 30 seconds (cold start) and try again.

## Step 4: Update Backend Environment Variables

Now update your **existing backend service** on Render:

1. **Go to Backend Service**
   - In Render dashboard, click on your backend service
   - Go to "Environment" tab

2. **Add Typesense Variables**
   Click "Add Environment Variable" for each:

   ```bash
   TYPESENSE_HOST=hoperx-typesense.onrender.com
   TYPESENSE_PORT=443
   TYPESENSE_PROTOCOL=https
   TYPESENSE_API_KEY=<paste-the-key-from-step-2>
   TYPESENSE_COLLECTION_NAME=medicines
   ```

   **CRITICAL**: Use the SAME `TYPESENSE_API_KEY` you set in Step 2!

3. **Save Changes**
   - Click "Save Changes"
   - Your backend will automatically redeploy (takes 2-3 minutes)

## Step 5: Initialize Search Collection

After your backend finishes redeploying:

1. **Open Render Shell for Backend**
   - In Render dashboard, go to your backend service
   - Click "Shell" tab (top right)
   - This opens a terminal in your backend container

2. **Run Initialization Commands**
   ```bash
   # Create the medicines collection
   npm run medicine:init-search
   
   # Index all 253,973 medicines
   npm run medicine:rebuild-index
   ```

3. **Wait for Indexing**
   This will take 5-10 minutes. You'll see output like:
   ```
   ✅ Collection created successfully!
   🔄 Rebuilding Typesense search index...
   ✅ Index rebuild complete!
     Total medicines: 253973
     Successfully indexed: 253973
     Duration: 8m 32s
   ```

## Step 6: Verify Search Works

Test from your local machine:

```bash
# Replace with your actual backend URL
curl "https://your-backend.onrender.com/api/v1/medicines/search?q=paracetamol" \
  -H "Cookie: your-session-cookie"
```

Or test directly in your frontend - the search should now work!

## Free Tier Limitations & Important Notes

### Render Free Tier for Typesense
- **Memory**: 512 MB RAM (sufficient for 253K medicines)
- **CPU**: Shared
- **Storage**: 1 GB disk (free tier limit, enough for search index)
- **Uptime**: Spins down after 15 minutes of inactivity
- **Cold Start**: 30-60 seconds to wake up
- **Monthly Hours**: 750 hours/month (then spins down until next month)

### Two Separate Services
You'll now have:
1. **Backend Service** (existing) - Your Node.js API
2. **Typesense Service** (new) - Search engine

They communicate over HTTPS. Backend calls Typesense when search is needed.

### Handling Cold Starts

The search will be slow on first request after inactivity. Your frontend already handles this gracefully:

```typescript
// Already implemented in medicineSearchAdapter.ts
try {
  await medicineApi.getStats();
} catch (error) {
  console.warn('Search service warming up...');
  // Retry after 2 seconds
}
```

### Keep-Alive (Optional)

To prevent Typesense from spinning down, add this to your backend:

```javascript
// In backend/src/server.js (after Typesense client is initialized)
if (process.env.NODE_ENV === 'production' && process.env.TYPESENSE_HOST) {
  // Ping Typesense every 10 minutes to keep it alive
  setInterval(async () => {
    try {
      const { checkTypesenseHealth } = require('./lib/typesense/client');
      await checkTypesenseHealth();
      console.log('✅ Typesense keep-alive ping successful');
    } catch (error) {
      console.warn('⚠️ Typesense keep-alive ping failed:', error.message);
    }
  }, 10 * 60 * 1000); // Every 10 minutes
}
```

This keeps Typesense warm during business hours.

## Monitoring

### Check Typesense Health
```bash
curl https://hoperx-typesense.onrender.com/health
```

### Check Collection Stats
```bash
curl "https://hoperx-typesense.onrender.com/collections/medicines" \
  -H "X-TYPESENSE-API-KEY: your-api-key"
```

### View Logs
- Go to Render Dashboard
- Select your Typesense service
- Click "Logs" tab

## Troubleshooting

### Issue: "ECONNREFUSED" errors
**Cause**: Typesense service is spinning down (free tier)
**Solution**: Wait 30-60 seconds for cold start, or upgrade to paid tier

### Issue: "Collection not found"
**Cause**: Collection not initialized
**Solution**: Run `npm run medicine:init-search`

### Issue: "Out of memory"
**Cause**: 512MB RAM limit on free tier
**Solution**: 
- Reduce indexed fields in schema
- Upgrade to Starter plan ($7/month) for 2GB RAM

### Issue: Search returns no results
**Cause**: Index not built
**Solution**: Run `npm run medicine:rebuild-index`

## Upgrading to Paid Tier

For production use, consider upgrading:

**Starter Plan ($7/month)**:
- 2 GB RAM
- No spin-down
- Faster performance
- Better for production

To upgrade:
1. Go to Render Dashboard
2. Select Typesense service
3. Click "Settings" → "Plan"
4. Select "Starter"

## Cost Estimate

### Free Tier (Current)
- Typesense: $0/month
- Backend: $0/month (if on free tier)
- **Total**: $0/month

### Recommended Production Setup
- Typesense Starter: $7/month
- Backend Starter: $7/month
- **Total**: $14/month

## Next Steps

After Typesense is deployed:
1. ✅ Test search endpoints work
2. ✅ Verify all 253K medicines are indexed
3. ⏭️ Update inventory system to use Medicine Master
4. ⏭️ Test end-to-end medicine search in frontend

## Support

If you encounter issues:
1. Check Render logs for both services
2. Verify environment variables are set correctly
3. Ensure API keys match between services
4. Test health endpoints directly
