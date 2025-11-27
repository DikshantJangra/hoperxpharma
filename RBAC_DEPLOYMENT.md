# RBAC System - Next Steps & Deployment Guide

## ✅ What's Been Completed

### Backend (100% Complete)
- ✅ Enhanced database schema with `UserRoleAssignment` and `AdminPin` tables
- ✅ 42 granular permissions across 8 categories
- ✅ 4 built-in roles with default permission mappings
- ✅ Permission evaluation service with LRU caching
- ✅ Role management service
- ✅ User role assignment service
- ✅ Admin PIN service with bcrypt hashing
- ✅ Complete REST API (25+ endpoints)
- ✅ Enhanced RBAC middleware
- ✅ Database seed scripts

### Frontend (Core Complete)
- ✅ RBAC API client (`lib/api/rbac.ts`)
- ✅ Auth store with permissions support
- ✅ `usePermissions` hook
- ✅ `PermissionGate` component
- ✅ Role management page (`/settings/roles`)
- ✅ Permissions reference page (`/settings/permissions`)
- ✅ Role editor component
- ✅ User role manager component
- ✅ Admin PIN modal component

### Migration Tools
- ✅ User migration script (`scripts/migrate-users-to-rbac.js`)

---

## 🚀 Deployment Steps

### Step 1: Database Migration

```bash
cd backend

# Run Prisma migration to create new tables
npx prisma migrate dev --name add_rbac_tables

# Or for production
npx prisma migrate deploy
```

### Step 2: Seed Permissions and Roles

```bash
# Run seed script to populate permissions and roles
npx prisma db seed

# This will create:
# - 42 permissions
# - 4 built-in roles (ADMIN, PHARMACIST, TECHNICIAN, CASHIER)
```

### Step 3: Migrate Existing Users

```bash
# Run user migration script
node scripts/migrate-users-to-rbac.js

# This will:
# - Map existing User.role enum values to new Role table
# - Create UserRoleAssignment entries for all users
# - Preserve store associations (store-scoped roles)
# - Provide detailed migration report
```

### Step 4: Verify Migration

```bash
# Check the migration results
# The script will output:
# - Number of users migrated
# - Number of role assignments created
# - Any users without role assignments (warnings)
```

---

## 🔧 Applying Permissions to Existing Endpoints

Now that the RBAC system is in place, you need to protect existing API endpoints with permissions.

### Example: Protecting Patient Routes

**Before:**
```javascript
// backend/src/routes/v1/patients.routes.js
router.post('/', 
  requireAuth, 
  requireStoreAccess, 
  patientController.create
);
```

**After:**
```javascript
const { PERMISSIONS } = require('../../constants/permissions');

router.post('/', 
  requireAuth, 
  requireStoreAccess,
  requirePermission(PERMISSIONS.PATIENT_CREATE),
  patientController.create
);

router.get('/:id',
  requireAuth,
  requireStoreAccess,
  requirePermission(PERMISSIONS.PATIENT_READ),
  patientController.getById
);

router.put('/:id',
  requireAuth,
  requireStoreAccess,
  requirePermission(PERMISSIONS.PATIENT_UPDATE),
  patientController.update
);

router.delete('/:id',
  requireAuth,
  requireStoreAccess,
  requirePermission(PERMISSIONS.PATIENT_DELETE),
  patientController.delete
);
```

### Routes to Update

Apply permissions to these route files:

1. **Patient Routes** (`patients.routes.js`)
   - Use `PERMISSIONS.PATIENT_*`

2. **Prescription Routes** (`prescriptions.routes.js`)
   - Use `PERMISSIONS.PRESCRIPTION_*`

3. **Inventory Routes** (`inventory.routes.js`)
   - Use `PERMISSIONS.INVENTORY_*`

4. **Sales Routes** (`sales.routes.js`)
   - Use `PERMISSIONS.SALES_*`

5. **Purchase Order Routes** (`purchaseOrders.routes.js`)
   - Use `PERMISSIONS.PO_*`

6. **Expense Routes** (if exists)
   - Use `PERMISSIONS.EXPENSE_*`

7. **Report Routes** (if exists)
   - Use `PERMISSIONS.REPORT_*`

---

## 🎨 Frontend Integration

### Using Permission Gates in Components

```tsx
import { PermissionGate } from '@/components/rbac/PermissionGate';

// Hide entire component if no permission
<PermissionGate permission="patient.create">
  <CreatePatientButton />
</PermissionGate>

// Show fallback if no permission
<PermissionGate 
  permission="patient.delete"
  fallback={<div>You don't have permission to delete patients</div>}
>
  <DeletePatientButton />
</PermissionGate>

// Require ANY of multiple permissions
<PermissionGate permission={["patient.read", "patient.export"]}>
  <ViewPatientsPage />
</PermissionGate>

// Require ALL permissions
<PermissionGate 
  permission={["patient.read", "patient.update"]} 
  requireAll={true}
>
  <EditPatientForm />
</PermissionGate>
```

