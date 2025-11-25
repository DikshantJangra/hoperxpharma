---
title: "Unit Conversions (Box vs Strip)"
slug: "/inventory/unit-conversions"
category: "Inventory"
tags: ["uom","conversion","pack-size"]
summary: "Handling products bought in boxes but sold in loose strips or tablets."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# Unit Conversions (Box vs Strip)

Scenario: You buy a box of 10 strips, but sell 1 strip.

Setup:
1. Product Master → Units.
2. Base Unit: "Strip".
3. Purchase Unit: "Box" = 10 Strips.

Workflow:
- PO: Order 5 Boxes.
- Stock: System adds 50 Strips.
- Sale: Sell 1 Strip. Stock becomes 49.

Related: `/docs/inventory/products-full-guide`
