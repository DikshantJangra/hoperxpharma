---
title: "SDK Examples (Node/Python)"
slug: "/developers/sdk-examples"
category: "Developers"
tags: ["sdk","code","examples"]
summary: "Code snippets for common tasks in Node.js and Python."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# SDK Examples

## Node.js
```javascript
const hoperx = require('hoperx-node')('API_KEY');

// Get products
const products = await hoperx.products.list({ limit: 10 });
console.log(products);
```

## Python
```python
import hoperx
client = hoperx.Client('API_KEY')

# Create customer
customer = client.customers.create(
    name="John Doe",
    phone="+919876543210"
)
```

Related: `/docs/developers/api-overview`
