# OAuth Cookie Fix - Frontend Integration Required

## Problem
Google OAuth login was working, but users were getting logged out on page refresh because cookies weren't being set properly during the OAuth redirect.

## Root Cause
Modern browsers block cookies set during cross-origin redirects due to SameSite restrictions. When the OAuth callback redirected to the frontend, the httpOnly cookies were lost.

## Solution
Changed OAuth flow to pass tokens via URL parameters, then let the frontend set them as httpOnly cookies via a new endpoint.

## Backend Changes (COMPLETED)
1. ✅ OAuth callback now redirects with both `accessToken` and `refreshToken` in URL
2. ✅ New endpoint: `POST /api/v1/auth/set-session` to establish session cookies
3. ✅ Magic link authentication fixed to generate tokens properly

## Frontend Changes Required

### Update OAuth Callback Handler

**File:** `src/pages/auth/callback.tsx` (or similar)

**Current flow:**
```typescript
// OLD - expects token in URL
const token = searchParams.get('token');
```

**New flow:**
```typescript
// NEW - get both tokens and call set-session
const accessToken = searchParams.get('accessToken');
const refreshToken = searchParams.get('refreshToken');
const onboarding = searchParams.get('onboarding');

if (accessToken && refreshToken) {
  // Call set-session endpoint to establish httpOnly cookies
  await fetch(`${API_URL}/api/v1/auth/set-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // CRITICAL: Include cookies
    body: JSON.stringify({ accessToken, refreshToken })
  });
  
  // Store access token in memory for immediate use
  setAuthToken(accessToken);
  
  // Clear tokens from URL (security)
  window.history.replaceState({}, '', '/auth/callback');
  
  // Redirect based on onboarding status
  if (onboarding === 'true') {
    router.push('/onboarding');
  } else {
    router.push('/dashboard');
  }
}
```

### API Endpoint Details

**Endpoint:** `POST /api/v1/auth/set-session`

**Request:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Session established successfully"
}
```

**Side Effects:**
- Sets `accessToken` cookie (httpOnly, 15 min expiry)
- Sets `refreshToken` cookie (httpOnly, 7 day expiry)

## Testing Checklist

- [ ] Google OAuth login works
- [ ] Page refresh maintains authentication
- [ ] Token refresh works automatically
- [ ] Magic link login works
- [ ] Regular email/password login still works
- [ ] Logout clears cookies properly

## Security Notes

1. Tokens are briefly exposed in URL during redirect (unavoidable with OAuth)
2. Frontend MUST clear URL after calling set-session
3. Tokens are immediately stored as httpOnly cookies (XSS protection)
4. All API calls must include `credentials: 'include'` to send cookies

## Questions?
Contact backend team or check `/backend/src/routes/v1/auth.routes.js`
