# Production Deployment Guide

Complete guide for deploying the Universal Medicine Master Database to production.

## Pre-Deployment Checklist

### 1. Environment Configuration

Create `.env.production` with all required variables:

```env
# Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL="postgresql://user:password@host:5432/pharmacy_db?connection_limit=10"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Typesense
TYPESENSE_HOST="typesense.yourdomain.com"
TYPESENSE_PORT=8108
TYPESENSE_API_KEY="your-production-api-key"
TYPESENSE_PROTOCOL=https
TYPESENSE_COLLECTION_NAME="medicines"

# Cloudflare R2
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="medicine-images"
R2_PUBLIC_URL="https://images.yourdomain.com"

# Redis
REDIS_URL="redis://redis.yourdomain.com:6379"

# API
API_RATE_LIMIT=1000
API_MAX_RESULTS_PER_QUERY=100
API_MAX_BULK_OPERATION_SIZE=1000

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN="https://yourdomain.com"

# File Upload
MAX_FILE_SIZE=10485760

# Migration
MIGRATION_BATCH_SIZE=100
MIGRATION_DEDUPE_THRESHOLD=85
```

### 2. Infrastructure Setup

**PostgreSQL**:
- Version: 14+
- Connection pooling: PgBouncer recommended
- Backup strategy: Daily automated backups
- Replication: Read replicas for scaling

**Typesense**:
- Version: 0.25+
- Memory: 4GB minimum for 3L records
- Storage: SSD recommended
- High availability: 3-node cluster

**Redis**:
- Version: 7+
- Memory: 2GB minimum
- Persistence: AOF enabled
- High availability: Redis Sentinel

**Cloudflare R2**:
- Bucket created and configured
- CORS policy set
- CDN enabled for public URL

### 3. Security Hardening

**Database**:
```sql
-- Create read-only user for reporting
CREATE USER medicine_readonly WITH PASSWORD 'secure-password';
GRANT CONNECT ON DATABASE pharmacy_db TO medicine_readonly;
GRANT USAGE ON SCHEMA public TO medicine_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO medicine_readonly;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
```

**API**:
- Enable HTTPS only
- Set secure headers (Helmet.js)
- Rate limiting per store
- Input validation on all endpoints
- SQL injection prevention (Prisma)

**Secrets Management**:
- Use environment variables
- Never commit secrets to git
- Rotate keys regularly
- Use AWS Secrets Manager or similar

## Deployment Steps

### Step 1: Build Application

```bash
cd backend

# Install dependencies
npm ci --production

# Generate Prisma client
npx prisma generate

# Type check
npm run type-check

# Run tests
npm test
```

### Step 2: Database Migration

```bash
# Backup current database
pg_dump -U postgres pharmacy_db > backup_$(date +%Y%m%d).sql

# Apply migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

### Step 3: Data Migration

```bash
# Dry run first
npm run migrate:medicines -- \
  --source=medicine-index.json \
  --dry-run

# Full migration
npm run migrate:medicines -- \
  --source=medicine-index.json \
  --batch-size=100

# Verify results
cat migration-reports/migration-*.json
```

### Step 4: Search Index Setup

```bash
# Rebuild search index
npm run rebuild-search-index

# Verify index
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  "https://typesense.yourdomain.com:8108/collections/medicines"
```

### Step 5: Start Application

```bash
# Using PM2 (recommended)
pm2 start src/server.js \
  --name medicine-api \
  --instances 4 \
  --exec-mode cluster \
  --env production

# Or using systemd
sudo systemctl start medicine-api
sudo systemctl enable medicine-api
```

### Step 6: Health Checks

```bash
# Basic health
curl https://api.yourdomain.com/api/v1/health

# Readiness check
curl https://api.yourdomain.com/api/v1/health/ready

# Metrics
curl https://api.yourdomain.com/api/v1/health/metrics
```

### Step 7: Smoke Tests

```bash
# Search test
curl "https://api.yourdomain.com/api/v1/medicines/search?q=paracetamol"

# Get medicine
curl "https://api.yourdomain.com/api/v1/medicines/CANONICAL_ID"

# Store overlay
curl "https://api.yourdomain.com/api/v1/stores/STORE_ID/medicines/CANONICAL_ID"
```

## Monitoring Setup

### 1. Application Logs

```bash
# View logs
pm2 logs medicine-api

# Or with systemd
journalctl -u medicine-api -f

# Log files location
tail -f logs/combined-*.log
tail -f logs/error-*.log
```

### 2. Metrics Collection

Set up Prometheus to scrape `/api/v1/health/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'medicine-api'
    static_configs:
      - targets: ['api.yourdomain.com:3000']
    metrics_path: '/api/v1/health/metrics'
    scrape_interval: 30s
```

### 3. Alerting Rules

```yaml
# alerts.yml
groups:
  - name: medicine_api
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: SlowSearchQueries
        expr: medicine_search_duration_avg > 1000
        for: 5m
        annotations:
          summary: "Search queries are slow"

      - alert: DatabaseConnectionFailed
        expr: database_health == 0
        for: 1m
        annotations:
          summary: "Database connection failed"
