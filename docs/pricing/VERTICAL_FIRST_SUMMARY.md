# Vertical-First Pricing — Quick Reference

## What Changed

**From:** Plan-based pricing (Free, Pro, Enterprise)  
**To:** Vertical-based pricing (Retail, Wholesale, Hospital, Multichain)

---

## Pricing at a Glance

| Vertical | Standalone | Combined | Use Case |
|----------|------------|----------|----------|
| 🏪 **Retail** | ₹799/mo | ₹699/mo | Independent pharmacies |
| 📦 **Wholesale** | ₹1,699/mo | ₹1,299/mo | Distributors, C&F agents |
| 🏥 **Hospital** | ₹2,999/mo | ₹2,399/mo | Hospital pharmacies |
| 🏢 **Multichain** | ₹3,999/mo + ₹299/store | — | Pharmacy chains |

---

## Top Combos

1. **Retail + Wholesale** → ₹1,899/mo (save ₹599)
2. **Retail + Hospital** → ₹2,699/mo (save ₹1,099)
3. **Complete Suite** → ₹3,999/mo (save ₹1,498)

---

## Files Modified

- ✅ `lib/constants/pricing-constants.ts` — Vertical-first config
- ✅ `components/pricing/VerticalCard.tsx` — NEW component
- ✅ `components/landing/Pricing.tsx` — Homepage redesign
- ✅ `components/store/profile/PlanAndBilling.tsx` — In-app billing

---

## Test URLs

- **Homepage:** http://localhost:3000/#pricing
- **In-App:** http://localhost:3000/profile (Plan & Billing tab)

---

## Key Copy Changes

| ❌ Removed | ✅ Added |
|-----------|---------|
| "Upgrade your plan" | "Add another business module" |
| "You need Retail first" | "Works standalone or combined" |
| "Add-on modules" | "Available business modules" |
| "Retail-first" | "Choose how you operate" |

---

## Next Steps

1. ✅ Implementation complete
2. 🔍 Manual visual testing (browser automation unavailable)
3. 📝 User feedback on messaging
4. 🚀 When ready: Backend multi-subscription implementation
