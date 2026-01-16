# Fix Production NOW - Step by Step

Follow these steps in order. Don't skip any step.

## ✅ Step 1: Redeploy Backend on Render

1. Go to: https://dashboard.render.com
2. Click on your backend service
3. Click **"Manual Deploy"** button (top right)
4. Select **"Deploy latest commit"**
5. Wait for deployment to complete (watch the logs)
6. Look for this line in logs: `CORS: Allowed origins - https://hoperxpharma.vercel.app`

**Why:** Even though you set `FRONTEND_URL`, Render doesn't automatically restart with new env vars.

---

## ✅ Step 2: Set Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these (if not already there):

   **Variable 1:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://hoperxpharma.onrender.com/api/v1`
   - Environment: **Production** ✅

   **Variable 2:**
   - Name: `NEXT_PUBLIC_API_TIMEOUT`
   - Value: `30000`
   - Environment: **Production** ✅

5. Click **Save**

---

## ✅ Step 3: Redeploy Frontend on Vercel

1. Still in Vercel Dashboard
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the **three dots (...)** → **Redeploy**
5. **IMPORTANT:** Uncheck **"Use existing Build Cache"**
6. Click **Redeploy**
7. Wait for deployment to complete

**Why:** Vercel needs to rebuild with the new environment variables.

---

## ✅ Step 4: Test CORS

Open terminal and run:

```bash
curl -I -X OPTIONS https://hoperxpharma.onrender.com/api/v1/auth/refresh \
  -H "Origin: https://hoperxpharma.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

**Look for:**
```
access-control-allow-origin: https://hoperxpharma.vercel.app
```

**If you see something else**, go back to Step 1 and redeploy backend again.

---

## ✅ Step 5: Test in Browser

1. Open **Chrome Incognito Window** (Ctrl+Shift+N)
2. Go to: `https://hoperxpharma.vercel.app`
3. Open **DevTools** (F12) → **Console** tab
4. Try to **log in**

**Check for:**
- ❌ No "Failed to fetch" errors
- ❌ No CORS errors
- ❌ No infinite `/auth/refresh` requests
- ✅ Successful login

---

## ✅ Step 6: Verify Everything Works

After logging in, check:
- [ ] Dashboard loads
- [ ] Medicine search works
- [ ] No console errors
- [ ] Medicine index preloads successfully

---

## 🚨 If Still Not Working

### Check Backend Logs
1. Render Dashboard → Backend Service → **Logs**
2. Look for errors or CORS messages

### Check Frontend Logs
1. Vercel Dashboard → Deployments → Latest → **Build Logs**
2. Verify environment variables are shown

### Check Browser Console
1. F12 → Console
2. Look for specific error messages
3. Share the exact error with me

---

## 📋 Quick Checklist

- [ ] Backend redeployed on Render
- [ ] Backend logs show correct CORS origin
- [ ] Vercel env vars set in dashboard
- [ ] Frontend redeployed without build cache
- [ ] CORS test with curl passes
- [ ] Login works in incognito mode
- [ ] No console errors
- [ ] Dashboard loads successfully

---

## 🆘 Emergency Contact

If you're still stuck after following all steps:

1. Take a screenshot of:
   - Render backend logs (the CORS line)
   - Vercel environment variables page
   - Browser console errors

2. Share with me and I'll help debug further.

---

## ⏱️ Expected Time

- Step 1: 2-3 minutes (backend deploy)
- Step 2: 1 minute (set env vars)
- Step 3: 2-3 minutes (frontend deploy)
- Step 4: 30 seconds (test CORS)
- Step 5: 1 minute (test in browser)
- **Total: ~10 minutes**

---

## 🎯 Success Criteria

You'll know it's working when:
1. No errors in browser console
2. Login redirects to dashboard
3. Medicine search loads data
4. No "Failed to fetch" messages

**Good luck! 🚀**
