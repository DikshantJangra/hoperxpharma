# Store ID Fix - Ingest Page

## Issue
When saving a medicine on the ingest page, users were getting the error:
```
Store not found. Please select a store first.
```

## Root Cause
The ingest page was trying to get `storeId` from `localStorage.getItem('primaryStore')`, but the correct location is inside the user object at `localStorage.getItem('user')`.

## Solution

### Before (Incorrect):
```typescript
const storeId = localStorage.getItem('primaryStore');
```

### After (Correct):
```typescript
// Get storeId from localStorage on component mount
React.useEffect(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      setStoreId(user.storeId || '');
      console.log('[Ingest] Store ID loaded:', user.storeId);
    } catch (error) {
      console.error('[Ingest] Failed to parse user data:', error);
    }
  }
}, []);
```

## Changes Made

**File: `app/(main)/inventory/ingest/page.tsx`**

1. Added `storeId` state variable:
   ```typescript
   const [storeId, setStoreId] = useState<string>('');
   ```

2. Added `useEffect` to load storeId from user object on mount:
   ```typescript
   React.useEffect(() => {
     const userStr = localStorage.getItem('user');
     if (userStr) {
       try {
         const user = JSON.parse(userStr);
         setStoreId(user.storeId || '');
       } catch (error) {
         console.error('[Ingest] Failed to parse user data:', error);
       }
     }
   }, []);
   ```

3. Updated submit function to use state variable:
   ```typescript
   if (!storeId) {
     setErrors(['Store not found. Please log in again or select a store.']);
     return;
   }
   ```

4. Added logging for debugging:
   ```typescript
   console.log('[Ingest] Store ID loaded:', user.storeId);
   console.log('[Ingest] Submitting medicine with storeId:', storeId);
   ```

## Pattern Used
This follows the same pattern used in other pages like `app/(main)/pos/new-sale/page.tsx`:
- Get user object from localStorage
- Parse JSON
- Extract storeId from user object
- Store in state variable
- Use throughout component

## Testing
1. Log in to the application
2. Navigate to Inventory → Add Medicine (Ingest page)
3. Fill in medicine details
4. Add salt composition
5. Click "Save Medicine"
6. Should now save successfully without "Store not found" error

## Result
✅ Medicine can now be saved successfully
✅ Store ID is correctly retrieved from user object
✅ Follows the same pattern as other pages in the app
✅ Added logging for easier debugging

---

**Status**: ✅ FIXED
**Date**: January 2025
**Impact**: HIGH - Users can now add medicines successfully
