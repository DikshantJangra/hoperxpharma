# RENDER DEPLOYMENT FIX CHECKLIST

## Your backend is returning 503 - Service Unavailable

### Immediate Actions:

1. **Check Render Dashboard Logs**
   - Go to: https://dashboard.render.com
   - Select your backend service
   - Check "Logs" tab for errors

2. **Verify Environment Variables on Render**
   Required vars:
   ```
   NODE_ENV=production
   DATABASE_URL=<your-neon-db-url>
   DIRECT_URL=<your-neon-direct-url>
   JWT_SECRET=<your-secret>
   JWT_REFRESH_SECRET=<your-secret>
   FRONTEND_URL=https://hoperxpharma.vercel.app
   PORT=8000
   ```

3. **Common Render Issues:**
   - ❌ Missing DATABASE_URL → Service won't start
   - ❌ Wrong start command → Check `package.json` scripts
   - ❌ Build failed → Check build logs
   - ❌ Out of memory → Upgrade plan or optimize

4. **Quick Fix Commands:**
   ```bash
   # In Render dashboard, trigger manual deploy
   # Or restart service
   ```

5. **Verify Start Command:**
   Should be: `node src/server.js` or `npm start`

### After Backend is Up:

6. **Update Vercel Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://hoperxpharma.onrender.com/api/v1
   NEXT_PUBLIC_BACKEND_URL=https://hoperxpharma.onrender.com
   ```

7. **Redeploy Frontend on Vercel**

### The sidebarStates Error:
- This is a BROWSER EXTENSION issue (not your code)
- Disable browser extensions or use incognito mode
