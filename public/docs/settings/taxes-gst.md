---
title: "Tax Settings & GST Configuration"
slug: "/settings/taxes-gst"
category: "Settings"
tags: ["tax","gst","vat","finance"]
summary: "Configuring tax slabs, HSN codes, and composition schemes."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# Tax Settings & GST Configuration

Quick Steps
1. Settings → Taxes.
2. Ensure your GSTIN is entered in Store Profile.
3. Verify Tax Slabs (0%, 5%, 12%, 18%, 28%).

HSN Mapping:
- Taxes are applied based on the HSN code linked to the Product.
- If HSN 3004 is mapped to 12%, all products with HSN 3004 will be charged 12% GST.

Inter-state vs Intra-state:
- System automatically applies IGST if customer state != store state.
- Applies CGST + SGST if states match.

Related: `/docs/billing/gst-reports`
