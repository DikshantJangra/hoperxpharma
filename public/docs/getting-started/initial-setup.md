---
title: "System Setup & First Login"
slug: "/getting-started/initial-setup"
category: "Getting Started"
tags: ["setup", "onboarding", "admin"]
summary: "Complete guide to setting up your pharmacy profile, licenses, and hardware."
difficulty: "Beginner"
last_updated: "2025-11-24"
estimated_time: "10 min"
---

# System Setup & First Login

**Goal:** Set up your store, user roles, and hardware so staff can start selling.

Quick Steps (for in-app /help/docs)
1. Go to **Settings → Store → Profile** and fill store details.
2. Upload licenses at **Settings → Store → Licenses**.
3. Attach a thermal printer and barcode scanner under **Settings → Hardware**.
4. Invite users under **Settings → Users** and assign roles.

---

## 1. Create your store profile
1. Navigate to **Settings → Store → Profile** (`/store/profile`).
2. Fill fields:
   - `Pharmacy Name` (appears on receipts)
   - `Legal Name` (for invoices)
   - `Address` (line 1/2, city, state, postal)
   - `Phone` and `Email`
   - Time zone and currency
3. Click **Save**.

> Tip: Use the legal name exactly as on your GSTIN / Drug License to avoid invoicing mismatches.

<!-- screenshot: /images/getting-started/store-profile.png -->

---

## 2. Upload licenses and regulatory data
1. **Settings → Store → Licenses**.
2. Click **+ Add License**.
   - Type: Drug License / GSTIN / NPI / DEA
   - Number
   - Issuing Authority
   - Issue & Expiry dates
   - Upload scanned copy (PDF/JPG)
3. Save. The system flags expired licenses and sends renewal reminders 30 days prior.

---

## 3. Hardware setup
1. **Settings → Store → Hardware**.
2. Barcode Scanner:
   - Plug USB scanner.
   - Click **Test Input** and scan a barcode — you should see digits appear.
3. Receipt Printer:
   - Select the printer model or configure a network printer via IP.
   - Print a test receipt.
4. Cash Drawer: Bind to printer if you use automatic cash drawer open.

Troubleshooting:
- If scanner types odd characters: check scanner symbology and set it to HID/Keyboard mode.
- If printer doesn't print: verify drivers or use network IP; ensure paper roll is loaded properly.

---

## 4. Create the first admin user
1. **Settings → Users → Invite User**.
2. Enter `Name`, `Email`, assign role `Owner` or `Admin`.
3. The invitee accepts via email and sets a password. Encourage enabling 2FA.

---

## 5. Next steps
- Add first product (Inventory → Add Product).
- Run a test sale (POS → New Sale).
- Upload sample prescription and test OCR (Operations → Prescriptions → New).

Related: `/docs/inventory/adding-stock`, `/docs/billing/pos-sale`, `/docs/operations/prescription-workflow`
