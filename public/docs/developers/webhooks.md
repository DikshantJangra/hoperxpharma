---
title: "Webhooks"
slug: "/developers/webhooks"
category: "Developers"
tags: ["webhooks","events","realtime"]
summary: "Subscribing to real-time events like order.created or inventory.low."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# Webhooks

Configure endpoints in Settings → Developers → Webhooks.

**Events:**
- `order.created`: New sale completed.
- `inventory.low`: Product hit reorder point.
- `customer.created`: New profile added.

**Payload:**
JSON format. Contains `event_id`, `timestamp`, and `data` object.

**Security:**
- Verify `X-HopeRx-Signature` header using your webhook secret (HMAC-SHA256).

Related: `/docs/developers/api-overview`
