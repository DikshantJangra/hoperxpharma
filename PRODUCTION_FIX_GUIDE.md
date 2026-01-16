# Production Fix Guide - CORS & Failed to Fetch Errors

## Quick Diagnostic

**Current Error:** `Failed to preload medicine index: TypeError: Failed to fetch`

**Most Likely Cause:** Backend hasn't been redeployed after setting `FRONTEND_URL` environment variable.

**Quick Fix:**
1. Go to Render Dashboard → Backend Service
2. Click "Manual Deploy" → "Deploy latest commit" (or "Restart Service")
3. Watch logs for: `CORS: Allowed origins - https://hoperxpharma.vercel.app`
4. Go to Vercel Dashboard → Project → Deployments → Redeploy (disable build cache)
5. Clear browser cache and test

---

## Current Status
- ✅ Backend `FRONTEND_URL` is set correctly: `https://hoperxpharma.vercel.app`
- ✅ Frontend `.env.production` is configured: `NEXT_PUBLIC_API_URL=https://hoperxpharma.onrender.com/api/v1`
- ❌ Still getting "Failed to fetch" errors in production

## Problem
The production frontend at `https://hoperxpharma.vercel.app` is experiencing:
1. "Failed to fetch" errors when calling backend APIs
2. Medicine index preload failing
3. Possible CORS issues despite correct environment variables

## Root Causes

### 1. Backend Not Redeployed After Environment Variable Change
Setting environment variables on Render doesn't automatically restart the service with new values. You need to manually redeploy.

### 2. Vercel Environment Variables Not Set
The frontend on Vercel needs `NEXT_PUBLIC_API_URL` set in the Vercel dashboard, not just in `.env.production`.

### 3. Token Refresh Loop (Already Fixed in Code)
The infinite loop has been fixed in the codebase:
- ✅ Removed redundant `checkAuth()` call in `AuthProvider.tsx`
- ✅ Added 5-second cooldown between sync attempts in `sync-manager.ts`
- ✅ Prevented auth endpoints from being queued in `client.ts`
- ✅ Added max 3 retries before dropping mutations

## Required Actions

### Step 1: Verify and Redeploy Render Backend

Even though `FRONTEND_URL` is set, the backend needs to be redeployed to use the new value.

1. **Go to Render Dashboard** → Your Backend Service
2. **Check Environment Variables**:
   - `FRONTEND_URL=https://hoperxpharma.vercel.app` ✅ (already set)
   - `NODE_ENV=production` (verify this is set)
   - `ALLOWED_ORIGINS` (optional, can be left empty)
3. **Manual Deploy**:
   - Click "Manual Deploy" → "Deploy latest commit"
   - OR click "Restart Service" if no code changes needed
4. **Watch the logs** during deployment:
   - Look for: `CORS: Allowed origins - https://hoperxpharma.vercel.app`
   - This confirms the backend is using the correct origin

### Step 2: Configure Vercel Frontend Environment Variables

The `.env.production` file in your repo is NOT automatically used by Vercel. You must set environment variables in the Vercel dashboard.

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add these variables** (if not already present):
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://hoperxpharma.onrender.com/api/v1
   Environment: Production
   ```
   ```
   Name: NEXT_PUBLIC_API_TIMEOUT
   Value: 30000
   Environment: Production
   ```
3. **Save changes**

### Step 3: Redeploy Vercel Frontend

After setting environment variables:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. **IMPORTANT**: Check "Use existing Build Cache" = OFF (to ensure new env vars are used)
5. Click "Redeploy"

### Step 4: Clear Browser Cache

After both services are redeployed:
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Incognito mode for a clean test

### Step 5: Test CORS with curl

Before testing in browser, verify CORS is working:

```bash
curl -I -X OPTIONS https://hoperxpharma.onrender.com/api/v1/auth/refresh \
  -H "Origin: https://hoperxpharma.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Expected response headers:**
```
HTTP/2 204
access-control-allow-origin: https://hoperxpharma.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**If you see a different origin or no CORS headers**, the backend didn't pick up the environment variable. Redeploy again.

### Step 6: Test Production in Browser

1. Open `https://hoperxpharma.vercel.app` in an incognito window
2. Open browser DevTools → Console
3. Try to log in
4. Check for:
   - ❌ No CORS errors
   - ❌ No "Failed to fetch" errors
   - ❌ No infinite `/auth/refresh` requests
   - ✅ Successful login and redirect to dashboard

## Verification Checklist

