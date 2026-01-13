# Salt Intelligence - Navigation Guide

## 🗺️ How to Access Everything

### Method 1: From Inventory Page (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│  Inventory Management                    [Add Medicine] │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────┐│
│  │ 📷 Scan Strip    │  │ ⚠️  Fix Pending  │  │ Batches││
│  │ Quick • Teal     │  │ Action Needed    │  │        ││
│  │ Upload for OCR   │  │ Review mappings  │  │ Manage ││
│  └──────────────────┘  └──────────────────┘  └────────┘│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Drug Name        │ Status    │ Action              │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Paracetamol 500  │ ✅ Active │                     │ │
│  │ Aspirin 75       │ ⚠️  Needs │ Fix Now →          │ │
│  │                  │   Review  │                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**5 Ways to Add Medicine**:
1. Click "Add Medicine" button (top-right)
2. Click "Scan Strip" card (large teal card)
3. Click "Fix Pending" card (for corrections)
4. Click "Fix Now" link in table
5. Use keyboard shortcut (if enabled)

### Method 2: From Inventory Page (Mobile)

```
┌─────────────────────────┐
│ Inventory Management    │
│ ─────────────────────── │
│                         │
│ ┌─────────────────────┐ │
│ │ 📷 Scan Strip       │ │
│ │ Quick • Teal        │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ⚠️  Fix Pending     │ │
│ │ Action Needed       │ │
│ └─────────────────────┘ │
│                         │
│ [Table...]              │
│                         │
│                    [+]  │ ← Floating Button
└─────────────────────────┘
```

**Mobile Access**:
- Tap floating + button (bottom-right)
- Tap "Scan Strip" card
- Tap "Fix Pending" card

### Method 3: Add Medicine Modal

```
┌─────────────────────────────────────┐
│  Add New Medicine              [×]  │
│  ─────────────────────────────────  │
│  Choose how you'd like to add...   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📷  Scan Medicine Strip       │ │
│  │     Upload strip image        │ │
│  │     ⚡ Fastest • Recommended  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✏️  Manual Entry              │ │
│  │     Enter details manually    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📤  Bulk Import               │ │
│  │     Import from CSV/Excel     │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Triggered By**:
- Clicking "Add Medicine" button
- Keyboard shortcut (optional)

### Method 4: Mobile FAB (Expanded)

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│  ┌───────────────────┐  │
│  │ 📷 Scan Strip     │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ ✏️  Manual Entry  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 📤 Bulk Import    │  │
│  └───────────────────┘  │
│                    [×]  │ ← Close
└─────────────────────────┘
```

**How to Use**:
1. Tap + button
2. Menu expands upward
3. Choose option
4. Tap backdrop to close

## 🎯 Complete User Journeys

### Journey 1: First-Time User Adding Medicine

```
START: User lands on /inventory
  ↓
SEES: Large teal "Scan Medicine Strip" card
  ↓
THINKS: "This looks like what I need"
  ↓
CLICKS: Card
  ↓
ARRIVES: /inventory/ingest
  ↓
SEES: Clear instructions + tips
  ↓
UPLOADS: Strip image
  ↓
WAITS: 2-5 seconds (OCR processing)
  ↓
REVIEWS: Extracted salts with confidence badges
  ↓
EDITS: If needed (autocomplete helps)
  ↓
CLICKS: "Confirm & Activate"
  ↓
SUCCESS: Medicine added, redirects to inventory
  ↓
END: Sees new medicine in table with ✅ Active badge
```

**Time**: ~2 minutes
**Clicks**: 3-4
**Confusion**: None

### Journey 2: Experienced User (Quick Add)

```
START: User lands on /inventory
  ↓
CLICKS: "Add Medicine" button (muscle memory)
  ↓
MODAL: Opens with 3 options
  ↓
CLICKS: "Scan Medicine Strip"
  ↓
UPLOADS: Image (knows the drill)
  ↓
REVIEWS: Quick glance at OCR results
  ↓
CLICKS: "Confirm & Activate"
  ↓
END: Done in 30 seconds
```

**Time**: ~30 seconds
**Clicks**: 3
**Efficiency**: High

### Journey 3: Mobile User in Store

```
START: User opens app on phone
  ↓
NAVIGATES: To /inventory
  ↓
SEES: Floating + button (bottom-right)
  ↓
TAPS: + button
  ↓
MENU: Expands with 3 options
  ↓
TAPS: "Scan Strip"
  ↓
CAMERA: Opens automatically
  ↓
CAPTURES: Photo of strip
  ↓
REVIEWS: OCR results
  ↓
TAPS: "Confirm & Activate"
  ↓
END: Medicine added while standing in store
```

**Time**: ~1 minute
**Taps**: 4
**Convenience**: Maximum

### Journey 4: Fixing Pending Medicines

```
START: User lands on /inventory
  ↓
SEES: Orange "Fix Pending Medicines" card
  ↓
NOTICES: "Action Needed" badge
  ↓
CLICKS: Card
  ↓
ARRIVES: /inventory/maintenance
  ↓
SEES: Filtered list of SALT_PENDING medicines
  ↓
SEES: Orange-highlighted rows
  ↓
CLICKS: "Edit" on a medicine
  ↓
EDITS: Composition with autocomplete
  ↓
CLICKS: "Save Changes"
  ↓
SUCCESS: Audit log created
  ↓
END: Medicine now shows ✅ Active
```

