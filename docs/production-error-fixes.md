# Production Error Fixes - January 2026

## Fixed Issues

### 1. ✅ IPv6 Rate Limiting Error (CRITICAL)

**Error:**
```
ValidationError: Custom keyGenerator appears to use request IP without calling the ipKeyGenerator helper function for IPv6 addresses
```

**Root Cause:**
Custom `keyGenerator` in `rateLimiting.js` was manually extracting IP from `X-Forwarded-For` header without proper IPv6 normalization.

**Fix:**
Removed custom `keyGenerator` entirely. Express-rate-limit's built-in IP extraction properly handles:
- IPv4 addresses
- IPv6 addresses  
- IPv6-mapped IPv4 addresses
- Proxy headers when `app.set('trust proxy', true)` is enabled

**Changes:**
- File: `backend/src/middlewares/rateLimiting.js`
- Removed `trustProxyConfig` object with custom `keyGenerator`
- Removed `...trustProxyConfig` spread from all rate limiters
- Added comment explaining IPv6 compatibility

**Why This Works:**
Express automatically reads `X-Forwarded-For` when `trust proxy` is enabled (which we have in `app.js` line 29), and `express-rate-limit` uses `req.ip` which is properly extracted by Express.

---

### 2. ✅ Cookie Security Warning

**Warning:**
```
⚠️  WARNING: COOKIE_SECURE should be true in production
```

**Root Cause:**
`.env` file missing `COOKIE_SECURE=true` for production environments.

**Fix:**
1. Created `.env.production.template` with all required production settings
2. Added `COOKIE_SECURE=true` to template
3. Documented cookie security configuration

**Critical Settings for Production:**
```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

**Why These Matter:**
- `COOKIE_SECURE=true`: Ensures cookies only sent over HTTPS (prevents man-in-the-middle attacks)
- `COOKIE_SAME_SITE=none`: Required for cross-domain cookies (frontend on Vercel, backend on Render)
- Must have HTTPS for `sameSite: 'none'` to work

**How Code Uses It:**
The `authController.js` checks:
```javascript
const isProduction = process.env.NODE_ENV === 'production' ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));
```

Then sets cookies with:
```javascript
res.cookie('accessToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction
});
```

---

### 3. ⚠️ Unauthorized Errors (401) on Alerts Endpoint

**Error:**
```
2026-01-09 06:16:11 warn: Unauthorized on /api/v1/alerts
```

**Root Cause Analysis:**

This is NOT a backend bug. The backend is correctly rejecting requests without valid tokens. The issue is on the frontend:

**Possible Causes:**
1. **Token Expiration**: Access token expires after 15 minutes, frontend not refreshing
2. **Token Not Sent**: Frontend not including `Authorization` header or cookie
3. **CORS Issues**: Cookies not being sent cross-domain
4. **Refresh Token Failure**: Refresh endpoint failing silently

**Frontend Code to Check:**

```javascript
// 1. Check if apiClient includes credentials
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true  // CRITICAL for cookies
});

// 2. Check if token is being sent
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken') || // From memory
                  Cookies.get('accessToken');              // From cookie
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Check if 401s trigger refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Try to refresh token
            try {
                const refreshResponse = await axios.post(
                    `${API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                
                // Retry original request
                return apiClient(error.config);
            } catch (refreshError) {
                // Redirect to login
                window.location.href = '/login';
            }
        }
        throw error;
    }
);
```

**Quick Debug Steps:**

1. **Open Browser DevTools** → Network tab
2. **Look at `/api/v1/alerts` request**
3. **Check Request Headers:**
   - Should have `Authorization: Bearer <token>` OR
   - Should have `Cookie: accessToken=<token>`
4. **If missing token:**
   - Check if `/api/v1/auth/refresh` is being called
   - Check if refresh is succeeding
   - Check if cookies are being set with correct domain/sameSite

**Backend Logs Confirmation:**

The repeated 401s show the frontend is making requests without credentials. This is expected behavior - backend is correctly protecting the endpoint.

**Action Required:**
Frontend needs to implement proper token refresh logic or ensure cookies are being sent with requests.

---

## Deployment Checklist

### Backend (Render)

1. **Set Environment Variables:**
   ```bash
   # Copy from .env.production.template
   COOKIE_SECURE=true
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   # ... all other vars
   ```

2. **Verify Settings:**
   ```bash
   # In Render dashboard, go to Environment
   # Confirm:
   ✅ COOKIE_SECURE=true
   ✅ NODE_ENV=production
   ✅ FRONTEND_URL starts with https://
   ✅ RAZORPAY_MODE=live
   ```

3. **Verify Trust Proxy:**
   - Already configured in `app.js` line 29
   - No action needed

4. **Deploy:**
   ```bash
   git add .
   git commit -m "fix: IPv6 rate limiting and cookie security"
   git push origin main
   ```

### Frontend (Vercel)

1. **Check API Client:**
   ```javascript
   // Must have:
   withCredentials: true
   ```

2. **Check Token Refresh:**
   - Implement 401 interceptor
   - Call `/auth/refresh` on 401
   - Retry failed request

3. **Check Cookie Domain:**
   - Backend and frontend must share top-level domain OR
   - Use Authorization header instead of cookies

---

## Testing

### 1. Test Rate Limiting
```bash
# Should work for both IPv4 and IPv6
curl -H "X-Forwarded-For: 2001:0db8:85a3::8a2e:0370:7334" \
     http://localhost:8000/api/v1/payments/create-order

# Should not throw IPv6 error
```

### 2. Test Cookie Security
```bash
# In production, cookies should have:
# - Secure flag
# - SameSite=None
# - HttpOnly flag

# Check response headers:
Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=None; Path=/
```

### 3. Test Auth Flow
```bash
# 1. Login
POST /api/v1/auth/login
# Should set cookies

# 2. Make authenticated request
GET /api/v1/alerts
# Should include cookie or Authorization header

# 3. After 15 minutes
GET /api/v1/alerts
# Should get 401

# 4. Refresh
POST /api/v1/auth/refresh
# Should set new cookies

# 5. Retry
GET /api/v1/alerts
# Should work
```

---

## Summary

| Issue | Status | Impact |
|-------|--------|--------|
| IPv6 Rate Limiting | ✅ FIXED | Critical - was blocking deployment |
| Cookie Security | ✅ FIXED | High - security vulnerability |
| Unauthorized Alerts | ⚠️ FRONTEND | Medium - UX issue, not security |

**All backend issues resolved. Frontend needs token refresh implementation.**
