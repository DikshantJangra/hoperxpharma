# Single Container Deployment: Backend + Typesense Together

## Overview

This approach runs **both** your Node.js backend and Typesense in a **single Docker container** on Render. This means:
- ✅ **Only ONE service to pay for** (not two)
- ✅ **No extra cost** for Typesense
- ✅ **Simpler deployment** (one service instead of two)
- ✅ **Faster communication** (localhost, no network latency)

## How It Works

```
┌─────────────────────────────────────┐
│   Single Render Service             │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Node.js    │  │  Typesense  │ │
│  │   Backend    │  │   Search    │ │
│  │   Port 5000  │  │  Port 8108  │ │
│  └──────────────┘  └─────────────┘ │
│         ↑                 ↑         │
│         └─────localhost───┘         │
└─────────────────────────────────────┘
```

Both processes run inside the same container, managed by `supervisord`.

## Files Created

1. **`Dockerfile`** - Multi-stage build that includes both Node.js and Typesense
2. **`supervisord.conf`** - Configuration to run both processes together

## Deployment Steps

### Step 1: Update Your Repository

The `Dockerfile` and `supervisord.conf` are already created. Just commit them:

```bash
git add Dockerfile supervisord.conf
git commit -m "Add single-container deployment for backend + Typesense"
git push
```

### Step 2: Update Render Service

1. **Go to your existing backend service** on Render
2. **Go to Settings**
3. **Update Build Settings**:
   - **Environment**: Change to `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.` (root directory)
   - Leave Docker Command empty (uses CMD from Dockerfile)

4. **Add Disk** (if not already present):
   - Name: `typesense-data`
   - Mount Path: `/data/typesense`
   - Size: `1 GB`

5. **Add/Update Environment Variables**:
   ```bash
   TYPESENSE_API_KEY=<generate-with-openssl-rand-base64-32>
   # All your existing env vars stay the same
   ```

6. **Save and Deploy**

### Step 3: Wait for Deployment

- Render will rebuild your service with the new Dockerfile
- This takes 5-10 minutes (first time)
- Both Node.js and Typesense will start automatically

### Step 4: Initialize Search Index

After deployment completes:

1. **Open Render Shell** for your backend service
2. **Run initialization**:
   ```bash
   npm run medicine:init-search
   npm run medicine:rebuild-index
   ```

3. **Wait for indexing** (8-10 minutes)

### Step 5: Verify It Works

Test the search endpoint:
```bash
curl "https://your-backend.onrender.com/api/v1/medicines/stats"
```

Should return collection stats (not 500 error).

## Cost Comparison

### Before (Two Services)
- Backend: $7/month (Starter)
- Typesense: $7/month (Starter)
- **Total: $14/month**

### After (One Service)
- Backend + Typesense: $7/month (Starter)
- **Total: $7/month**

**Savings: $7/month (50% reduction!)**

### Free Tier Option
You can even use the free tier for both:
- Backend + Typesense: $0/month (Free)
- **Total: $0/month**

Limitations:
- Spins down after 15 min inactivity
- 30-60 second cold start
- 750 hours/month limit

## Resource Usage

### Memory
- Node.js Backend: ~200-300 MB
- Typesense: ~150-200 MB
- **Total: ~400-500 MB**

This fits comfortably in:
- Free tier: 512 MB RAM ✅
- Starter tier: 2 GB RAM ✅✅

### CPU
Both processes share CPU. For your use case (occasional searches), this is fine.

### Disk
- Typesense index: ~100-200 MB (for 253K medicines)
- Node.js: ~50 MB
- **Total: ~150-250 MB**

Fits easily in 1 GB disk.

## Advantages

1. **Cost Savings**: Only pay for one service
2. **Faster**: Localhost communication (no network latency)
3. **Simpler**: One service to manage, not two
4. **Easier**: One set of logs, one deployment

## Disadvantages

1. **Shared Resources**: Both compete for RAM/CPU
2. **Coupled Deployment**: Can't update one without the other
3. **Restart Together**: If one crashes, both restart

For your use case (occasional medicine search), the advantages far outweigh the disadvantages.

## Monitoring

### Check Both Processes Are Running

In Render Shell:
```bash
# Check supervisor status
supervisorctl status

# Should show:
# backend    RUNNING   pid 123, uptime 0:05:00
# typesense  RUNNING   pid 124, uptime 0:05:00
```

### View Logs

In Render Dashboard:
- All logs from both processes appear in the same log stream
- Look for:
  - `[backend]` - Node.js logs
  - `[typesense]` - Typesense logs

### Test Typesense Directly

From Render Shell:
```bash
curl http://localhost:8108/health
# Should return: {"ok":true}
```

## Troubleshooting

### Issue: "Typesense not responding"
**Check**: Is Typesense process running?
```bash
supervisorctl status typesense
```

**Fix**: Restart Typesense
```bash
supervisorctl restart typesense
```

### Issue: "Backend can't connect to Typesense"
**Check**: Environment variables
```bash
echo $TYPESENSE_HOST  # Should be "localhost"
echo $TYPESENSE_PORT  # Should be "8108"
```

**Fix**: Verify `supervisord.conf` has correct environment variables

### Issue: "Out of memory"
**Symptom**: Service keeps restarting
**Cause**: 512 MB free tier is too small
**Fix**: Upgrade to Starter plan ($7/month) for 2 GB RAM

### Issue: "Deployment fails"
**Check**: Dockerfile syntax
**Fix**: Verify `Dockerfile` and `supervisord.conf` are correct

## Rollback Plan

If this doesn't work, you can easily rollback:

1. Go to Render service settings
2. Change Environment back to `Node`
3. Remove Dockerfile Path
4. Redeploy

Your service will go back to Node.js only (without Typesense).

## Alternative: PostgreSQL Search

If even this is too complex, you can use PostgreSQL full-text search instead:
- No Typesense needed at all
- Uses existing database
- Slightly slower but good enough
- See `backend/src/services/PostgresSearchService.js`

## Recommendation

For your use case (production pharmacy system with occasional medicine search):

**Best Option**: Single container (Backend + Typesense)
- Cost: $7/month (Starter) or $0/month (Free)
- Performance: Fast search
- Complexity: Medium
- Maintenance: Low

**Alternative**: PostgreSQL search
- Cost: $0/month (uses existing DB)
- Performance: Good enough
- Complexity: Low
- Maintenance: Very low

I recommend trying the single container approach first. If it's too complex, fall back to PostgreSQL search.

## Next Steps

1. Commit `Dockerfile` and `supervisord.conf`
2. Update Render service to use Docker
3. Add disk and environment variables
4. Deploy and test
5. Initialize search index
6. Verify search works

Total time: 30-45 minutes
Cost: $7/month (or $0 with free tier)

Let me know if you want to proceed with this approach!
