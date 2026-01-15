# Typesense Quick Start Guide

## What You're Doing

Adding Typesense as a **separate service** on Render to enable medicine search.

```
BEFORE:
┌─────────────────┐
│  Backend API    │ ← Your existing service
│  (Node.js)      │
└─────────────────┘

AFTER:
┌─────────────────┐     ┌──────────────────┐
│  Backend API    │────→│  Typesense       │ ← New service
│  (Node.js)      │     │  (Search Engine) │
└─────────────────┘     └──────────────────┘
```

## 5-Minute Setup Checklist

### ☐ Step 1: Create Typesense Service (5 min)

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Select your repository (same as backend)
4. Fill in:
   - **Name**: `hoperx-typesense`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile.typesense`
   - **Docker Command**: `--data-dir /data --api-key $TYPESENSE_API_KEY --enable-cors`
   - **Plan**: `Free`

5. Add Environment Variable:
   - **Key**: `TYPESENSE_API_KEY`
   - **Value**: Run `openssl rand -base64 32` and paste result
   - **SAVE THIS KEY!** You'll need it next.

6. Add Disk:
   - **Name**: `typesense-data`
   - **Mount Path**: `/data`
   - **Size**: `1 GB`

7. Click "Create Web Service"
8. Wait 2-3 minutes for deployment

### ☐ Step 2: Update Backend Config (2 min)

1. Go to your **backend service** in Render
2. Click "Environment" tab
3. Add these variables:
   ```
   TYPESENSE_HOST=hoperx-typesense.onrender.com
   TYPESENSE_PORT=443
   TYPESENSE_PROTOCOL=https
   TYPESENSE_API_KEY=<paste-key-from-step-1>
   TYPESENSE_COLLECTION_NAME=medicines
   ```
4. Click "Save Changes"
5. Wait for backend to redeploy (2-3 min)

### ☐ Step 3: Initialize Search Index (10 min)

1. Go to your **backend service** in Render
2. Click "Shell" tab (top right)
3. Run these commands:
   ```bash
   npm run medicine:init-search
   npm run medicine:rebuild-index
   ```
4. Wait for indexing to complete (~8-10 minutes)
5. You'll see: "✅ Successfully indexed: 253973"

### ☐ Step 4: Test It Works (1 min)

Open your frontend and try searching for a medicine. It should work now!

Or test with curl:
```bash
curl "https://your-backend.onrender.com/api/v1/medicines/stats"
```

## Troubleshooting

### "ECONNREFUSED" Error
**Problem**: Typesense is spinning down (free tier)
**Solution**: Wait 30 seconds and try again (cold start)

### "Collection not found"
**Problem**: Didn't run init-search
**Solution**: Run `npm run medicine:init-search` in backend shell

### "No results found"
**Problem**: Index not built
**Solution**: Run `npm run medicine:rebuild-index` in backend shell

### Backend can't connect to Typesense
**Problem**: Wrong API key or URL
**Solution**: 
1. Check Typesense service URL in Render
2. Verify API keys match exactly
3. Redeploy backend after fixing

## Cost Breakdown

### Free Tier (What You're Using)
- Backend: $0/month
- Typesense: $0/month
- Database: $0/month (if using free tier)
- **Total: $0/month**

### Limitations
- Typesense spins down after 15 min inactivity
- 30-60 second cold start
- 750 hours/month uptime limit

### Upgrade Path (When Ready)
- Typesense Starter: $7/month (no spin-down, 2GB RAM)
- Backend Starter: $7/month (no spin-down)
- **Total: $14/month** for production-ready setup

## What Happens Next?

After Typesense is deployed:
1. ✅ Search API will work (no more 500 errors)
2. ✅ Medicine autocomplete will work
3. ✅ Frontend search will be fast
4. ⏭️ Next: Update inventory to use Medicine Master

## Need Help?

Check the full guide: `TYPESENSE_RENDER_DEPLOYMENT.md`

Or check logs:
- Render Dashboard → Typesense Service → Logs
- Render Dashboard → Backend Service → Logs
