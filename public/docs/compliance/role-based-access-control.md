---
title: "Role-Based Access Control (RBAC)"
slug: "/compliance/role-based-access-control"
category: "Compliance"
tags: ["rbac","permissions","security","roles"]
summary: "Detailed breakdown of what each role can and cannot do."
difficulty: "Advanced"
last_updated: "2025-11-25"
estimated_time: "5 min"
---

# Role-Based Access Control (RBAC)

**Principle of Least Privilege:**
- Users should only have access to what they need to do their job.

**Matrix:**
| Feature | Admin | Manager | Pharmacist | Cashier |
| :--- | :---: | :---: | :---: | :---: |
| Sell | ✅ | ✅ | ✅ | ✅ |
| Refund | ✅ | ✅ | ❌ | ❌ |
| View Cost Price | ✅ | ✅ | ❌ | ❌ |
| Edit Inventory | ✅ | ✅ | ✅ | ❌ |
| Delete Logs | ❌ | ❌ | ❌ | ❌ |

Related: `/docs/settings/users-roles`
