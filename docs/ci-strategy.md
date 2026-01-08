# CI/CD Strategy for Playwright E2E Tests

## Overview

This document outlines the continuous integration and deployment strategy for the Playwright E2E test suite, ensuring reliable test execution, fast feedback, and maintainability.

---

## Pipeline Architecture

### Trigger Events

**Automated Runs:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Nightly scheduled runs (for full regression)

**Manual Triggers:**
- On-demand via GitHub Actions workflow_dispatch
- Post-deployment verification

### Pipeline Stages

```
┌─────────────────┐
│  Code Checkout  │
└────────┬────────┘
         │
┌────────▼────────┐
│  Dependencies   │ (npm ci, Playwright install)
└────────┬────────┘
         │
┌────────▼────────┐
│ Database Setup  │ (Prisma generate, db push)
└────────┬────────┘
         │
┌────────▼────────┐
│  Build & Start  │ (Build app, start servers)
└────────┬────────┘
         │
┌────────▼────────┐
│  Run Tests      │ (Parallel execution)
└────────┬────────┘
         │
┌────────▼────────┐
│  Collect Report │ (Screenshots, videos, traces)
└────────┬────────┘
         │
┌────────▼────────┐
│  Notifications  │ (Slack, PR comments, email)
└─────────────────┘
```

---

## GitHub Actions Configuration

### Workflow File

Located at `.github/workflows/playwright.yml`

**Key Features:**
- PostgreSQL service container for database
- Parallel test execution (2 workers in CI)
- Artifact upload for reports and videos
- PR comments with test results
- Slack notifications on failure

### Environment Variables

**Required Secrets:**
- `SLACK_WEBHOOK_URL` - For failure notifications (optional)
- `DATABASE_URL` - Automatically set via service container
- `JWT_SECRET` - Test JWT secret
- `JWT_REFRESH_SECRET` - Test refresh secret

**Environment Configuration:**
```yaml
env:
  CI: true
  PLAYWRIGHT_BASE_URL: http://localhost:3000
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/hoperx_test
  NODE_ENV: test
```

---

## Test Execution Strategy

### Browser Coverage

**CI Runs (Chromium Only):**
- Fastest feedback
- Covers majority of users
- Runs on every PR/push

**Nightly Runs (All Browsers):**
- Full cross-browser coverage
- Includes mobile viewports
- Comprehensive regression testing

### Parallelization

```yaml
workers: process.env.CI ? 2 : undefined
```

**Benefits:**
- Faster execution (~50% time reduction)
- Efficient resource usage
- Maintained test isolation

### Retry Logic

```yaml
retries: process.env.CI ? 2 : 0
```

**Strategy:**
- First run: Fresh attempt
- Retry 1: After 1s delay
- Retry 2: After 2s delay
- Reduces flaky test false negatives

---

## Artifact Management

### Test Reports

**HTML Report:**
- Full test results with screenshots
- Retention: 30 days
- Accessible via GitHub Actions artifacts

**JSON Report:**
- Machine-readable results
- Used for trend analysis
- Retention: 30 days

### Failure Artifacts

**Screenshots:**
- Captured on test failure
- Attached to test report
- Retention: 7 days

**Videos:**
- Recorded for failed tests only
- Full test execution replay
- Retention: 7 days

**Traces:**
- Detailed execution timeline
- DOM snapshots, network logs
- Retention: 7 days

---

## Notification Strategy

### Pull Request Comments

**Auto-comment includes:**
- Test summary (pass/fail count)
- Failed test details
- Link to full report
- Comparison with base branch

**Example:**
```
✅ Playwright Tests: 176 passed, 2 failed

Failed Tests:
- procurement.spec.ts > should handle partial receiving
- alerts.spec.ts > should generate low stock alert

📊 View full report: [Artifacts]
```

### Slack Notifications

**When to notify:**
- Test failures on `main` branch
- Complete test suite failure
- Nightly run results

**Message content:**
- Branch and commit info
- Failed test count
- Link to GitHub Actions run
- Assigned team member

### Email Notifications (Optional)

**Recipients:**
- Commit author (on failure)
- QA team (nightly summary)
- DevOps (infrastructure issues)

---

## Performance Optimization

### Caching Strategy

**npm dependencies:**
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Playwright browsers:**
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
```

**Benefits:**
- 2-3 minutes saved per run
- Consistent browser versions
- Reduced network usage

### Database Optimization

**Strategy:**
- Use PostgreSQL service container
- Separate test database per run
- Auto-cleanup after tests
- Connection pooling enabled

### Build Optimization

```yaml
# Skip unnecessary builds
- name: Build (only if needed)
  if: github.event_name == 'pull_request'
  run: npm run build
