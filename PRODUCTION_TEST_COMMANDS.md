# Production Testing Commands

Quick reference for testing your production deployment.

## 1. Test Backend Health

```bash
curl https://hoperxpharma.onrender.com/api/v1/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T..."
}
```

## 2. Test CORS Configuration

```bash
curl -I -X OPTIONS https://hoperxpharma.onrender.com/api/v1/auth/refresh \
  -H "Origin: https://hoperxpharma.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Expected headers:**
```
HTTP/2 204
access-control-allow-origin: https://hoperxpharma.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

**❌ Bad response:**
```
access-control-allow-origin: *
# or
access-control-allow-origin: http://localhost:3000
```
This means backend didn't pick up the `FRONTEND_URL` environment variable.

## 3. Test Medicine Stats Endpoint

```bash
curl -I https://hoperxpharma.onrender.com/api/v1/medicines/stats
```

**Expected:**
- `401 Unauthorized` (requires authentication) ✅
- `200 OK` (if you include auth token) ✅

**❌ Bad response:**
- `404 Not Found` - endpoint doesn't exist
- `500 Internal Server Error` - backend error
- `502 Bad Gateway` - backend is down

## 4. Test with Authentication

First, get an access token by logging in, then:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Origin: https://hoperxpharma.vercel.app" \
     https://hoperxpharma.onrender.com/api/v1/medicines/stats
```

**Expected:** JSON response with medicine statistics

## 5. Check Backend Logs on Render

```bash
# In Render Dashboard:
# 1. Go to your backend service
# 2. Click "Logs" tab
# 3. Look for these messages:

# On startup:
CORS: Allowed origins - https://hoperxpharma.vercel.app

# On requests:
CORS: Blocked request from unauthorized origin: <some-origin>
# (This is bad - means CORS is blocking your frontend)
```

## 6. Check Frontend Build Logs on Vercel

```bash
# In Vercel Dashboard:
# 1. Go to your project
# 2. Click "Deployments"
# 3. Click on latest deployment
# 4. Check "Build Logs"
# 5. Look for:

Environment Variables:
  NEXT_PUBLIC_API_URL: https://hoperxpharma.onrender.com/api/v1
  NEXT_PUBLIC_API_TIMEOUT: 30000
```

## 7. Test Frontend in Browser

Open DevTools Console (F12) and run:

```javascript
// Check API URL configuration
console.log(process.env.NEXT_PUBLIC_API_URL);
// Should show: https://hoperxpharma.onrender.com/api/v1

// Test fetch to backend
fetch('https://hoperxpharma.onrender.com/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
// Should show health check response, not CORS error
```

## 8. Monitor Network Requests

In Chrome DevTools:
1. Open Network tab (F12)
2. Filter by "Fetch/XHR"
3. Try to log in
4. Look for:
   - ✅ Requests to `hoperxpharma.onrender.com` succeed
   - ❌ Requests show "CORS error" in red
   - ❌ Requests show "Failed to fetch"

## 9. Check for Infinite Loops

In Chrome DevTools Console:
1. Clear console
2. Wait 10 seconds
3. Count `/auth/refresh` requests
4. Should be: 0-1 requests ✅
5. If you see: 10+ requests ❌ - infinite loop still present

## 10. Test Complete Login Flow

```bash
# 1. Open incognito window
# 2. Go to: https://hoperxpharma.vercel.app
# 3. Open DevTools Console (F12)
# 4. Try to log in
# 5. Watch for:

✅ POST /auth/login → 200 OK
✅ POST /auth/refresh → 200 OK (maybe 1-2 times)
✅ GET /medicines/stats → 200 OK
✅ Redirect to /dashboard

❌ CORS error
❌ Failed to fetch
❌ Infinite /auth/refresh loop
❌ 401 Unauthorized (after login)
```

## Common Issues and Quick Fixes

### Issue: CORS error
**Fix:** Redeploy backend on Render

### Issue: Failed to fetch
**Fix:** Check backend is running, redeploy frontend on Vercel

### Issue: Infinite /auth/refresh
**Fix:** Clear browser cache, use incognito mode

### Issue: 401 Unauthorized after login
**Fix:** Check JWT secrets are set on Render

### Issue: Medicine index preload fails
**Fix:** Verify CORS is working, check backend logs

## Emergency Reset

If nothing works:

```bash
# 1. Render: Restart backend service
# 2. Vercel: Redeploy without build cache
# 3. Browser: Clear all data (Ctrl+Shift+Delete)
# 4. Browser: Use incognito mode
# 5. Test again
```
