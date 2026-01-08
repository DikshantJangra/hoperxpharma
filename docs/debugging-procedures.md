# Playwright Test Debugging Procedures

## Quick Diagnosis Flowchart

```
Test Failed
    ↓
Is it a timeout?
    YES → Check selectors, increase timeout, verify page loads
    NO → Continue
    ↓
Is it an assertion failure?
    YES → Check expected vs actual values, review test data
    NO → Continue
    ↓
Is it a network error?
    YES → Check API endpoints, verify backend is running
    NO → Continue
    ↓
Is it intermittent (flaky)?
    YES → Add waits, check race conditions, use retries
    NO → Bug in application or test
```

---

## 1. Screenshot & Video Analysis

### View Failed Test Screenshot
```bash
# Screenshots are in test-results/
open test-results/[test-name]/test-failed-1.png
```

### Watch Failure Video
```bash
# Videos retained on failure
open test-results/[test-name]/video.webm
```

### Generate Trace
Best for detailed debugging:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

**Trace includes:**
- Timeline of actions
- Screenshots at each step
- Network activity
- Console logs
- DOM snapshots

---

## 2. Common Failure Patterns

### Timeout Errors

**Symptom:** `Timeout 30000ms exceeded waiting for...`

**Causes:**
- Element never becomes visible
- Slow network/page load
- Wrong selector
- JavaScript not executing

**Debug Steps:**
1. **Verify element exists:**
   ```bash
   npx playwright test --headed --debug
   # Pause and inspect page
   ```

2. **Check selector:**
   ```typescript
   // Add debug output
   const element = await page.locator('button:has-text("Submit")');
   console.log('Element count:', await element.count());
   console.log('Is visible:', await element.isVisible());
   ```

3. **Increase timeout temporarily:**
   ```typescript
   await expect(page.locator(selector)).toBeVisible({ timeout: 60000 });
   ```

4. **Check network:**
   ```typescript
   // Log slow requests
   page.on('response', response => {
     if (response.timing().responseEnd > 5000) {
       console.log('Slow response:', response.url());
     }
   });
   ```

**Solutions:**
- Use more specific selectors
- Wait for network idle: `await page.waitForLoadState('networkidle')`
- Add explicit waits: `await page.waitForSelector(selector)`
- Check backend logs for slow queries

---

### Assertion Failures

**Symptom:** `Expected "X" to equal "Y"`

**Debug Steps:**
1. **Log actual value:**
   ```typescript
   const actualValue = await page.locator(selector).textContent();
   console.log('Actual value:', actualValue);
   console.log('Expected value:', expectedValue);
   ```

2. **Inspect database state:**
   ```typescript
   const dbRecord = await db.model.findUnique({ where: { id } });
   console.log('Database record:', dbRecord);
   ```

3. **Check timing:**
   ```typescript
   // Wait for data to update
   await page.waitForTimeout(1000);
   // Or better - wait for specific condition
   await expect(page.locator(selector)).toHaveText(expected);
   ```

**Solutions:**
- Verify test data setup
- Check for async operations completing
- Review backend logs for errors
- Use `toContainText()` instead of exact match if appropriate

---

### Selector Not Found

**Symptom:** `locator.click: Target closed` or `Element not found`

**Debug Steps:**
1. **Capture page HTML:**
   ```typescript
   const html = await page.content();
   console.log(html); // or save to file
   ```

2. **Try alternative selectors:**
   ```typescript
   // Instead of text
   await page.locator('[data-testid="submit-btn"]').click();
   
   // Instead of CSS
   await page.getByRole('button', { name: 'Submit' }).click();
   ```

3. **Check element is in viewport:**
   ```typescript
   await page.locator(selector).scrollIntoViewIfNeeded();
   await page.locator(selector).click();
   ```

**Solutions:**
- Use data-testid attributes (more stable)
- Use Playwright's locator strategy (getByRole, getByText)
- Check for dynamic content loading
- Verify element isn't in iframe

---

### Authentication Issues

**Symptom:** Redirected to login, "Unauthorized" errors

**Debug Steps:**
1. **Check storage state:**
   ```typescript
   import { storageInspector } from '../utils/debug.util';
   const tokens = await storageInspector.getLocalStorage(page);
   console.log('Auth tokens:', tokens);
   ```

2. **Verify cookies:**
   ```typescript
   const cookies = await page.context().cookies();
   console.log('Cookies:', cookies);
   ```

3. **Re-run auth setup:**
   ```bash
   rm -rf playwright/.auth
   npx playwright test --project=setup
   ```

**Solutions:**
- Check token expiration
- Verify backend session handling
- Ensure storage state file exists
- Re-generate auth state

---

### Database State Issues

**Symptom:** Unexpected data, constraint violations

**Debug Steps:**
1. **Inspect database directly:**
   ```bash
   cd backend
   npx prisma studio
   ```

2. **Add database logging:**
   ```typescript
   const user = await db.user.findFirst();
   console.log('Current user:', user);
   ```

3. **Check cleanup:**
   ```typescript
   // Verify test data is being cleaned
   console.log('Test data IDs:', testData);
   ```

