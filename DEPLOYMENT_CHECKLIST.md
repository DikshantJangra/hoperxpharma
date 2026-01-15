# Medicine Master Deployment Checklist

## Phase 1: Typesense Deployment (30 minutes)

### Pre-Deployment
- [ ] Confirm `Dockerfile.typesense` exists in repository
- [ ] Commit and push any pending changes
- [ ] Have Render dashboard open
- [ ] Have terminal ready for generating API key

### Create Typesense Service
- [ ] Go to https://dashboard.render.com
- [ ] Click "New +" → "Web Service"
- [ ] Select your repository
- [ ] Configure service:
  - [ ] Name: `hoperx-typesense`
  - [ ] Environment: `Docker`
  - [ ] Dockerfile Path: `./Dockerfile.typesense`
  - [ ] Docker Command: `--data-dir /data --api-key $TYPESENSE_API_KEY --enable-cors`
  - [ ] Plan: `Free`
- [ ] Generate API key: `openssl rand -base64 32`
- [ ] Add environment variable:
  - [ ] Key: `TYPESENSE_API_KEY`
  - [ ] Value: (paste generated key)
  - [ ] **SAVE THIS KEY SOMEWHERE SAFE!**
- [ ] Add disk:
  - [ ] Name: `typesense-data`
  - [ ] Mount Path: `/data`
  - [ ] Size: `1 GB`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (2-3 minutes)
- [ ] Copy service URL (e.g., `https://hoperx-typesense.onrender.com`)

### Test Typesense
- [ ] Test health: `curl https://hoperx-typesense.onrender.com/health`
- [ ] Should return: `{"ok":true}`
- [ ] If error, wait 30 seconds and retry (cold start)

### Update Backend
- [ ] Go to backend service in Render
- [ ] Click "Environment" tab
- [ ] Add these variables:
  - [ ] `TYPESENSE_HOST` = `hoperx-typesense.onrender.com`
  - [ ] `TYPESENSE_PORT` = `443`
  - [ ] `TYPESENSE_PROTOCOL` = `https`
  - [ ] `TYPESENSE_API_KEY` = (paste same key from above)
  - [ ] `TYPESENSE_COLLECTION_NAME` = `medicines`
- [ ] Click "Save Changes"
- [ ] Wait for backend to redeploy (2-3 minutes)

### Initialize Search Index
- [ ] Go to backend service in Render
- [ ] Click "Shell" tab
- [ ] Run: `npm run medicine:init-search`
- [ ] Wait for success message
- [ ] Run: `npm run medicine:rebuild-index`
- [ ] Wait 8-10 minutes for indexing
- [ ] Should see: "✅ Successfully indexed: 253973"

### Verify Search Works
- [ ] Test stats endpoint: `curl https://your-backend.onrender.com/api/v1/medicines/stats`
- [ ] Should return collection stats (not 500 error)
- [ ] Open frontend and try searching for "paracetamol"
- [ ] Search should return results
- [ ] Autocomplete should work

### Phase 1 Complete! ✅
- [ ] No more 500 errors on search endpoints
- [ ] Medicine search works in frontend
- [ ] 253,973 medicines are searchable

---

## Phase 2: Inventory System Update (6-7 hours)

### Planning
- [ ] Review current inventory code
- [ ] Understand Medicine Master schema
- [ ] Plan migration strategy
- [ ] Create backup of database (just in case)

### Schema Changes
- [ ] Update `backend/prisma/schema.prisma`
- [ ] Add `medicineId` field to `InventoryBatch`
- [ ] Keep `drugId` field temporarily
- [ ] Add optional constraint
- [ ] Run `npx prisma db push`

### Migration Script
- [ ] Create `backend/scripts/migrate-inventory-to-medicine-master.js`
- [ ] Match existing Drug records to Medicine Master
- [ ] Link InventoryBatch to Medicine Master
- [ ] Test on small dataset first
- [ ] Run full migration
- [ ] Verify data integrity

### Backend Updates
- [ ] Update `backend/src/repositories/inventoryRepository.js`
  - [ ] Update `findDrugs()` to query Medicine Master
  - [ ] Update `searchDrugsWithStock()` to use Medicine Master
  - [ ] Update batch queries
- [ ] Update `backend/src/services/inventory/inventoryService.js`
  - [ ] Update business logic
  - [ ] Handle Medicine Master lookups
- [ ] Update `backend/src/controllers/inventory/inventoryController.js`
  - [ ] Update response formatting
  - [ ] Include Medicine Master fields

### Frontend Updates
- [ ] Update `app/(main)/inventory/page.tsx`
  - [ ] Display Medicine Master fields
  - [ ] Update table columns
  - [ ] Handle new data structure
- [ ] Update `lib/api/inventory.ts` if needed
- [ ] Test UI displays correctly

### Testing
- [ ] Test inventory list loads
- [ ] Test search in inventory
- [ ] Test creating new batch
- [ ] Test updating batch
- [ ] Test deleting batch
- [ ] Test low stock alerts
- [ ] Test expiring items
- [ ] Test GRN with Medicine Master
- [ ] Test POS with Medicine Master