- [x] Backend `FRONTEND_URL` environment variable set on Render
- [ ] Backend redeployed/restarted on Render
- [ ] Backend logs show correct CORS origins
- [ ] Vercel environment variables set in dashboard
- [ ] Frontend redeployed on Vercel (without build cache)
- [ ] Browser cache cleared
- [ ] CORS headers verified with curl
- [ ] Login works without CORS errors
- [ ] No "Failed to fetch" errors in console
- [ ] No infinite token refresh loop in console
- [ ] Dashboard loads correctly after login
- [ ] Medicine index preloads successfully

## Backend CORS Configuration (Reference)

The backend already has the correct CORS configuration in `backend/src/app.js`:

```javascript
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://hoperxpharma.vercel.app'
];

// Add additional origins from environment variable
if (process.env.ALLOWED_ORIGINS) {
  const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...additionalOrigins);
}
```

## Token Refresh Safeguards (Already Implemented)

The following safeguards are now in place to prevent infinite loops:

1. **AuthProvider.tsx**: Only calls `checkAuth()` once on mount
2. **sync-manager.ts**: 5-second cooldown between sync attempts
3. **client.ts**: Auth endpoints never queued for offline sync
4. **client.ts**: Circuit breaker after 3 consecutive refresh failures

## Troubleshooting

### Issue 1: Still getting CORS errors after redeploy

**Check Render logs:**
1. Render Dashboard → Backend Service → Logs
2. Look for the startup message: `CORS: Allowed origins - ...`
3. Verify `https://hoperxpharma.vercel.app` is in the list

**If the origin is NOT in the logs:**
- The `FRONTEND_URL` environment variable is not set correctly
- Try setting it again and restart the service
- Make sure there are no trailing slashes: `https://hoperxpharma.vercel.app` (not `https://hoperxpharma.vercel.app/`)

### Issue 2: "Failed to fetch" but no CORS error

This usually means:
1. **Backend is down or not responding**
   - Check Render service status
   - Check backend health: `https://hoperxpharma.onrender.com/api/v1/health`

2. **Frontend is using wrong API URL**
   - Check Vercel environment variables
   - Verify `NEXT_PUBLIC_API_URL=https://hoperxpharma.onrender.com/api/v1`
   - Redeploy without build cache

3. **Network timeout**
   - Render free tier can be slow on first request (cold start)
   - Wait 30 seconds and try again

### Issue 3: Token refresh loop persists

**If you still see infinite `/auth/refresh` requests:**
1. Clear all browser data (cookies, cache, local storage)
2. Use incognito mode for testing
3. Check browser console for specific error messages
4. Verify the fixes are deployed:
   ```bash
   # Check if AuthProvider fix is deployed
   curl https://hoperxpharma.vercel.app/_next/static/chunks/pages/_app.js | grep "checkAuth"
   ```

### Issue 4: Login works but dashboard fails

**If login succeeds but dashboard shows errors:**
1. Check browser console for specific API errors
2. Verify all backend environment variables are set (JWT secrets, database, etc.)
3. Check backend logs for errors during API calls
4. Test specific API endpoints:
   ```bash
   # Test with your access token
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://hoperxpharma.onrender.com/api/v1/medicines/stats
   ```

### Issue 5: Medicine index preload fails

**Error:** `Failed to preload medicine index`

**Causes:**
1. CORS not configured (see Issue 1)
2. Backend `/medicines/stats` endpoint failing
3. Database connection issues
4. Missing authentication token

**Debug:**
```bash
# Test the endpoint directly
curl -I https://hoperxpharma.onrender.com/api/v1/medicines/stats
```

Expected: `200 OK` or `401 Unauthorized` (not `404` or `500`)

### Issue 6: Vercel environment variables not taking effect

**Symptoms:** Changes to Vercel env vars don't work

**Solution:**
1. After changing env vars, you MUST redeploy
2. When redeploying, UNCHECK "Use existing Build Cache"
3. This forces Vercel to rebuild with new environment variables
4. Wait for deployment to complete (check logs)

---

## Troubleshooting

### If CORS errors persist:
1. Check Render logs: `Render Dashboard → Service → Logs`
2. Look for: `CORS: Allowed origins - ...`
3. Verify your frontend URL is in the list

### If token refresh loop persists:
1. Clear browser cache and cookies
2. Check browser console for specific error messages
3. Verify backend `/auth/refresh` endpoint is responding correctly

### If login fails:
1. Check backend logs for authentication errors
2. Verify JWT secrets are set correctly
3. Test backend health: `https://hoperxpharma.onrender.com/api/v1/health`

## Next Steps After Fix

Once production is working:
1. Monitor backend logs for any errors
2. Test all major features (inventory, POS, prescriptions)
3. Set up monitoring/alerting for production errors
4. Consider adding rate limiting alerts
