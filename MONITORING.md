# Application Monitoring Configuration Guide

## Overview

HopeRxPharma monitoring setup for production visibility and incident response.

---

## 1. Health Check Monitoring ✅ IMPLEMENTED

**Endpoints:**
- `/api/v1/health/ping` - Fast availability check (< 10ms)
- `/api/v1/health` - Full diagnostics (DB, memory, uptime)
- `/api/v1/health/ready` - Readiness probe
- `/api/v1/health/live` - Liveness probe

**UptimeRobot Setup (Free tier: 50 monitors):**
```
1. Sign up: https://uptimerobot.com
2. Add HTTP(s) monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: HopeRx API Health
   - URL: https://api.yourdomain.com/api/v1/health/ping
   - Monitoring Interval: Every 5 minutes
   - Alert Contacts: Your email/SMS
3. Expected Response: 200 OK
```

---

## 2. Error Tracking - Sentry (Recommended

)

### Backend Setup

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

**File:** `backend/src/config/sentry.js`
```javascript
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1,
});

module.exports = Sentry;
```

**Integration in `app.js`:**
```javascript
const Sentry = require('./config/sentry');

// Add at the top (after imports)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Add BEFORE error handler
app.use(Sentry.Handlers.errorHandler());
```

### Frontend Setup

```bash
npm install @sentry/nextjs
```

Run configuration wizard:
```bash
npx @sentry/wizard@latest -i nextjs
```

Add to `.env.production`:
```
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project
```

---

## 3. Cache Performance Monitoring ✅ IMPLEMENTED

**Endpoints:**
- GET `/api/v1/cache/stats` - Cache hit rates
- POST `/api/v1/cache/clear` - Clear all caches (admin)
- POST `/api/v1/cache/clear/:type` - Clear specific cache

**Monitor Cache Hit Rates:**
```bash
# Check cache performance
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/api/v1/cache/stats

# Expected hit rates:
# - Drugs: >70%
# - Permissions: >80%
# - Stores: >90%
```

---

## 4. Log Aggregation ✅ CONFIGURED

**Winston Logs:**
- Location: `backend/logs/`
- Rotation: Daily
- Retention: 7-14 days

**Optional: Ship to External Service**

**Logtail (BetterStack) Setup:**
```bash
npm install winston-logtail
```

```javascript
// backend/src/config/logger.js
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");

const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

// Add to transports array
if (isProduction && process.env.LOGTAIL_SOURCE_TOKEN) {
    transports.push(new LogtailTransport(logtail));
}
```

---

## 5. Database Monitoring

**PgHero (PostgreSQL Monitoring):**
```bash
# Install PgHero CLI
brew install ankane/brew/pghero

# Run web interface
pghero DATABASE_URL
# Access: http://localhost:3001
```

**Key Metrics to Monitor:**
- Slow queries (> 1s)
- Connection pool usage
- Index efficiency
- Table bloat

---

## 6. Application Performance Monitoring (APM)

### Option A: New Relic (Recommended for Production)

```bash
npm install newrelic
```

**File:** `backend/newrelic.js`
```javascript
exports.config = {
  app_name: ['HopeRxPharma'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info',
  },
};
```

Add to `server.js` (first line):
```javascript
require('newrelic');
```

### Option B: Prometheus + Grafana (Self-Hosted)

```bash
npm install prom-client
```

**File:** `backend/src/routes/metricsRoutes.js`
```javascript
const express = require('express');
const router = express.Router();
const client = require('prom-client');

// Collect default metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

router.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

module.exports = { router, httpRequestDuration };
```

---

## 7. Monitoring Dashboard

**Recommended Stack:**
1. **UptimeRobot** - Uptime monitoring (free)
2. **Sentry** - Error tracking ($26/month)
3. **Logtail** - Log aggregation (free tier: 1GB)
4. **PgHero** - Database monitoring (self-hosted)

**Total Cost:** ~$26/month

---

## 8. Alerting Rules

### Critical Alerts (PagerDuty/Email)
- API down for > 2 minutes
- Error rate > 5%
- Database connection fails
- Memory usage > 90%

### Warning Alerts (Slack/Email)
- Response time > 2s (p95)
- Cache hit rate < 50%
- Disk space < 20%
- Error rate > 1%

---

## 9. Monitoring Checklist

**Daily Checks:**
- [ ] Review error logs
- [ ] Check uptime status
- [ ] Verify backup completion

**Weekly Checks:**
- [ ] Review slow queries
- [ ] Check cache hit rates
- [ ] Analyze performance trends
- [ ] Review security alerts

**Monthly Checks:**
- [ ] Database optimization
- [ ] Log rotation verification
- [ ] SSL certificate expiry (90 days)
- [ ] Dependency updates

---

## 10. Quick Setup for Pilot Launch

**Minimum Required:**
1. ✅ Health check endpoints (DONE)
2. ✅ Winston logging (DONE)
3. ✅ Correlation IDs (DONE)
4. ✅ Cache monitoring (DONE)
5. Setup UptimeRobot (15 minutes)

**Optional for Later:**
- Sentry integration
- Log aggregation service
- APM tool

---

## Environment Variables

```bash
# Monitoring
SENTRY_DSN=https://your-key@sentry.io/project
LOGTAIL_SOURCE_TOKEN=your-token
NEW_RELIC_LICENSE_KEY=your-key

# Already configured
LOG_LEVEL=info
NODE_ENV=production
```

---

**Status:** Monitoring infrastructure ready for pilot launch  
**Next:** Set up UptimeRobot for uptime alerting (15 min)
