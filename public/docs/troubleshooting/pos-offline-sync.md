---
title: "POS Offline Mode & Sync"
slug: "/troubleshooting/pos-offline-sync"
category: "Troubleshooting"
tags: ["offline","sync","internet","pos"]
summary: "How to sell without internet and sync later."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "4 min"
---

# POS Offline Mode & Sync

**Offline Capability:**
- You can continue to scan items and print receipts even if internet is down.
- Data is stored locally in the browser (IndexedDB).

**Syncing:**
- When internet returns, a "Syncing..." indicator appears in top right.
- Do not clear browser cache while offline.

**Limitations:**
- Credit card terminals may not work (unless they have 4G).
- Customer loyalty points won't update until sync.

Related: `/docs/billing/pos-sale`
