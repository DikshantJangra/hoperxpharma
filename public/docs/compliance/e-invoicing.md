---
title: "e-Invoicing (India GST)"
slug: "/compliance/e-invoicing"
category: "Compliance"
tags: ["gst","e-invoice","irp","compliance"]
summary: "Generating IRN and QR codes for B2B transactions > ₹5 Cr turnover."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# e-Invoicing (India GST)

Requirement: Mandatory for B2B transactions if turnover > ₹5 Cr.

Setup:
1. Register on Government IRP portal.
2. Settings → e-Invoicing → Connect GSP.
3. Enter API credentials.

Workflow:
- Create B2B Sale.
- System auto-sends data to IRP.
- Returns IRN (Invoice Reference Number) and QR Code.
- QR Code is printed on the invoice.

Troubleshooting:
- "Invalid GSTIN": Check customer GSTIN validity on portal.

Related: `/docs/billing/receipt-templates`