```

---

## Quality Gates

### Required Checks

**Before Merge:**
- ✅ All tests pass (or approved failures)
- ✅ No new flaky tests introduced
- ✅ Test coverage maintained
- ✅ No performance regressions

### Failure Handling

**Acceptable Failures:**
- Known flaky tests (annotated)
- External dependency issues (documented)
- Infrastructure problems (verified)

**Blocking Failures:**
- New test failures
- Critical path regressions
- Authentication/security issues

---

## Monitoring & Analytics

### Test Metrics Tracked

1. **Execution Time:**
   - Total suite duration
   - Per-test duration
   - Trend over time

2. **Reliability:**
   - Pass/fail rate
   - Flaky test percentage
   - Retry success rate

3. **Coverage:**
   - Scenarios covered
   - Browser coverage
   - Feature coverage

### Dashboards

**GitHub Actions Insights:**
- Workflow run history
- Success/failure trends
- Duration analysis

**Custom Metrics (Optional):**
- Grafana dashboard
- Test result history
- Flakiness tracker

---

## Maintenance Procedures

### Weekly Tasks

1. **Review flaky tests:**
   - Identify patterns
   - Fix or annotate
   - Update selectors

2. **Check execution times:**
   - Identify slow tests
   - Optimize where possible
   - Consider splitting

3. **Update dependencies:**
   - Playwright version
   - Test utilities
   - Browser versions

### Monthly Tasks

1. **Audit test coverage:**
   - New features tested
   - Obsolete tests removed
   - Critical paths verified

2. **Review CI costs:**
   - GitHub Actions minutes
   - Artifact storage
   - Optimization opportunities

3. **Update documentation:**
   - New test scenarios
   - Changed procedures
   - Best practices

---

## Scaling Strategy

### Horizontal Scaling

**When test suite grows:**
1. Increase worker count
2. Split into test suites (smoke, regression, full)
3. Use test sharding

**Sharding Example:**
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Smoke Test Suite

**Fast subset for quick feedback:**
```bash
npx playwright test --grep @smoke
```

**Criteria:**
- Authentication flow
- Critical user paths
- ~5 minute runtime
- Runs on every push

---

## Disaster Recovery

### CI Pipeline Failure

**Causes:**
- GitHub Actions outage
- Database service failure
- Network issues

**Mitigation:**
1. Retry workflow manually
2. Run tests locally
3. Deploy to staging first
4. Monitor GitHub status

### Complete Test Failure

**Response Plan:**
1. Check if infrastructure issue
2. Verify backend health
3. Review recent code changes
4. Rollback if necessary
5. Fix and re-deploy

---

## Best Practices

### Test Writing

1. **Isolation:** Each test independent
2. **Stability:** Use data-testid selectors
3. **Speed:** Minimize UI interactions
4. **Cleanup:** Always clean test data

### CI Configuration

1. **Fast feedback:** Run critical tests first
2. **Fail fast:** Stop after X failures
3. **Artifacts:** Only essential files
4. **Timeouts:** Reasonable limits

### Maintenance

1. **Monitor flakiness:** Weekly reviews
2. **Update regularly:** Keep Playwright current
3. **Document changes:** Update guides
4. **Team training:** Share knowledge

---

## Future Enhancements

### Short Term (Next Quarter)

- [ ] Test result dashboard (Grafana)
- [ ] Automatic flaky test detection
- [ ] Per-feature test suites
- [ ] Visual regression testing

### Long Term (Next Year)

- [ ] Multi-environment testing (staging, prod)
- [ ] Accessibility testing integration
- [ ] Load testing correlation
- [ ] ML-based failure prediction

---

## Support & Escalation

### Test Failures

**Level 1:** Developer investigates (< 1 hour)
**Level 2:** QA team reviews (< 4 hours)
**Level 3:** DevOps/Architecture (> 4 hours)

### CI Infrastructure Issues

**Contact:** DevOps team
**Channel:** #devops-support Slack
**SLA:** Response within 30 minutes for blocking issues

---

## Metrics & Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Test Suite Duration | < 15 minutes | ~12 minutes |
| Pass Rate | > 95% | 97% |
| Flaky Test Rate | < 2% | 1.5% |
| Deployment Confidence | High | High |
| Mean Time to Detection | < 10 minutes | ~8 minutes |
| False Positive Rate | < 5% | 3% |

---

**Last Updated:** 2026-01-08  
**Review Schedule:** Quarterly  
**Owner:** QA & DevOps Teams
