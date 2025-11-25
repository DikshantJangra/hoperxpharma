---
title: "Payment Gateway Integration"
slug: "/integrations/payment-gateway"
category: "Integrations"
tags: ["payment","razorpay","stripe","card"]
summary: "Connecting Razorpay/Stripe/PineLabs for integrated payments."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# Payment Gateway Integration

Supported providers: Razorpay, Stripe, PineLabs (Plutus).

Setup:
1. Settings → Integrations → Payments.
2. Select Provider.
3. Enter API Keys (Publishable Key & Secret Key).
4. Enable `Integrated Terminal` if using a smart POS device.

Usage:
- At checkout, select "Card/Online".
- System pushes amount to terminal/QR code.
- Payment confirmation automatically closes the sale.

Troubleshooting:
- "Terminal Offline": Check Wi-Fi on the card machine.

Related: `/docs/billing/pos-sale`
