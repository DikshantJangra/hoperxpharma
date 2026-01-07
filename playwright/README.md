# Playwright E2E Test Suite

## Setup

### Prerequisites
- Node.js 18+ installed
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:3000`
- Test database configured

### Installation

```bash
# Install Playwright and dependencies
npm install -D @playwright/test @types/node

# Install browsers
npx playwright install chromium
```

### Environment Configuration

Create a `.env.test` file in the backend directory:

```env
# Test Database
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/hoperx_test"
DATABASE_URL="postgresql://user:password@localhost:5432/hoperx_test"

# Test Credentials
TEST_USER_EMAIL="test@automation.com"
TEST_USER_PASSWORD="Test@12345"
TEST_ADMIN_EMAIL="admin@automation.com"
TEST_ADMIN_PASSWORD="Admin@12345"

# API URL
PLAYWRIGHT_BASE_URL="http://localhost:3000"
API_URL="http://localhost:5000"
```

## Running Tests

### All Tests
```bash
npx playwright test
```

### Specific Test File
```bash
npx playwright test tests/auth.spec.ts
```

### With UI Mode (Debugging)
```bash
npx playwright test --ui
```

### With Headed Browser (Watch Tests Run)
```bash
npx playwright test --headed
```

### Specific Project (Browser)
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Show HTML Report
```bash
npx playwright show-report
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Structure

```
playwright/
├── config/              # Configuration files
│   ├── environments.ts  # Environment-specific settings
│   ├── global-setup.ts  # Pre-test setup
│   └── global-teardown.ts
├── utils/               # Utility functions
│   ├── database.util.ts # Database access & assertions
│   ├── auth.util.ts     # Authentication helpers
│   ├── cleanup.util.ts  # Test cleanup
│   └── wait.util.ts     # Wait strategies
├── fixtures/            # Test fixtures (coming soon)
├── flows/               # Reusable workflows (coming soon)
├── tests/               # Test specifications
│   ├── auth.setup.ts    # Authentication setup (runs first)
│   └── auth.spec.ts     # Authentication tests
└── .auth/               # Saved authentication states
    └── user.json        # Authenticated user session
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { getDatabase, closeDatabase } from '../utils/database.util';

test.describe('Feature Name', () => {
  test.afterEach(async () => {
    await closeDatabase();
  });
  
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/some-page');
    
    // Interact
    await page.click('button');
    
    // Assert UI
    await expect(page.locator('text=Success')).toBeVisible();
    
    // Verify backend
    const db = getDatabase();
    const record = await db.someModel.findFirst();
    expect(record).toBeDefined();
  });
});
```

### Using Database Assertions

```typescript
import { createDatabaseAssertions } from '../utils/database.util';

test('should verify backend state', async ({ page }) => {
  const dbAssert = createDatabaseAssertions();
  
  // Perform UI action...
  
  // Verify backend
  await dbAssert.expectRecordExists('sale', { id: saleId });
  await dbAssert.expectBatchQuantity(batchId, 90); // After sale of 10
  await dbAssert.expectAccessLog(userId, 'sale_created');
});
```

## Debugging

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Inspect Selectors
```bash
npx playwright test --debug
# Opens Playwright Inspector
```

### Screenshots on Failure
Screenshots are automatically captured and saved to `test-results/` on failure.

### Video Recording
Videos are recorded only on first retry and saved to `test-results/`.

## CI Integration

Tests run automatically on:
- Pull requests
- Pushes to `main` or `develop`
- Nightly at 2 AM UTC

See `.github/workflows/e2e-tests.yml` for configuration.

## Troubleshooting

### "Backend health check failed"
- Ensure backend is running: `cd backend && npm run dev`
- Check `backend/.env` has correct `PORT=5000`

### "Authentication tokens not found"
- Delete `playwright/.auth/user.json` and run setup again
- Check test user credentials in `.env.test`

### "Database connection failed"
- Verify `TEST_DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run migrations: `cd backend && npx prisma migrate deploy`

### Flaky Tests
- Increase timeouts in test
- Use proper wait strategies (see `utils/wait.util.ts`)
- Check for race conditions in UI
