# Render Deployment Guide - PDF Generation Fix

## ✅ The Issue
Puppeteer requires Chromium to generate PDFs. Render's default Node environment doesn't include Chromium.

## ✅ Solution: Deploy with Docker

### Step 1: Repository Setup

Your backend folder already has:
- ✅ `Dockerfile` (ready to use)
- ✅ Puppeteer configured with Render-compatible flags
- ✅ Server listens on `process.env.PORT`

### Step 2: Push to GitHub

Make sure your latest code (including the Dockerfile) is pushed to GitHub.

### Step 3: Create Render Web Service

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Render will auto-detect the `Dockerfile`

### Step 4: Configure Service

**Environment Tab - Add these variables:**
```
NODE_ENV=production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
DATABASE_URL=<your-database-url>
DIRECT_URL=<your-direct-database-url>
JWT_SECRET=<your-secret>
R2_ACCOUNT_ID=<your-r2-account>
R2_ACCESS_KEY_ID=<your-r2-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret>
R2_BUCKET_NAME=<your-bucket>
R2_PUBLIC_URL=<your-r2-url>
```

**Settings:**
- **Instance Type:** Free
- **Docker Command:** (leave default - uses CMD from Dockerfile)
- **Auto-Deploy:** Yes (optional)

### Step 5: Deploy

Click **Create Web Service**. Render will:
1. Build Docker image with Chromium
2. Install all dependencies
3. Generate Prisma client
4. Start your app

### Step 6: Verify

Once deployed:
1. Check logs for successful startup
2. Test PDF download/print
3. Verify QR codes appear in invoices

---

## 🚀 What Was Fixed

### Puppeteer Configuration
Both PO and Invoice PDF generation now use:
```javascript
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-web-security',
    '--disable-dev-tools',
    '--no-zygote'
  ]
});
```

### Dockerfile
Installs Chromium + all required dependencies in a slim container.

---

## ⚠️ Free Tier Constraints

- **Sleep Mode:** Container sleeps after 15 minutes of inactivity (first request after sleep takes ~30s)
- **Resources:** 0.1 CPU, ~512MB RAM (sufficient for Puppeteer)
- **Hours:** 750 free hours/month

---

## 🔧 Troubleshooting

### Error: "Could not find Chrome"
- Check `PUPPETEER_EXECUTABLE_PATH` env variable is set
- Verify Dockerfile is being used (not buildpack)

### Error: "Failed to launch chrome"
- Check render logs for missing dependencies
- Dockerfile includes all required libraries

### PDF generation times out
- First request after sleep is slow (~30s)
- Consider upgrading to paid tier to avoid sleep

### QR code not appearing
- Verify backend server is restarted
- Check UPI ID is saved in store settings
- Check backend logs for QR generation messages

---

## ✅ Testing Checklist

After deployment:
- [ ] Invoice downloads successfully
- [ ] Invoice prints correctly
- [ ] QR code appears with bill amount
- [ ] Logo displays at 120px
- [ ] Signature displays at 80px
- [ ] Footer text appears
- [ ] Billed By shows user name (not ID)


Create `Dockerfile` in backend directory:

```dockerfile
FROM node:18-slim

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "start"]
```

### Option 2: Add Build Script (Alternative)

If you can't use Docker, add this to your Render build command:

```bash
npm install && \
apt-get update && \
apt-get install -y chromium chromium-sandbox && \
npx prisma generate
```

And set environment variable:
```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### Option 3: Use puppeteer-core with chrome-aws-lambda

Install alternative package:
```bash
npm install chrome-aws-lambda puppeteer-core
```

Then update `pdfService.js`:
```javascript
const chromium = require('chrome-aws-lambda');

// In generatePOPdf and generateSaleInvoicePdf:
const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
});
```

## Render-Specific Configuration

1. **Build Command:**
   ```
   npm install && npx prisma generate
   ```

2. **Start Command:**
   ```
   npm start
   ```

3. **Environment Variables:**
   - Add `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` if using Dockerfile

## Testing

After deployment:
1. Check Render logs for Puppeteer errors
2. Try generating/downloading an invoice
3. Verify QR code appears in PDF

## Common Errors

- `Error: Could not find Chrome` → Chromium not installed
- `Error: Failed to launch chrome` → Missing dependencies
- `TimeoutError: Navigation timeout` → Increase timeout or check puppeteer args