**Solutions:**
- Ensure global teardown runs
- Check for foreign key constraints
- Verify unique constraints
- Reset database if corrupted

---

## 3. Network Debugging

### Enable Network Logging

```typescript
import { NetworkLogger } from '../utils/debug.util';

test('my test', async ({ page }) => {
  const networkLogger = new NetworkLogger(page);
  
  // ... test code ...
  
  // Check failed requests
  const failedRequests = networkLogger.getFailedRequests();
  console.log('Failed requests:', failedRequests);
});
```

### Intercept and Mock Requests

```typescript
// Mock slow API for testing
await page.route('**/api/slow-endpoint', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ data: 'mocked' }),
  });
});
```

### Debug Specific Endpoint

```typescript
page.on('response', async response => {
  if (response.url().includes('/api/sales')) {
    console.log('Sales API response:', response.status());
    console.log('Body:', await response.json());
  }
});
```

---

## 4. Flaky Test Diagnosis

**Symptom:** Test passes sometimes, fails other times

**Common Causes:**
1. **Race conditions** - async operations not waited for
2. **Timing issues** - elements appear/disappear quickly
3. **External dependencies** - API instability
4. **Shared state** - tests interfere with each other

**Debug Strategy:**

1. **Run test repeatedly:**
   ```bash
   npx playwright test --repeat-each=10 tests/flaky.spec.ts
   ```

2. **Add delays temporarily:**
   ```typescript
   // Find where it fails
   await page.waitForTimeout(2000); // Increment this
   ```

3. **Use strict selectors:**
   ```typescript
   // Bad - might match multiple
   await page.click('button');
   
   // Good - specific match
   await page.click('button:has-text("Submit"):visible');
   ```

4. **Wait for conditions:**
   ```typescript
   // Instead of timeout
   await expect(page.locator(selector)).toBeVisible();
   ```

**Solutions:**
- Replace `wait ForTimeout` with `waitForSelector`
- Use `waitForLoadState('networkidle')`
- Add retry logic with `retryWithBackoff`
- Ensure test isolation

---

## 5. Advanced Debugging Tools

### Using Playwright Inspector

```bash
# Pause at specific point
await page.pause();

# Run in debug mode
npx playwright test --debug tests/failing.spec.ts
```

**Features:**
- Step through test
- Inspect DOM at any point
- View console logs
- Check network requests
- Modify selectors on-the-fly

### Console Debugging

```typescript
import { ConsoleLogger } from '../utils/debug.util';

test('debug console', async ({ page }) => {
  const consoleLogger = new ConsoleLogger(page);
  
  // ... test code ...
  
  const errors = consoleLogger.getErrors();
  if (errors.length > 0) {
    console.log('Console errors:', errors);
  }
});
```

### Full Diagnostic Dump

```typescript
import { dumpDiagnostics } from '../utils/debug.util';

test('failing test', async ({ page }, testInfo) => {
  try {
    // ... test code ...
  } catch (error) {
    await dumpDiagnostics(page, testInfo);
    throw error;
  }
});
```

This captures:
- Screenshot
- HTML content
- Storage state
- Form data
- Network logs
- Console messages

---

## 6. CI-Specific Debugging

### Access CI Artifacts

1. Go to GitHub Actions run
2. Download `playwright-report` artifact
3. Extract and open `index.html`
4. View traces for failed tests

### Reproduce CI Environment Locally

```bash
# Run as CI would
CI=true npx playwright test --project=chromium --workers=2
```

### Check CI Logs

Look for:
- Backend startup errors
- Database connection issues
- Port conflicts
- Environment variable problems

---

## 7. Performance Debugging

### Identify Slow Tests

```bash
npx playwright test --reporter=html
# Open report and sort by duration
```

### Profile Test Execution

```typescript
import { PerformanceTracker } from '../utils/reporting.util';

test('slow test', async ({ page }) => {
  const perf = new PerformanceTracker();
  
  await page.goto('/dashboard');
  perf.mark('navigation');
  
  await page.fill('input', 'value');
  perf.mark('form-fill');
  
  await page.click('button');
  perf.mark('submit');
  
  perf.logMetrics();
});
```

### Optimize Slow Operations

- Use `getByRole` instead of `waitForSelector`
- Minimize `waitForTimeout` usage
- Parallel-ize independent operations
- Use database fixtures instead of UI setup

---

## Quick Reference: Debug Commands

| Issue | Command |
|-------|---------|
| See what test does | `npx playwright test --headed` |
| Step through test | `npx playwright test --debug` |
| Interactive debugging | `await page.pause()` |
| View trace | `npx playwright show-trace trace.zip` |
| Check selector | `npx playwright codegen http://localhost:3000` |
| Network inspection | Use NetworkLogger utility |
| Console errors | Use ConsoleLogger utility |
| Full diagnostics | Use dumpDiagnostics() |

---

## Need More Help?

1. Review test traces in HTML report
2. Check backend logs for API errors
3. Inspect database with Prisma Studio
4. Run test in headed mode to observe
5. Add console.log statements liberally
6. Use Playwright Inspector for step-by-step
