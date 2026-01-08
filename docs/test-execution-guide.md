# Playwright E2E Test Execution Guide

## Prerequisites

### System Requirements
- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL 15+ running locally
- Minimum 8GB RAM
- 10GB free disk space

### Environment Setup

1. **Clone repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd hoperxpharma
   npm install
   ```

2. **Set up environment variables:**
   Create `.env.local` in project root:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/hoperx_dev
   NEXT_PUBLIC_API_URL=http://localhost:5000
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   ```

3. **Set up database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

4. **Start development servers:**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

---

## Running Tests

### Full Test Suite
Run all tests across all browsers:
```bash
npx playwright test
```

### Specific Test File
Run a single test file:
```bash
npx playwright test tests/procurement.spec.ts
```

### Specific Test Case
Run a specific test by name:
```bash
npx playwright test -g "should complete a quick OTC sale"
```

### Single Browser
Run tests on a specific browser:
```bash
npx playwright test --project=chromium
```

### Headed Mode (Visible Browser)
Watch tests execute in real browser:
```bash
npx playwright test --headed --project=chromium
```

### Debug Mode
Run with Playwright Inspector for step-by-step debugging:
```bash
npx playwright test --debug
```

### UI Mode (Interactive)
Use Playwright's interactive UI mode:
```bash
npx playwright test --ui
```

---

## Test Execution Options

### Parallel Execution
Control number of parallel workers:
```bash
npx playwright test --workers=4
```

### Run Specific Projects
```bash
# Desktop only
npx playwright test --project=chromium --project=firefox --project=webkit

# Mobile only
npx playwright test --project=mobile-chrome --project=mobile-safari
```

### Retry Failed Tests
```bash
npx playwright test --retries=2
```

### Update Snapshots
If using visual regression tests:
```bash
npx playwright test --update-snapshots
```

---

## Viewing Reports

### HTML Report
After test run, open the report:
```bash
npx playwright show-report
```

The report includes:
- Test results summary
- Failed test details
- Screenshots on failure
- Video recordings
- Network logs
- Trace files

### JSON Report
Located at `playwright-report/results.json` for CI integration.

### Traces
View detailed trace for failed tests:
```bash
npx playwright show-trace trace.zip
```

---

## Filtering Tests

### By Tag/Annotation
```bash
npx playwright test --grep @smoke
```

### Exclude Tests
```bash
npx playwright test --grep-invert @slow
```

### By File Pattern
```bash
npx playwright test tests/pos*.spec.ts
```

---

## Test Data Management

### Cleanup
Tests automatically clean up data in `global-teardown.ts`.

### Manual Cleanup
If tests are interrupted:
```bash
npm run test:cleanup
```

### Reset Test Database
```bash
cd backend
npx prisma db push --force-reset
```

---

## Common Issues & Solutions

### Issue: "Backend health check failed"
**Solution:** Ensure backend server is running on port 5000.
```bash
cd backend && npm run dev
```

### Issue: "Authentication failed"
**Solution:** Delete auth state and re-run setup:
```bash
rm -rf playwright/.auth
npx playwright test --project=setup
```

### Issue: "Database connection error"
**Solution:** Check PostgreSQL is running and DATABASE_URL is correct.
```bash
pg_isready -h localhost -p 5432
```

### Issue: "Tests timing out"
**Solution:** Increase timeout in `playwright.config.ts`:
```typescript
timeout: 120 * 1000, // 2 minutes
```

### Issue: "Flaky tests"
**Solution:** Run with retries and check network logs:
```bash
npx playwright test --retries=3 --reporter=html
```

---

## CI/CD Integration

### GitHub Actions
Tests run automatically on push/PR. See workflow at `.github/workflows/playwright.yml`.

### Local CI Simulation
Run tests as they would run in CI:
```bash
CI=true npx playwright test --project=chromium --workers=2
```

---

## Performance Tips

### Faster Execution
1. **Reduce browser projects:** Run essential browsers only
2. **Increase workers:** Use more parallel workers (up to CPU cores)
3. **Skip non-critical tests:** Use `.only` or tags
4. **Disable video/screenshots** in `playwright.config.ts` for development

### Resource Optimization
```bash
# Limit memory usage
NODE_OPTIONS=--max_old_space_size=4096 npx playwright test

# Run specific suite
npx playwright test tests/auth.spec.ts tests/pos.spec.ts
```

---

## Best Practices

1. **Always run setup first** if authentication fails
2. **Check server logs** when tests fail unexpectedly
3. **Use headed mode** to visually debug issues
4. **Review traces** for complex failures
5. **Keep tests isolated** - each test should be independent
6. **Clean up test data** - use fixtures for automatic cleanup

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `npx playwright test` | Run all tests |
| `npx playwright test --headed` | Run with visible browser |
| `npx playwright test --debug` | Debug mode |
| `npx playwright test --ui` | Interactive UI mode |
| `npx playwright show-report` | View HTML report |
| `npx playwright codegen` | Generate test code |
| `npx playwright test --list` | List all tests |
| `npx playwright test --project=chromium` | Single browser |

---

## Support

For issues:
1. Check test output and traces
2. Review `playwright-report/` folder
3. Check server logs (backend/frontend)
4. Consult debugging procedures document
