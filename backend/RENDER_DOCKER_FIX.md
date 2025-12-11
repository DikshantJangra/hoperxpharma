# 🚨 RENDER PDF FIX - YOU MUST USE DOCKER

## The Problem
Your Render logs show:
```
Could not find Chrome (ver. 142.0.7444.175)
cache path is: /opt/render/.cache/puppeteer
```

**This means Render is using the Node BUILDPACK, not your Dockerfile!**

Puppeteer downloads Chromium to its cache, but on Render's free tier it gets wiped on every deploy.

## ✅ THE FIX: Force Render to Use Docker

### Step 1: Go to Render Dashboard
1. Open your web service
2. Go to **Settings**
3. Scroll to **Build & Deploy**

### Step 2: Check Runtime
Look for **"Runtime"** or **"Environment"**

**Currently:** It probably says "Node"  
**Change to:** "Docker"

### Step 3: Save and Redeploy
Click **"Save Changes"** then **"Manual Deploy" → "Deploy latest commit"**

---

## Alternative: Add .render.yaml (Recommended)

Create this file in your **backend root**:

**`render.yaml`**:
```yaml
services:
  - type: web
    name: hoperxpharma-backend
    runtime: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    envVars:
      - key: NODE_ENV
        value: production
      - key: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
        value: true
      - key: PUPPETEER_EXECUTABLE_PATH
        value: /usr/bin/chromium
```

Push to GitHub → Render will auto-detect and use Docker.

---

## What Your Dockerfile Does

Your Dockerfile (already created):
1. Installs Chromium at `/usr/bin/chromium`
2. Installs all Chrome dependencies
3. Sets `PUPPETEER_EXECUTABLE_PATH` env variable

**But only if Render uses Docker!**

---

## Verify It's Working

After redeploying with Docker:

1. Check Render **Build Logs** for:
   ```
   Step 1/10 : FROM node:18-slim
   Successfully built xxx
   ```

2. Check **Runtime Logs** for successful PDF generation:
   ```
   ✓ QR Code generated successfully
   (no Chromium errors)
   ```

---

## Quick Checklist

- [ ] Dockerfile exists in backend root
- [ ] Render service set to "Docker" runtime
- [ ] Environment variables set (see original guide)
- [ ] Redeployed after changes
- [ ] Build logs show Docker steps
- [ ] PDF generation works

---

## If Still Failing

1. **Check Render Build Logs** - Does it say "Installing dependencies from package.json" (buildpack) or "Step 1/10: FROM node:18" (Docker)?

2. **If buildpack:** Render isn't using your Dockerfile. Make sure:
   - Dockerfile is in repo root where Render looks
   - Runtime is set to Docker in settings
   - Or add render.yaml

3. **If Docker but still failing:** Check you set env variable `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`