```

### 4. Grafana Dashboards

Import dashboards for:
- API request rate and latency
- Search performance
- Database connection pool
- Memory and CPU usage
- Error rates by endpoint

## Performance Optimization

### 1. Database Indexes

```sql
-- Verify indexes exist
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'medicine%';

-- Add missing indexes if needed
CREATE INDEX CONCURRENTLY idx_medicine_master_name_trgm 
ON medicine_master USING gin (name gin_trgm_ops);
```

### 2. Connection Pooling

```javascript
// PgBouncer configuration
[databases]
pharmacy_db = host=localhost port=5432 dbname=pharmacy_db

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### 3. Caching Strategy

```typescript
// Redis caching for hot medicines
const cacheKey = `medicine:${canonicalId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const medicine = await prisma.medicineMaster.findUnique(...);
await redis.setex(cacheKey, 3600, JSON.stringify(medicine));
```

### 4. CDN Configuration

```nginx
# Cloudflare R2 CDN
location /images/ {
  proxy_pass https://images.yourdomain.com/;
  proxy_cache_valid 200 30d;
  proxy_cache_valid 404 1h;
  add_header Cache-Control "public, max-age=2592000";
}
```

## Backup Strategy

### 1. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"

pg_dump -U postgres pharmacy_db | gzip > $BACKUP_DIR/pharmacy_db_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3
aws s3 cp $BACKUP_DIR/pharmacy_db_$DATE.sql.gz s3://backups/postgres/
```

### 2. Typesense Backups

```bash
# Export Typesense collection
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  "https://typesense.yourdomain.com:8108/collections/medicines/documents/export" \
  > medicines_backup_$(date +%Y%m%d).jsonl
```

### 3. Image Backups

```bash
# R2 bucket replication
# Configure in Cloudflare dashboard or use rclone
rclone sync r2:medicine-images r2-backup:medicine-images-backup
```

## Disaster Recovery

### 1. Database Recovery

```bash
# Restore from backup
gunzip < pharmacy_db_20260115.sql.gz | psql -U postgres pharmacy_db

# Verify data
psql -U postgres pharmacy_db -c "SELECT COUNT(*) FROM medicine_master;"
```

### 2. Search Index Recovery

```bash
# Rebuild from database
npm run rebuild-search-index

# Or import from backup
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  -X POST \
  "https://typesense.yourdomain.com:8108/collections/medicines/documents/import" \
  --data-binary @medicines_backup.jsonl
```

### 3. Rollback Procedure

```bash
# Stop application
pm2 stop medicine-api

# Restore database
gunzip < backup_before_migration.sql.gz | psql -U postgres pharmacy_db

# Revert code
git checkout previous-stable-tag

# Restart
pm2 start medicine-api
```

## Scaling Considerations

### Horizontal Scaling

```bash
# Add more API instances
pm2 scale medicine-api +2

# Or with Kubernetes
kubectl scale deployment medicine-api --replicas=6
```

### Database Scaling

```yaml
# Read replicas for search queries
DATABASE_READ_URL="postgresql://readonly@replica:5432/pharmacy_db"

# Use read replica for search operations
const searchPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_READ_URL } }
});
```

### Typesense Scaling

```bash
# 3-node cluster for high availability
typesense-server \
  --data-dir=/data \
  --api-key=$TYPESENSE_API_KEY \
  --nodes=node1:8108,node2:8108,node3:8108
```

## Troubleshooting

### High Memory Usage

```bash
# Check memory
pm2 monit

# Restart if needed
pm2 restart medicine-api

# Increase memory limit
pm2 start src/server.js --max-memory-restart 1G
```

### Slow Queries

```sql
-- Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Search Performance Issues

```bash
# Check Typesense health
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  "https://typesense.yourdomain.com:8108/health"

# Check collection stats
curl -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  "https://typesense.yourdomain.com:8108/collections/medicines"

# Rebuild index if corrupted
npm run rebuild-search-index
```

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database connections use SSL
- [ ] JWT secret is strong and rotated
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly
- [ ] Secrets stored securely (not in code)
- [ ] Database user has minimal permissions
- [ ] Backups are encrypted
- [ ] Logs don't contain sensitive data
- [ ] Security headers configured (Helmet.js)
- [ ] Dependencies updated regularly

## Post-Deployment

### 1. Monitor for 24 Hours

- Watch error rates
- Check response times
- Monitor database connections
- Verify search accuracy

### 2. Gradual Rollout

- Start with 10% of traffic
- Monitor metrics
- Increase to 50% if stable
- Full rollout after 24 hours

### 3. Update Documentation

- Document any configuration changes
- Update runbooks
- Share deployment notes with team

## Support Contacts

- **Database Issues**: DBA team
- **Search Issues**: DevOps team
- **Application Issues**: Backend team
- **Infrastructure**: Platform team

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
