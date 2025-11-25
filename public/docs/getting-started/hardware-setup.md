---
title: "Hardware Setup & Recommended Devices"
slug: "/getting-started/hardware-setup"
category: "Getting Started"
tags: ["hardware", "printers", "scanners", "requirements"]
summary: "How to choose and configure barcode scanners, printers, and other peripherals."
difficulty: "Beginner"
last_updated: "2025-11-24"
estimated_time: "8 min"
---

# Hardware Setup & Recommended Devices

Quick Steps
1. Connect USB scanner → Settings → Hardware → Test input.
2. Add printer by selecting model or entering IP.
3. Configure POS tablet settings (if using Android tablet).

---

## Which hardware to buy (recommended)
- Barcode Scanner: Honeywell Xenon 1900 (USB, keyboard mode) — robust for high-volume scanning.
- Thermal Printer: Epson TM-T88V or equivalent — reliable for receipts.
- Cash Drawer: Any standard till, connect via Epson printer kick connector.
- POS Tablet: Android 10+ or iPad (iOS 14+). For tablets use Bluetooth printers with vendor SDK.

---

## Configuring barcode scanner
1. Plug scanner into USB.
2. In **Settings → Hardware** click `Test Input`.
3. Scan barcode — the input box should show the barcode string.
4. If scanner appends carriage return incorrectly, toggle the `Enter after scan` option.

Troubleshooting:
- If nothing appears, try another USB port or test scanner on a plain text editor.
- For Bluetooth scanners, pair via OS settings then set scanner to HID mode.

---

## Configuring printers
1. Choose one:
   - USB (connect to server/computer)
   - Network (enter printer IP)
   - Bluetooth (tablet)
2. Set paper size (58mm or 80mm) and header/footer templates.
3. Enable `Open cash drawer` on payment complete.

Troubleshooting:
- Paper skew: calibrate printer or replace paper roll.
- Blank receipts: check thermal head and ensure correct paper type.

Related: `/docs/billing/pos-sale`, `/getting-started/initial-setup`
