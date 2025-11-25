---
title: "Product Master: Fields, Categories & Tips"
slug: "/inventory/products-full-guide"
category: "Inventory"
tags: ["product","sku","barcode","hsn","mrp"]
summary: "Complete guide to the Product Master: what each field means and how to model medicines vs non-medicines."
difficulty: "Beginner"
last_updated: "2025-11-24"
estimated_time: "8 min"
---

# Product Master: Fields, Categories & Tips

Quick view (for /help/docs)
- Name, Brand, SKU, Barcode, Category, Pack Size, MRP, Tax Code, Batch Tracking toggles.

---

## Key fields explained
- **Name:** Official product name (avoid abbreviations).
- **Brand:** Manufacturer.
- **SKU:** Unique internal identifier. No spaces; use `-` or `_`.
- **Barcode:** EAN-13 / UPC / GS1 code. Required for POS scanning.
- **Pack Size:** e.g., 10x10 (10 tablets per strip, 10 strips per box).
- **MRP:** Retail price printed on pack.
- **Cost Price:** What you paid (used in margin reporting).
- **Tax Code / HSN:** Link to tax rates (GST 0/5/12/18).
- **Batch Tracking:** When ON, you must enter batch and expiry on stock receive.

---

## Product types and handling
- **OTC (Over the Counter):** No prescription required.
- **Prescription Medicines:** Enable `Prescription Required` flag. These cannot be sold without a verified prescription.
- **Controlled Substances:** Additional flag (Schedule H/ H1 in India). Requires stricter audit logs and limited access.

---

## Best practices
- Use a consistent SKU format: `BRAND-PRODUCT-STRENGTH-PACK`.
- Use GS1 barcodes where possible for interoperability.
- Set `Reorder Point` and `Lead Time` per SKU for AI forecasting to use.

Troubleshooting:
- Product appears twice in POS: check for duplicates by SKU or barcode; merge or delete the duplicate.

Related: `/docs/inventory/ai-forecast`, `/docs/inventory/batches`
