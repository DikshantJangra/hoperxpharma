---
title: "Running a Point of Sale (POS) Transaction"
slug: "/billing/pos-sale"
category: "Sales & POS"
tags: ["billing","gst","checkout","cashier"]
summary: "Guide to billing customers, handling GST, and accepting payments."
difficulty: "Beginner"
last_updated: "2025-11-24"
estimated_time: "4 min"
---

# Running a POS Transaction

Quick Steps
1. Billing → POS → New Sale.
2. Scan product or search name.
3. Click Pay → choose payment(s) → Confirm.
4. Receipt prints; WhatsApp copy sent if customer opted in.

---

## POS flow & UI overview
- **Cart area**: shows items, quantity, discount, tax.
- **Payments panel**: choose Cash/Card/UPI/Wallet.
- **Customer panel**: attach a customer profile for loyalty and invoice copy.
- **Prescription loader**: pull verified prescriptions.

---

## GST handling (India)
- Products have HSN codes. System applies CGST+SGST or IGST automatically.
- For B2B: enter buyer GSTIN to generate Tax Invoice.
- For composition dealers: configure in Settings → Taxes to change invoice templates.

Split payments:
- Select **Split Payment** during Checkout.
- Enter amounts for each method and confirm.

Troubleshooting:
- PG (payment gateway) failures: check transaction logs (Settings → Integrations → Payment Gateways).
- Printer not printing receipts: verify printer connectivity and paper.

Related: `/docs/billing/receipt-templates`, `/docs/inventory/products-full-guide`
