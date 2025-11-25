---
title: "Refill Management & Reminders"
slug: "/operations/refill-management"
category: "Prescriptions"
tags: ["refill","retention","sms","chronic"]
summary: "Automating refill reminders for chronic patients (diabetes, hypertension)."
difficulty: "Intermediate"
last_updated: "2025-11-25"
estimated_time: "4 min"
---

# Refill Management & Reminders

**Setup:**
1. In Prescription/Sale, check "Chronic Patient".
2. System calculates end date based on dosage (e.g., 30 tablets @ 1 daily = 30 days).
3. Reminder set for `End Date - 3 Days`.

**Notifications:**
- Patient receives SMS/WhatsApp: "Your medicine is due for refill. Reply YES to order."
- Pharmacist sees "Due Refills" list in dashboard.

Related: `/docs/integrations/sms-whatsapp`
