---
title: "Accounting Software Sync (Tally/QuickBooks)"
slug: "/integrations/accounting"
category: "Integrations"
tags: ["accounting","tally","quickbooks","finance"]
summary: "Syncing daily sales and purchases to external accounting tools."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "6 min"
---

# Accounting Software Sync

Supported: Tally Prime, QuickBooks Online, Xero.

Setup:
1. Settings → Integrations → Accounting.
2. Authorize connection (OAuth for QB/Xero; Tally Connector for Tally).
3. Map Ledgers:
   - Sales → Sales Account
   - Cash → Cash-in-Hand
   - Bank → Bank Account

Sync frequency:
- Auto-sync runs nightly at 00:00.
- Manual sync available via "Sync Now" button.

Related: `/docs/reports/standard-reports`
