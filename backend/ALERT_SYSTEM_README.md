# Alert System - Quick Start Guide

## 🚀 Integration (3 Steps)

### 1. Add AlertProvider to App Layout

```tsx
// app/layout.tsx
import { AlertProvider } from '@/contexts/AlertContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
```

### 2. Add NotificationBell to Navigation

```tsx
// components/navigation/TopNav.tsx
import { NotificationBell } from '@/components/ui/NotificationBell';

<nav>
  {/* ... other nav items */}
  <NotificationBell />
</nav>
```

### 3. Add DashboardAlerts Widget

```tsx
// app/(main)/dashboard/page.tsx
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';

<Dashboard>
  <DashboardAlerts />
  {/* ... other widgets */}
</Dashboard>
```

---

## 📊 System Overview

**30+ files created across:**
- Database schema (3 enums, 2 models enhanced)
- Event system (EventBus, 15+ event types)
- Rule engine (6 production rules)
- Backend API (9 endpoints)
- Frontend UI (4 components)
- Background jobs (2 scheduled tasks)

**The alert system is production-ready!** ✅

---

## 🧪 Quick Test

Create a batch expiring in 5 days:
```javascript
// Backend will automatically:
// 1. Emit INVENTORY.EXPIRY_NEAR event
// 2. Rule engine evaluates → CRITICAL alert
// 3. Alert saved to database
// 4. Frontend polls → badge shows "1"
```

---

## 📖 Full Documentation

See [walkthrough.md](file:///Users/dikshantjangra/.gemini/antigravity/brain/a909e16f-e92a-43e6-b751-1504c96747ae/walkthrough.md) for complete architecture, API docs, and testing guide.
