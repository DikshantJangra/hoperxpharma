# Efficient PO Composer v2 (Beta)

## Access

The new efficient PO composer is available at:
- **URL:** `/orders/new-po-v2`
- **Status:** Beta testing

The original PO creation page remains at:
- **URL:** `/orders/new-po`
- **Status:** Production (unchanged)

## What's Different in v2?

### Layout
- **3-Zone Design:** Left (PO details), Center (Line items), Right (Suggestions)
- **Single Screen:** No modals or multiple pages
- **Compact:** All actions visible at once

### Features

#### Phase 1 (Complete)
- ✅ **Keyboard Shortcuts:**
  - `Ctrl+S` - Save Draft
  - `Ctrl+Enter` - Send Order
  - `Ctrl+Shift+Enter` - Request Approval
  - `/` - Focus Search
  - `Alt+Q` - Quick Add from Suggestions
  - `Esc` - Cancel

- ✅ **Local-First:**
  - Instant calculations (~10ms)
  - Auto-save to localStorage
  - Server sync every 5s
  - Draft restoration on reload

- ✅ **Inline Validation:**
  - Real-time error checking
  - Per-line validation indicators
  - Global validation summary

- ✅ **Bulk Operations:**
  - CSV paste for bulk-add
  - Preview before adding
  - Error reporting

- ✅ **Smart Suggestions:**
  - Urgency-based grouping (critical/recommended/optional)
  - One-click quick-add
  - Stock level display

#### Phase 2 (Complete)
- ✅ **Templates System:**
  - `Ctrl+T` - Save as Template
  - `Ctrl+L` - Load Template
  - Template management (duplicate, delete)
  - Usage tracking

### Backend APIs

New endpoints available:
- `POST /purchase-orders/calc` - Lightweight calculation
- `POST /purchase-orders/bulk-add` - Bulk item enrichment
- `PUT /purchase-orders/:id/autosave` - Optimistic autosave
- `GET /purchase-orders/templates` - List templates
- `POST /purchase-orders/templates` - Create template
- `POST /purchase-orders/templates/:id/load` - Load template

## Testing

### To Test v2:
1. Navigate to `/orders/new-po-v2`
2. Look for the blue "BETA" badge in top-right
3. Try keyboard shortcuts
4. Test template save/load
5. Compare with original at `/orders/new-po`

### Feedback
Please report:
- UI/UX issues
- Performance problems
- Missing features
- Bugs or errors

## Migration Plan

Once v2 is stable:
1. Gather user feedback
2. Fix any issues
3. A/B test with select users
4. Gradual rollout
5. Eventually replace v1

## Rollback

If needed, v1 remains at `/orders/new-po` and can be used at any time.
