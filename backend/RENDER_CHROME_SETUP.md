# Render Deployment Instructions for Chrome/Puppeteer

## Option 1: Using Render Dashboard (RECOMMENDED)

Since Render's `nativeEnvironments` feature in render.yaml is not well-documented for Chrome, the most reliable method is to configure this through the Render Dashboard:

### Steps:

1. **Log in to Render Dashboard** at https://dashboard.render.com

2. **Navigate to your backend service**

3. **Go to Environment settings**

4. **Add Build Command**:
   ```bash
   apt-get update && apt-get install -y wget gnupg && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && apt-get update && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends && npm install && npm run build
   ```

   **OR** if the above doesn't work, use a simpler approach:

5. **Alternative: Use Dockerfile**
   
   Create a `Dockerfile` in your backend directory:
   ```dockerfile
   FROM node:18-slim

   # Install Chrome dependencies
   RUN apt-get update && apt-get install -y \
       wget \
       gnupg \
       ca-certificates \
       fonts-liberation \
       libappindicator3-1 \
       libasound2 \
       libatk-bridge2.0-0 \
       libatk1.0-0 \
       libcups2 \
       libdbus-1-3 \
       libgdk-pixbuf2.0-0 \
       libnspr4 \
       libnss3 \
       libx11-xcb1 \
       libxcomposite1 \
       libxdamage1 \
       libxrandr2 \
       xdg-utils \
       --no-install-recommends

   # Install Chrome
   RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
       && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
       && apt-get update \
       && apt-get install -y google-chrome-stable --no-install-recommends \
       && rm -rf /var/lib/apt/lists/*

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   RUN npx prisma generate

   EXPOSE 8000

   CMD ["npm", "start"]
   ```

   Then in Render, change your service type to "Docker" and it will use this Dockerfile.

## Option 2: Using render.yaml (May require Render support)

The `render.yaml` file has been created, but Render's support for native Chrome packages may be limited. If using render.yaml, you may need to contact Render support to enable Chrome installation.

## Verification

After deploying with either method above:

1. Check the deployment logs for Chrome installation success
2. Test the PDF endpoint: `GET /api/v1/sales/{saleId}/invoice/pdf`
3. Look for these log messages:
   - ✅ "Using system Chrome at: /usr/bin/google-chrome-stable"
   - Or ✅ "Using Puppeteer installed Chrome at: ..."

If you see ❌ "No Chrome installation found!", then the Chrome installation failed and you need to try the Dockerfile approach.
