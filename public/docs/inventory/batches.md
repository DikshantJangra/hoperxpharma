---
title: "Batch & Expiry Management"
slug: "/inventory/batches"
category: "Inventory"
tags: ["batch","expiry","lot","stock"]
summary: "How to manage batches, expiries, recalls and expired-stock workflows."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "6 min"
---

# Batch & Expiry Management

Quick Steps
1. Receive stock → enter Batch No & Expiry.
2. Use Expiry Alerts dashboard to view soon-to-expire items.
3. Move expired items to quarantine.

---

## Receiving batch-tracked items
When creating a PO or receiving ad-hoc:
- Enter `Batch Number`, `Manufacture Date` (optional), `Expiry Date`, `Quantity`, and `Unit Cost`.
- Save; the batch is now part of inventory.

---

## Expiry reports & actions
- **Expiry Alert** shows items expiring in 30/60/90 days.
- To clear soon-expiring stock: create a **Promotion** or **Clearance PO** and mark discount in POS.
- For expired stock: move to **Quarantine** and create a **Disposal Record** (linked to compliance export).

Recalls:
- Flag affected batch → system automatically marks stock as `Quarantined` and prevents sale.
- Print recall notice and create vendor return.

Related: `/docs/inventory/products-full-guide`, `/docs/compliance/audit-logs`
