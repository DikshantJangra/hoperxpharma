# Supplier Fetching Debug Guide

## ✅ What I Verified

### 1. **Backend Routes** ✓
- Routes are properly registered in `/backend/src/routes/v1/index.js`
- Supplier routes are mounted at `/suppliers`
- Route order is correct (stats before :id)

### 2. **Backend Controller** ✓
- `getSuppliers()` properly handles pagination
- `getSupplierStats()` returns stats
- Both use proper error handling

### 3. **Backend Service** ✓
- Service layer properly calls repository
- Validation logic is in place
- Error handling is correct

### 4. **Backend Repository** ✓
- Prisma queries are correct
- Filters work properly (search, category, status)
- Pagination is implemented
- Soft delete filter (`deletedAt: null`) is applied

### 5. **Frontend API Client** ✓
- API client properly configured
- Token management in place
- Error handling implemented
- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`

### 6. **Frontend Components** ✓
- SupplierList component fetches data on mount
- Proper loading states
- Error handling with retry
- Pagination implemented

## 🔍 Debugging Steps

### Step 1: Check Browser Console
Open your browser DevTools (F12) and check the Console tab for:
- 🔍 Fetching suppliers log
- 📦 API Response log
- ✅ Suppliers fetched count
- ❌ Any error messages

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `/suppliers`
4. Check:
   - **Status Code**: Should be 200
   - **Request Headers**: Check if Authorization token is present
   - **Response**: Check the actual data returned

### Step 3: Verify Authentication
```javascript
// In browser console:
localStorage.getItem('accessToken')
```
- If null → You're not logged in
- If present → Token exists

### Step 4: Check Backend Logs
In your backend terminal, you should see:
```
GET /api/v1/suppliers?page=1&limit=20
```

### Step 5: Check Database
Run this query in your database:
```sql
SELECT COUNT(*) FROM "Supplier" WHERE "deletedAt" IS NULL;
```
- If 0 → No suppliers in database
- If > 0 → Suppliers exist

## 🐛 Common Issues & Solutions

### Issue 1: "No suppliers found"
**Possible Causes:**
- Database is empty
- All suppliers are soft-deleted
- Authentication token is invalid

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/api/v1/health

# Test supplier endpoint (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/v1/suppliers
```

### Issue 2: Network Error / CORS
**Possible Causes:**
- Backend not running
- Wrong API URL
- CORS not configured

**Solution:**
1. Check if backend is running on port 8000
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check backend CORS configuration

### Issue 3: 401 Unauthorized
**Possible Causes:**
- Not logged in
- Token expired
- Token not sent in request

**Solution:**
1. Log in again
2. Check localStorage for token
3. Verify token is being sent in Authorization header

### Issue 4: 500 Internal Server Error
**Possible Causes:**
- Database connection issue
- Prisma client not generated
- Backend code error

**Solution:**
```bash
cd backend
npx prisma generate
npm run dev
```

## 🧪 Manual Testing

### Test 1: Create a Supplier via API
```bash
curl -X POST http://localhost:8000/api/v1/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "category": "Distributor",
    "status": "Active",
    "contactName": "John Doe",
    "phoneNumber": "9876543210",
    "email": "test@supplier.com",
    "addressLine1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001"
  }'
```

### Test 2: Get Suppliers
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/suppliers?page=1&limit=20
```

### Test 3: Get Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/suppliers/stats
```

## 📊 Expected Response Format

### GET /suppliers
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "clxxx...",
      "name": "Test Supplier",
      "category": "Distributor",
      "status": "Active",
      "contactName": "John Doe",
      "phoneNumber": "9876543210",
      "email": "test@supplier.com",
      "gstin": null,
      "city": "Mumbai",
      "state": "Maharashtra",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### GET /suppliers/stats
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 5,
    "active": 4,
    "expiringLicenses": 2,
    "outstanding": 50000
  }
}
```

## 🔧 Quick Fixes

### Added Console Logging
I've added detailed console logging to `SupplierList.tsx`:
- Logs when fetching starts
- Logs API response
- Logs success/failure
- Logs error details

**Check your browser console now!**

### Next Steps
1. Open the supplier page in your browser
2. Open DevTools (F12)
3. Check Console tab for logs
4. Check Network tab for API calls
5. Share the logs/errors you see

## 📝 Environment Variables

Make sure these are set in your `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Backend `.env`:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
```

## 🎯 Summary

**The code is correct!** The issue is likely one of:
1. ❌ No data in database
2. ❌ Authentication issue
3. ❌ Backend not running
4. ❌ Wrong API URL

**Check the browser console logs I added to identify the exact issue.**
