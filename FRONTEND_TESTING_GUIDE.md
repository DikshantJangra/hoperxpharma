# Frontend Integration Testing Guide

## Quick Start

### Step 1: Test Legacy Mode (Verify No Regression)

```bash
# Ensure legacy mode works
echo "NEXT_PUBLIC_USE_MEDICINE_API=false" > .env.local

# Start the app
npm run dev

# Test search functionality
# - Open medicine search
# - Search for "paracetamol"
# - Verify results appear
# - Check autocomplete works
```

### Step 2: Enable New API

```bash
# Update .env.local
cat > .env.local << EOF
NEXT_PUBLIC_USE_MEDICINE_API=true
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
EOF

# Restart the app
npm run dev
```

### Step 3: Test New API Mode

```bash
# Open browser console
# Look for: "🚀 Using Medicine Master API for search"
# Look for: "✅ Connected to medicine API (X medicines)"

# Test search functionality
# - Search for "paracetamol"
# - Verify results appear
# - Compare with legacy results
# - Check performance
```

---

## Detailed Testing Checklist

### 1. Environment Setup

- [ ] `.env.local` file created
- [ ] `NEXT_PUBLIC_USE_MEDICINE_API` variable set
- [ ] `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] Backend server is running
- [ ] Frontend dev server is running

### 2. Legacy Mode Testing (Baseline)

**Set**: `NEXT_PUBLIC_USE_MEDICINE_API=false`

- [ ] App starts without errors
- [ ] Medicine search loads
- [ ] Search returns results
- [ ] Autocomplete works
- [ ] Medicine details load
- [ ] Recent medicines tracked
- [ ] No console errors

**Record baseline metrics**:
- Initial load time: _____ seconds
- Search response time: _____ ms
- Autocomplete response time: _____ ms
- Total medicine count: _____

### 3. New API Mode Testing

**Set**: `NEXT_PUBLIC_USE_MEDICINE_API=true`

#### Console Messages
- [ ] See "🚀 Using Medicine Master API for search"
- [ ] See "✅ Connected to medicine API (X medicines)"
- [ ] No error messages in console

#### Search Functionality
- [ ] Basic search works
  - Search: "paracetamol"
  - Expected: Results appear
  - Actual: _____

- [ ] Fuzzy search works
  - Search: "paracetmol" (typo)
  - Expected: Results for "paracetamol"
  - Actual: _____

- [ ] Autocomplete works
  - Type: "para"
  - Expected: Suggestions appear
  - Actual: _____

- [ ] Search by composition
  - Search: "paracetamol 500mg"
  - Expected: Medicines with that composition
  - Actual: _____

- [ ] Search by manufacturer
  - Search: "cipla"
  - Expected: Cipla medicines
  - Actual: _____

#### Medicine Details
- [ ] Get medicine by ID works
  - Click on a medicine
  - Expected: Details load
  - Actual: _____

- [ ] Medicine data is complete
  - Name: _____
  - Price: _____
  - Manufacturer: _____
  - Composition: _____
  - Pack size: _____

#### Filtering
- [ ] Discontinued medicines filtered
  - Search with includeDiscontinued=false
  - Expected: No discontinued medicines
  - Actual: _____

- [ ] Limit works
  - Search with limit=5
  - Expected: Max 5 results
  - Actual: _____

### 4. Performance Comparison

| Metric | Legacy | New API | Difference |
|--------|--------|---------|------------|
| Initial load | ___s | ___s | ___s |
| Search response | ___ms | ___ms | ___ms |
| Autocomplete | ___ms | ___ms | ___ms |
| Memory usage | ___MB | ___MB | ___MB |

### 5. Error Handling

- [ ] Backend offline
  - Stop backend server
  - Try to search
  - Expected: Error message, no crash
  - Actual: _____

- [ ] Network error
  - Disconnect network
  - Try to search
  - Expected: Error message, no crash
  - Actual: _____

- [ ] Invalid search
  - Search: "" (empty)
  - Expected: No results, no error
  - Actual: _____

### 6. Edge Cases

- [ ] Very long search query
  - Search: "paracetamol 500mg tablet 10 tablets strip of 10 tablets each"
  - Expected: Results or graceful handling
  - Actual: _____

- [ ] Special characters
  - Search: "paracetamol & aspirin"
  - Expected: Results or graceful handling
  - Actual: _____

- [ ] Unicode characters
  - Search: "पैरासिटामोल" (if applicable)
  - Expected: Results or graceful handling
  - Actual: _____

### 7. User Experience

- [ ] Search feels responsive
- [ ] No noticeable lag
- [ ] Results appear quickly
- [ ] Autocomplete is smooth
- [ ] No UI freezing
- [ ] Loading states work

### 8. Data Accuracy

Compare 10 random medicines between legacy and new API:

| Medicine Name | Legacy ID | New API ID | Match? |
|---------------|-----------|------------|--------|
| 1. _____ | _____ | _____ | [ ] |
| 2. _____ | _____ | _____ | [ ] |
| 3. _____ | _____ | _____ | [ ] |
| 4. _____ | _____ | _____ | [ ] |
| 5. _____ | _____ | _____ | [ ] |
| 6. _____ | _____ | _____ | [ ] |
| 7. _____ | _____ | _____ | [ ] |
| 8. _____ | _____ | _____ | [ ] |
| 9. _____ | _____ | _____ | [ ] |
| 10. _____ | _____ | _____ | [ ] |

---

## Automated Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Expected: All tests pass
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Expected: All tests pass
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Expected: All tests pass
```

---

## Rollback Procedure

If issues are found:

1. **Immediate Rollback**
   ```bash
   # Set to legacy mode
   echo "NEXT_PUBLIC_USE_MEDICINE_API=false" > .env.local
   
   # Restart app
   npm run dev
   ```

2. **Verify Rollback**
   - [ ] App works in legacy mode
   - [ ] No data loss
   - [ ] Users can continue working

3. **Document Issues**
   - What went wrong: _____
   - Steps to reproduce: _____
   - Error messages: _____
   - Screenshots: _____

---

## Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Initial load | <2s | <5s | >5s |
| Search response | <500ms | <1s | >1s |
| Autocomplete | <300ms | <500ms | >500ms |
| Memory usage | <50MB | <100MB | >100MB |

### Load Testing

```bash
# Test with 100 concurrent searches
# Expected: All complete within 2 seconds
```

---

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Production Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Rollback plan tested
- [ ] Documentation updated
- [ ] Team trained on new system
- [ ] Monitoring configured
- [ ] Backup plan ready

---

## Monitoring

After deployment, monitor:

- [ ] Search success rate
- [ ] Average response time
- [ ] Error rate
- [ ] User feedback
- [ ] API health
- [ ] Database performance

---

## Success Criteria

✅ All functional tests pass  
✅ Performance is equal or better than legacy  
✅ No critical bugs found  
✅ Error handling works correctly  
✅ Rollback plan tested and works  
✅ Team approves for production  

---

## Notes

Use this space to document any issues, observations, or recommendations:

```
Date: _____
Tester: _____

Observations:
- 
- 
- 

Issues Found:
- 
- 
- 

Recommendations:
- 
- 
- 
```

---

**Testing Status**: ⏳ Pending  
**Tested By**: _____  
**Date**: _____  
**Result**: ⬜ Pass / ⬜ Fail  
**Ready for Production**: ⬜ Yes / ⬜ No