### Deployment
- [ ] Commit changes to feature branch
- [ ] Push to GitHub
- [ ] Test locally first
- [ ] Deploy to production
- [ ] Monitor logs closely
- [ ] Test in production
- [ ] Monitor for errors

### Phase 2 Complete! ✅
- [ ] Inventory uses Medicine Master
- [ ] All 253K medicines available
- [ ] No duplicate data entry needed
- [ ] GRN creates batches linked to Medicine Master
- [ ] POS searches universal catalog

---

## Phase 3: Monitoring & Optimization (Ongoing)

### Performance Monitoring
- [ ] Monitor Typesense response times
- [ ] Monitor cold start frequency
- [ ] Monitor search query performance
- [ ] Monitor inventory query performance

### Error Monitoring
- [ ] Check Render logs daily
- [ ] Monitor frontend console errors
- [ ] Track failed searches
- [ ] Track inventory errors

### User Feedback
- [ ] Gather feedback on search accuracy
- [ ] Gather feedback on inventory usability
- [ ] Track common search queries
- [ ] Identify missing medicines

### Optimization
- [ ] Optimize slow queries
- [ ] Add indexes if needed
- [ ] Consider caching strategies
- [ ] Consider upgrading to paid tier

### Paid Tier Upgrade (When Ready)
- [ ] Evaluate traffic patterns
- [ ] Calculate ROI of paid tier
- [ ] Upgrade Typesense to Starter ($7/month)
- [ ] Upgrade Backend to Starter ($7/month)
- [ ] Monitor improved performance

---

## Rollback Plan (If Needed)

### If Typesense Fails
- [ ] Delete Typesense service
- [ ] Remove Typesense env vars from backend
- [ ] Redeploy backend
- [ ] Frontend will show "search unavailable"

### If Inventory Update Fails
- [ ] Revert code changes
- [ ] Redeploy previous version
- [ ] Old Drug table still intact
- [ ] System continues working

### If Database Issues
- [ ] Restore from backup
- [ ] Revert schema changes
- [ ] Redeploy previous version

---

## Success Criteria

### Typesense Deployment Success
- ✅ Service running on Render
- ✅ Health endpoint returns OK
- ✅ 253,973 medicines indexed
- ✅ Search API returns results
- ✅ No 500 errors

### Inventory Update Success
- ✅ Inventory displays Medicine Master data
- ✅ Can create/update/delete batches
- ✅ GRN works with Medicine Master
- ✅ POS works with Medicine Master
- ✅ No data loss
- ✅ No breaking changes

### Overall Success
- ✅ End-to-end medicine flow works
- ✅ No duplicate data entry needed
- ✅ Search is fast and accurate
- ✅ Users can find medicines easily
- ✅ System is stable and reliable

---

## Notes & Reminders

### Important URLs
- Render Dashboard: https://dashboard.render.com
- Typesense Service: `https://hoperx-typesense.onrender.com`
- Backend Service: `https://your-backend.onrender.com`
- Frontend: `https://your-frontend.vercel.app`

### Important Commands
```bash
# Generate API key
openssl rand -base64 32

# Test Typesense health
curl https://hoperx-typesense.onrender.com/health

# Initialize search collection
npm run medicine:init-search

# Rebuild search index
npm run medicine:rebuild-index

# Test search API
curl "https://your-backend.onrender.com/api/v1/medicines/stats"
```

### Important Files
- `TYPESENSE_QUICK_START.md` - Quick deployment guide
- `TYPESENSE_RENDER_DEPLOYMENT.md` - Detailed guide
- `NEXT_STEPS_SUMMARY.md` - Full overview
- `MEDICINE_MASTER_INTEGRATION_STATUS.md` - Status tracking

### Support
- Check Render logs for errors
- Check frontend console for errors
- Review troubleshooting sections in guides
- Test health endpoints directly

---

## Timeline

### Day 1 (Today)
- [ ] Deploy Typesense (30 min)
- [ ] Verify search works (10 min)
- [ ] **Milestone**: Search functionality restored

### Day 2-3 (This Week)
- [ ] Plan inventory migration (1 hour)
- [ ] Implement schema changes (1 hour)
- [ ] Write migration script (2 hours)
- [ ] Update backend code (2 hours)
- [ ] Update frontend code (1 hour)
- [ ] **Milestone**: Code ready for testing

### Day 4 (This Week)
- [ ] Test locally (2 hours)
- [ ] Deploy to production (30 min)
- [ ] Monitor and fix issues (1 hour)
- [ ] **Milestone**: Full integration complete

### Ongoing
- [ ] Monitor performance
- [ ] Gather feedback
- [ ] Optimize as needed
- [ ] Consider paid tier upgrade

---

## Current Status

**Phase 1**: ⏳ Not Started
**Phase 2**: ⏳ Not Started
**Phase 3**: ⏳ Not Started

**Overall Progress**: 0% → Target: 100%

**Next Action**: Deploy Typesense (Phase 1)

---

## Let's Go! 🚀

Start with Phase 1 - it's only 30 minutes and will fix all your search errors!

Open `TYPESENSE_QUICK_START.md` and follow the steps.
