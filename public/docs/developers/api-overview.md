---
title: "API Overview & Authentication"
slug: "/developers/api-overview"
category: "Developers"
tags: ["api","dev","rest","auth"]
summary: "Introduction to the REST API, authentication, and rate limits."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# API Overview & Authentication

Base URL: `https://api.hoperx.com/v1`

**Authentication:**
- Uses Bearer Token.
- Generate API Key in Settings → Developers.
- Header: `Authorization: Bearer <YOUR_API_KEY>`

**Rate Limits:**
- 100 requests per minute per store.
- 429 Too Many Requests response if exceeded.

Related: `/docs/developers/webhooks`