**Time**: ~1 minute per medicine
**Clicks**: 3-4
**Clarity**: High

### Journey 5: From Table (Quick Fix)

```
START: User browsing inventory table
  ↓
SEES: Orange-highlighted row
  ↓
READS: "⚠️ Needs Review" badge
  ↓
CLICKS: "Fix Now →" link
  ↓
ARRIVES: /inventory/maintenance (filtered)
  ↓
EDITS: Composition
  ↓
SAVES: Changes
  ↓
END: Returns to inventory, sees ✅ Active
```

**Time**: ~30 seconds
**Clicks**: 2
**Directness**: Maximum

## 📱 Device-Specific Navigation

### Desktop (≥768px)

**Primary Entry Points**:
1. "Add Medicine" button (top-right)
2. Quick action cards (3 large cards)
3. Table "Fix Now" links

**Layout**:
- Full-width cards
- Modal for options
- All columns visible in table

### Tablet (768px - 1024px)

**Primary Entry Points**:
1. "Add Medicine" button
2. Quick action cards (may stack)
3. Table links

**Layout**:
- Cards may stack 2-1
- Modal still used
- Table scrolls horizontally if needed

### Mobile (<768px)

**Primary Entry Points**:
1. Floating Action Button (FAB)
2. Quick action cards (stacked)
3. "Add Medicine" button (if space)

**Layout**:
- Cards stack vertically
- FAB always visible
- Simplified table view

## 🎨 Visual Indicators

### Color Coding

**Teal/Green** = Primary Actions
- Scan Medicine Strip
- Add Medicine button
- Active status

**Orange** = Attention Needed
- SALT_PENDING medicines
- Fix Pending card
- "Needs Review" badges

**Gray** = Secondary Actions
- Manual entry
- Standard operations

**Red** = Critical
- Low stock alerts
- Expiring items

### Badges

**"⚡ Fastest • Recommended"**
- Appears on Scan Strip option
- Guides users to best method

**"Action Needed"**
- Appears on Fix Pending card
- Creates urgency

**"Quick"**
- Appears on Scan Strip card
- Emphasizes speed

**"⚠️ Needs Review"**
- Appears on SALT_PENDING medicines
- Clear call to action

## 🔍 Finding Features

### "How do I add a medicine?"
**Answer**: 5 ways!
1. Click "Add Medicine" button (top-right)
2. Click teal "Scan Strip" card
3. Tap floating + button (mobile)
4. Use keyboard shortcut
5. Navigate to /inventory/ingest

### "How do I fix unmapped medicines?"
**Answer**: 3 ways!
1. Click orange "Fix Pending" card
2. Click "Fix Now" link in table
3. Navigate to /inventory/maintenance

### "How do I scan a strip?"
**Answer**: Direct access!
1. Click "Scan Strip" card (most prominent)
2. Or: Add Medicine → Scan Strip
3. Or: FAB → Scan Strip (mobile)

### "Where are pending medicines?"
**Answer**: Highlighted!
- Orange background in table
- "Needs Review" badge
- "Fix Now" link
- Filter in maintenance page

## ✅ Navigation Checklist

### For New Users
- [ ] Can find "Add Medicine" in <5 seconds
- [ ] Understands 3 options in modal
- [ ] Sees clear instructions on ingest page
- [ ] Knows what to do with OCR results
- [ ] Can complete first medicine in <2 minutes

### For Returning Users
- [ ] Can add medicine in <30 seconds
- [ ] Remembers button location
- [ ] Uses quick action cards
- [ ] Efficient with keyboard shortcuts

### For Mobile Users
- [ ] Finds FAB immediately
- [ ] Can expand menu easily
- [ ] Camera opens automatically
- [ ] Can complete on-the-go

### For Fixing Issues
- [ ] Sees pending medicines clearly
- [ ] Understands what "Needs Review" means
- [ ] Can navigate to fix page
- [ ] Knows how to edit and save

## 🎯 Success Metrics

**Discoverability**: ⭐⭐⭐⭐⭐
- 5+ entry points
- Clear visual hierarchy
- No hidden features

**Efficiency**: ⭐⭐⭐⭐⭐
- 2 clicks to start
- 30 seconds for experienced users
- Direct links from table

**Clarity**: ⭐⭐⭐⭐⭐
- Clear option descriptions
- Visual indicators
- Helpful tips

**Mobile Experience**: ⭐⭐⭐⭐⭐
- Floating Action Button
- Touch-optimized
- Camera integration

## 🚀 Quick Reference

| Task | Desktop | Mobile |
|------|---------|--------|
| Add Medicine | Button or Card | FAB or Card |
| Scan Strip | Teal Card | FAB → Scan |
| Fix Pending | Orange Card | Orange Card |
| Quick Fix | Table Link | Table Link |
| Bulk Import | Modal → Import | FAB → Import |

---

**Everything is now discoverable and intuitive!** 🎉
