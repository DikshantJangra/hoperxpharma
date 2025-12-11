# Dual-Strategy Chrome Installation for Render

This setup uses **both strategies** for maximum reliability:

## Strategy 1: Docker (Primary) ✅ RECOMMENDED

Chrome is installed at system level in the Docker image.

**Pros:**
- ⚡ Fast startup (Chrome already installed)
- 🔒 Predictable and reliable
- 💰 No runtime download bandwidth

**Deployment Steps:**
1. In Render Dashboard, change service environment to **"Docker"**
2. Render will automatically use the `Dockerfile`
3. Chrome will be at `/usr/bin/google-chrome-stable`

## Strategy 2: Runtime Installation (Fallback) 🛡️

If Chrome isn't found (non-Docker deployment), it's installed at startup.

**How it works:**
- `npm start` runs `scripts/ensure-chrome.js`
- Script checks for system Chrome first
- If not found, downloads Chrome via Puppeteer
- Then starts the server

**Pros:**
- Works even if you can't use Docker
- Automatic fallback safety net

**Cons:**
- Slower first startup (~30-60 seconds)
- Downloads Chrome on every container restart

## What Changed

### 1. `package.json`
```json
"start": "node scripts/ensure-chrome.js"  // Was: "node src/server.js"
"postinstall": "npx prisma generate"      // Removed: "&& npx puppeteer browsers install chrome"
```

### 2. New File: `scripts/ensure-chrome.js`
- Checks for Chrome before starting server
- Installs if missing
- Then starts `src/server.js`

### 3. `Dockerfile`
- Installs Chrome as system package
- Sets `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`

### 4. `pdfService.js`
- Already has path detection logic
- Will find Chrome in either location

## Testing Locally

```bash
# Test the startup script
npm start

# You should see:
# ✅ System Chrome found at: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
# ✅ Chrome check complete. Starting server...
```

## Deployment Flow

### With Docker (Strategy 1):
1. Render builds Docker image → Chrome installed
2. Container starts → `ensure-chrome.js` finds system Chrome ✅
3. Server starts immediately

### Without Docker (Strategy 2):
1. Render deploys Node app → No Chrome
2. Container starts → `ensure-chrome.js` doesn't find Chrome
3. Script runs `npx puppeteer browsers install chrome`
4. Chrome downloads (~30-60 sec)
5. Server starts

## Verification

After deployment, check logs for:

```
🔍 Checking for Chrome installation...
✅ System Chrome found at: /usr/bin/google-chrome-stable
✅ Chrome check complete. Starting server...
```

Or if fallback triggered:
```
⚠️  System Chrome not found. Checking Puppeteer installation...
📥 No Chrome installation found. Installing Chrome at runtime...
⏳ This may take 30-60 seconds on first startup...
✅ Chrome installed successfully!
```

## Which Strategy Will Work?

- **Docker deployment**: Strategy 1 (instant startup) ✅
- **Node deployment**: Strategy 2 (downloads at startup) ✅  
- **Both**: You're covered! 🎯

The beauty is you don't have to choose - both are active at once!
