---
title: "Using AI Demand Forecasting"
slug: "/inventory/ai-forecast"
category: "Inventory"
tags: ["ai","forecasting","stock","smart"]
summary: "How to use AI insights to predict stockouts and optimize purchasing."
difficulty: "Advanced"
last_updated: "2025-11-24"
estimated_time: "5 min"
---

# Using AI Demand Forecasting

**Antigravity** is our intelligent forecasting engine that suggests optimal reorder quantities, highlights seasonal demand, and predicts stockouts.

Quick Steps
1. Inventory → Forecast.
2. Review `Predicted Stockout` list.
3. Click an item → Create PO with suggested qty.

---

## How forecast works (non-technical)
- Uses historical sales (last 12–24 months), promotions, local seasonality signals, and lead times.
- Adjusts for special events (holidays) if you tag date ranges in the Promotions calendar.
- Provides confidence bands (Low/Medium/High confidence) for each suggestion.

---

## Interpreting forecast signals
- **Predicted Stockout (7d):** High priority — place PO now.
- **Overstock (90d):** Consider promotions or supplier return.
- **Seasonal surge:** System suggests % increase.

Best practice:
- Review `confidence` and adjust reorder point only if you have domain knowledge (e.g., supplier delay).

Related: `/docs/suppliers/create-po`, `/docs/inventory/products-full-guide`
