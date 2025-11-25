---
title: "SMS & WhatsApp Notifications"
slug: "/integrations/sms-whatsapp"
category: "Integrations"
tags: ["sms","whatsapp","notifications","marketing"]
summary: "Configuring automated messages for invoices, refills, and marketing."
difficulty: "Intermediate"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# SMS & WhatsApp Notifications

Setup:
1. Settings → Integrations → Communication.
2. Connect Twilio / Gupshup / WhatsApp Business API.

Triggers:
- **Invoice:** Sent immediately after sale.
- **Refill Reminder:** Sent X days before medicine runs out (calculated from dosage).
- **Birthday:** Automated greeting with coupon.

Compliance:
- System automatically handles "STOP" replies to unsubscribe customers (DND compliance).

Related: `/docs/customers/customer-profiles`
