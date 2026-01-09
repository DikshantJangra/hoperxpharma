# Backend Schema Requirements for Expiration System

## Prisma Schema Changes Needed

Add these fields to the `Subscription` model in `backend/prisma/schema.prisma`:

```prisma
model Subscription {
  // ... existing fields
  
  // Expiration tracking (REQUIRED for LayoutWithExpirationAlert)
  expiresAt             DateTime?  @default(now())
  expirationNotified7d  Boolean    @default(false)
  expirationNotified3d  Boolean    @default(false)
  expirationNotified1d  Boolean    @default(false)
  
  // Grace period system
  gracePeriodEndsAt     DateTime?
  gracePeriodGranted    Boolean    @default(false)
  
  // Auto-renewal
  autoRenewEnabled      Boolean    @default(true)
  
  // Welcome flag (for Premium Welcome Experience)
  welcomeShown          Boolean    @default(false)
  welcomeShownAt        DateTime?
  
  // Indexes for performance
  @@index([expiresAt])
  @@index([gracePeriodEndsAt])
}
```

## Migration Command

After updating schema, run:
```bash
cd backend
npx prisma migrate dev --name add_subscription_expiration_fields
npx prisma generate
```

## Current Status

**Frontend**: Production-safe ✅
- Uses defensive coding with `(subscription as any)` for missing fields
- Falls back to `currentPeriodEnd` if `expiresAt` doesn't exist
- Won't crash if backend fields are missing

**Backend**: Schema update required ⚠️
- Add fields to Subscription model
- Run migration
- Update GET /subscriptions/me to return new fields

## Testing After Migration

1. Verify no TypeScript errors
2. Check expiration banner displays correctly
3. Test with different subscription statuses
4. Verify grace period logic works