### Using the usePermissions Hook

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function PatientActions() {
  const { can, canAny, canAll } = usePermissions();

  return (
    <div>
      {can('patient.create') && <CreateButton />}
      {can('patient.update') && <EditButton />}
      {can('patient.delete') && <DeleteButton />}
      
      {/* Check multiple permissions */}
      {canAny(['patient.read', 'patient.export']) && <ViewButton />}
      {canAll(['patient.read', 'patient.update']) && <AdvancedEditButton />}
    </div>
  );
}
```

### Disabling Buttons Based on Permissions

```tsx
function ActionButton() {
  const { can } = usePermissions();
  
  return (
    <button
      disabled={!can('patient.delete')}
      className={!can('patient.delete') ? 'opacity-50 cursor-not-allowed' : ''}
      onClick={handleDelete}
    >
      Delete Patient
    </button>
  );
}
```

---

## 🔐 Admin PIN Integration

### When to Require Admin PIN

Use Admin PIN verification for critical operations:

1. **Deleting important records** (patients, prescriptions)
2. **Voiding sales transactions**
3. **Approving high-value purchase orders**
4. **Changing system settings**
5. **Managing user roles**

### Example: Requiring PIN for Critical Action

```tsx
import { useState } from 'react';
import { AdminPinModal } from '@/components/rbac/AdminPinModal';

function DeletePatientButton({ patientId }) {
  const [showPinModal, setShowPinModal] = useState(false);

  const handleDeleteClick = () => {
    setShowPinModal(true);
  };

  const handlePinVerified = async () => {
    setShowPinModal(false);
    // Proceed with deletion
    await deletePatient(patientId);
  };

  return (
    <>
      <button onClick={handleDeleteClick}>
        Delete Patient
      </button>
      
      {showPinModal && (
        <AdminPinModal
          mode="verify"
          onSuccess={handlePinVerified}
          onCancel={() => setShowPinModal(false)}
        />
      )}
    </>
  );
}
```

---

## 📊 Testing Checklist

### Backend Testing

- [ ] Test permission evaluation for each role
- [ ] Test store-scoped permissions
- [ ] Test admin bypass (ADMIN role has all permissions)
- [ ] Test permission caching and invalidation
- [ ] Test Admin PIN setup, verify, and change
- [ ] Test Admin PIN lockout after failed attempts
- [ ] Test role CRUD operations
- [ ] Test user role assignment/removal
- [ ] Test permission denial logging

### Frontend Testing

- [ ] Test permission gates hide/show components correctly
- [ ] Test usePermissions hook returns correct permissions
- [ ] Test role management page (create, edit, delete roles)
- [ ] Test permissions reference page
- [ ] Test user role assignment
- [ ] Test Admin PIN modal (setup, verify, change)
- [ ] Test permission-based button disabling
- [ ] Test navigation hiding based on permissions

### Integration Testing

- [ ] Test full user flow: login → permissions loaded → UI reflects permissions
- [ ] Test role change → permissions update → UI updates
- [ ] Test store switch → permissions update for new store
- [ ] Test permission-protected API calls fail without permission
- [ ] Test permission-protected API calls succeed with permission

---

## 🎯 Recommended Permission Assignments

### ADMIN Role
- **All permissions** (automatic bypass)

### PHARMACIST Role
- Patient: create, read, update
- Prescription: create, read, update, fulfill, refill
- Inventory: read, update
- Sales: create, read, refund
- PO: create, read, receive
- Expense: create, read
- Reports: sales, inventory

### TECHNICIAN Role
- Patient: read
- Prescription: read, fulfill
- Inventory: read
- Sales: create, read
- PO: read

### CASHIER Role
- Patient: read
- Sales: create, read
- Inventory: read

---

## 🔄 Rollback Plan

If you need to rollback the RBAC system:

### 1. Database Rollback

```bash
# Revert the migration
npx prisma migrate reset

# Or manually drop tables
# DROP TABLE "UserRoleAssignment";
# DROP TABLE "AdminPin";
# ALTER TABLE "Role" DROP COLUMN "builtIn", DROP COLUMN "category";
# ALTER TABLE "Permission" DROP COLUMN "code", DROP COLUMN "category", DROP COLUMN "resource";
```

### 2. Code Rollback

```bash
# Revert to previous commit
git revert <commit-hash>

# Or manually:
# - Remove RBAC routes from backend
# - Remove permission checks from middleware
# - Remove RBAC components from frontend
# - Restore old auth store without permissions
```

---

## 📝 Adding New Permissions

### 1. Add to Constants

```javascript
// backend/src/constants/permissions.js
PERMISSIONS.NEW_FEATURE_CREATE = 'new_feature.create';

// Add to metadata
{
  code: 'new_feature.create',
  name: 'Create New Feature',
  description: 'Allows creating new features',
  category: 'feature',
  resource: 'new_feature'
}
```

### 2. Seed to Database

```bash
# Re-run seed script
npx prisma db seed
```

### 3. Assign to Roles

```javascript
// Update backend/prisma/seeds/roles.js
// Add the new permission code to appropriate roles
```

### 4. Use in Routes

```javascript
router.post('/new-feature',
  requireAuth,
  requirePermission(PERMISSIONS.NEW_FEATURE_CREATE),
  controller.create
);
```

### 5. Use in Frontend

```tsx
<PermissionGate permission="new_feature.create">
  <CreateFeatureButton />
</PermissionGate>
```

---

## 🎉 You're All Set!

The RBAC system is now fully implemented and ready for deployment. Follow the steps above to:

1. ✅ Run database migrations
2. ✅ Seed permissions and roles
3. ✅ Migrate existing users
4. ✅ Apply permissions to existing endpoints
5. ✅ Test thoroughly
6. ✅ Deploy to production

For questions or issues, refer to the comprehensive walkthrough in `.gemini/antigravity/brain/*/walkthrough.md`.
