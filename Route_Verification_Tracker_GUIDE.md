# Route Verification Tracker - Quick Start Guide

## 📍 File Location
**[Route_Verification_Tracker.csv](file:///Users/dikshantjangra/Desktop/hoperxpharma/Route_Verification_Tracker.csv)**

---

## 📊 What You Got

A **simple CSV file** with **173 routes** from your pharmacy management system, ordered by user workflow.

---

## 📋 Column Structure

| Column | Purpose | How to Use |
|--------|---------|------------|
| **Route/Path** | URL path | e.g., `/login`, `/dashboard/overview` |
| **Feature Category** | Functional area | Auth, Dashboard, POS, Inventory, etc. |
| **Description** | What the page does | Auto-generated breadcrumb style |
| **Dev Verified** | Developer sign-off | Use: `✓` (working), `-` (in progress), empty (not tested) |
| **Tester Verified** | QA sign-off | Use: `✓` (working), `-` (in progress), empty (not tested) |
| **Status** | Current state | e.g., "Live", "Beta", "Broken", "Not Built" |
| **Bugs** | Known issues | List bug IDs or descriptions |
| **Future Updates** | Planned work | What's coming next |
| **Notes** | Additional context | Anything important |

---

## ✅ Status Indicators

Use these simple symbols:

- **✓** = Working perfectly, verified
- **-** = In progress, partially working
- **Empty** = Not tested yet / not started

---

## 🔄 Route Flow Order

Routes are ordered by **how users navigate your app**:

1. **Auth** → `/login`, `/signup`, `/verify-magic-link`
2. **Dashboard** → `/dashboard`, `/dashboard/overview`
3. **POS** → `/pos`
4. **Inventory** → `/inventory/stock`, `/inventory/batches`, `/inventory/expiry`
5. **Purchasing** → `/purchasing/orders`, `/purchasing/new`
6. **Dispensing** → `/dispense/queue`, `/dispense/fill`, `/dispense/verify`
7. **Patients** → `/patients`, `/patients/list`
8. **Sales & Finance** → `/sales`, `/finance`
9. **GST** → `/gst/dashboard`, `/gst/invoices`
10. **Insights** → `/insights/analytics`
11. **Reports** → `/reports`
12. **Settings** → `/settings/account`, `/settings/team`
13. **Admin** → `/staff`, `/suppliers`
14. **Help** → `/help/docs`, `/help/chat`

---

## 🚀 How to Use

### 1. Open the CSV
```bash
open Route_Verification_Tracker.csv
```
Or open in Excel, Google Sheets, or any spreadsheet app

### 2. Start Testing
Go through each route in order and:
- Test the functionality
- Mark **Dev Verified** with `✓` or `-`
- Have QA test and mark **Tester Verified**
- Fill in **Status** (e.g., "Live", "Broken")
- Document any **Bugs** found
- Note **Future Updates** planned

### 3. Track Progress
- Filter by empty **Dev Verified** to see what needs testing
- Filter by **Feature Category** to focus on one module
- Sort by **Status** to prioritize broken routes

---

## 📝 Example Usage

```csv
Route/Path,Feature Category,Description,Dev Verified,Tester Verified,Status,Bugs,Future Updates,Notes
/login,Auth,Login,✓,✓,Live,,"Add magic link expiry notice",Works on all browsers
/dashboard/overview,Dashboard,Dashboard > Overview,✓,-,Beta,BUG-089: Safari chart rendering,Add revenue trends widget,Charts glitch on Safari
/inventory/batches,Inventory,Inventory > Batches,-,,In Progress,,"QR code scanner integration",Still building barcode linking
/patients/list,Patients,Patients > List,,,Not Built,,"Waiting for patient module",Planned for v2.0
```

---

## 🎯 Best Practices

### ✅ DO
- Test routes in the order they appear (follows user journey)
- Update both Dev and Tester columns (dual verification)
- Document bugs clearly with IDs or descriptions
- Keep Notes concise but informative
- Update Status to reflect current state

### ❌ DON'T
- Skip routes (test everything)
- Mark as verified without actually testing
- Leave bugs undocumented
- Delete routes (mark as deprecated instead)

---

## 🔧 Regenerating the CSV

If you add new routes to your app, regenerate the CSV:

```bash
cd /Users/dikshantjangra/Desktop/hoperxpharma
python3 scripts/generate_route_tracker.py
```

**Warning**: This will overwrite your current CSV. Save a backup first if you've added data!

---

## 📊 Quick Stats

- **Total Routes**: 173
- **Feature Categories**: 15+
- **Ordered by**: User workflow

---

## 💡 Tips

1. **Filter by Category**: Focus testing on one module at a time
2. **Search for Empty**: Find untested routes quickly
3. **Color Code**: Use spreadsheet colors for visual status (optional)
4. **Version Control**: Save dated copies (e.g., `Route_Tracker_2026-01-14.csv`)
5. **Team Collaboration**: Share via Google Sheets for real-time updates

---

## 🆘 Support

- **Questions?** Check the route in your browser: `http://localhost:3000/[route-path]`
- **Route not working?** Document in Bugs column
- **Need to add route?** Create the page.tsx file, then regenerate CSV

---

**Simple. Trackable. Complete.**
