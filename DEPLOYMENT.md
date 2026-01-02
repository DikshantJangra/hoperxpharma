# 🚀 HopeRxPharma - Production Deployment Checklist

**Version:** 1.0  
**Last Updated:** December 31, 2024  
**Target Environment:** Production  

---

## ✅ Pre-Deployment Checklist

### 1. SSL/TLS Certificate Setup

#### Domain Configuration
- [ ] Domain purchased and DNS configured
- [ ] A record points to production server IP
- [ ] CNAME for www subdomain (if applicable)
- [ ] Verify DNS propagation: `nslookup yourdomain.com`

#### SSL Certificate (Let's Encrypt - Recommended)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Nginx Configuration (Frontend)
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Backend API SSL
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

**Verification:**
- [ ] Test HTTPS access: `https://yourdomain.com`
- [ ] Verify SSL rating: https://www.ssllabs.com/ssltest/
- [ ] Check certificate validity: `openssl s_client -connect yourdomain.com:443`

---

### 2. Environment Variables Validation

#### Backend (.env)
```bash
# Required Variables (Must be set)
NODE_ENV=production
PORT=8000

# Database (PostgreSQL with SSL)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# JWT Secrets (Generate with: openssl rand -base64 64)
JWT_SECRET="<64-char-random-string>"
JWT_REFRESH_SECRET="<64-char-random-string>"

# Encryption Keys (Generate with: openssl rand -base64 32)
WHATSAPP_ENCRYPTION_KEY="<32-char-random-string>"
SMTP_ENCRYPTION_KEY="<32-char-random-string>"

# Security
COOKIE_SECURE=true
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SESSION_TIMEOUT_MINUTES=15

# Logging
LOG_LEVEL=info

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

#### Frontend (.env.production)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

#### Validation Script
```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating environment variables..."

# Check backend variables
cd backend
if [ ! -f .env ]; then
    echo "❌ Backend .env file missing"
    exit 1
fi

# Check required variables
REQUIRED_VARS=("NODE_ENV" "DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "WHATSAPP_ENCRYPTION_KEY" "SMTP_ENCRYPTION_KEY")

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env; then
        echo "❌ Missing required variable: $var"
        exit 1
    fi
done

echo "✅ Backend environment variables validated"

# Check frontend
cd ../
if [ ! -f .env.production ]; then
    echo "❌ Frontend .env.production missing"
    exit 1
fi

if ! grep -q "^NEXT_PUBLIC_API_URL=" .env.production; then
    echo "❌ Missing NEXT_PUBLIC_API_URL"
    exit 1
fi

echo "✅ Frontend environment variables validated"
echo "🎉 All environment variables configured correctly"
```

**Checklist:**
- [ ] All required variables set in backend/.env
- [ ] JWT secrets are 64+ characters
- [ ] Encryption keys are 32+ characters
- [ ] DATABASE_URL includes `?sslmode=require`
- [ ] COOKIE_SECURE=true
- [ ] ALLOWED_ORIGINS matches production domain
- [ ] Frontend NEXT_PUBLIC_API_URL points to production API
- [ ] Run validation script: `bash validate-env.sh`

---

### 3. Database Migration Verification

#### Pre-Migration Checks
```bash
# 1. Backup current database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify Prisma schema
cd backend
npx prisma validate

# 3. Check migration status
npx prisma migrate status

# 4. Generate migration (if needed)
npx prisma migrate dev --name production_init --create-only

# 5. Review generated SQL
cat prisma/migrations/*/migration.sql
```

#### Migration Execution
```bash
# Production migration (point-of-no-return)
npx prisma migrate deploy

# Verify migration
npx prisma migrate status

# Expected output: "Database schema is up to date!"
```

#### Post-Migration Validation
```bash
# 1. Verify tables exist
psql $DATABASE_URL -c "\dt"

# 2. Check critical tables
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Store\";"

# 3. Verify indexes
psql $DATABASE_URL -c "\di"

# 4. Check constraints
psql $DATABASE_URL -c "SELECT conname FROM pg_constraint WHERE contype='f';"
```

**Checklist:**
- [ ] Database backup created and verified
- [ ] Prisma schema validated
- [ ] Migration files reviewed
- [ ] Migrations deployed successfully
- [ ] All tables created
- [ ] Indexes present
- [ ] Foreign key constraints active
- [ ] SSL connection verified

---

### 4. Backup & Disaster Recovery Plan

#### Automated Daily Backups

**Backup Script** (`scripts/backup-database.sh`):
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/hoperx"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Upload to cloud storage (S3/R2)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-bucket/backups/

# Remove old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: db_backup_$DATE.sql.gz"
```

**Cron Job** (Daily at 2 AM):
```bash
crontab -e
# Add:
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/hoperx-backup.log 2>&1
```

#### Disaster Recovery Procedures

**Recovery Time Objective (RTO):** 2 hours  
**Recovery Point Objective (RPO):** 24 hours (daily backups)

**Recovery Steps:**
1. Stop application services
2. Identify latest valid backup
3. Restore database
4. Verify data integrity
5. Restart services
6. Validate functionality

**Restore Command:**
```bash
# Download from cloud
aws s3 cp s3://your-bucket/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz .

# Decompress
gunzip db_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
psql $DATABASE_URL < dbbackup_YYYYMMDD_HHMMSS.sql
```

**Checklist:**
- [ ] Backup script created and tested
- [ ] Cron job configured
- [ ] Cloud storage bucket created
- [ ] Backup retention policy set (30 days)
- [ ] Recovery procedure documented
- [ ] Test restoration performed successfully
- [ ] Team trained on recovery process

---

### 5. Load Testing & Performance Validation

#### Load Testing Setup
```bash
# Install k6
brew install k6  # macOS
# or
sudo apt-get install k6  # Ubuntu
```

#### Load Test Script (`tests/load/basic-load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'https://api.yourdomain.com/api/v1';

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health/ping`);
  check(healthRes, {
    'health check status 200': (r) => r.status === 200,
    'health check response < 50ms': (r) => r.timings.duration < 50,
  });

  sleep(1);
}
```

#### Run Load Test
```bash
k6 run tests/load/basic-load-test.js
```

**Performance Targets:**
- [ ] Health check: < 50ms (p95)
- [ ] API endpoints: < 500ms (p95)
- [ ] Error rate: < 1%
- [ ] Concurrent users: 50+ without degradation
- [ ] Database connections: No connection pool exhaustion

---

### 6. Security Audit & Penetration Testing

#### Automated Security Scan
```bash
# npm audit
cd backend && npm audit
cd .. && npm audit

# Expected:  0 vulnerabilities
```

#### OWASP ZAP Scan
```bash
# Install OWASP ZAP
# Download from: https://www.zaproxy.org/download/

# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://yourdomain.com \
  -r zap-report.html
```

#### Security Checklist

**Authentication & Authorization:**
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens in httpOnly cookies
- [ ] CSRF protection enabled
- [ ] Session timeout functional (15 min)
- [ ] Password complexity enforced
- [ ] RBAC permissions working

**Data Protection:**
- [ ] Database SSL enforced
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced (SSL/TLS)
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints

**Infrastructure:**
- [ ] Firewall configured (only 80/443 open)
- [ ] SSH key-only authentication
- [ ] Database not publicly accessible
- [ ] Environment variables secured
- [ ] Logs don't contain secrets

**HIPAA Compliance:**
- [ ] Audit logging operational
- [ ] PHI access tracking
- [ ] Encryption in transit and at rest
- [ ] Access controls implemented

**Penetration Testing Tasks:**
- [ ] SQL injection attempts
- [ ] XSS vulnerability testing
- [ ] CSRF token validation
- [ ] File upload validation
- [ ] Authentication bypass attempts
- [ ] API rate limiting verification

---

### 7. User Acceptance Testing (UAT)

#### Test Scenarios

**Scenario 1: Complete POS Flow**
1. Login as pharmacist
2. Create new sale with 3 items
3. Apply discount
4. Process payment (cash + card)
5. Print invoice
6. Verify inventory deduction
7. Check audit log

**Scenario 2: Prescription Workflow**
1. Upload prescription image
2. Add patient details
3. Dispense medications
4. Update prescription status
5. Verify patient record

**Scenario 3: Inventory Management**
1. Create purchase order
2. Receive GRN
3. Update stock levels
4. Check expiry alerts
5. Generate stock report

**Test Users:**
- [ ] Admin account created
- [ ] Pharmacist account created
- [ ] Cashier account created (if applicable)
- [ ] Test data seeded

**UAT Sign-Off Form:**
```
Pharmacy Name: ___________________
Tester Name: _____________________
Date: ____________________________

[ ] POS operations functional
[ ] Prescription management works
[ ] Inventory tracking accurate
[ ] Reports generating correctly
[ ] Performance acceptable
[ ] No critical bugs found

Signature: ________________________
```

---

## 🚀 Final Deployment Steps

### 1. Pre-Deployment (T-24 hours)
- [ ] Code freeze
- [ ] Final backup of production database
- [ ] Notify pilot users of deployment window
- [ ] Prepare rollback plan

### 2. Deployment (T-0)
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install
cd backend && npm install

# 3. Build frontend
npm run build

# 4. Run migrations
cd backend && npx prisma migrate deploy

# 5. Restart services
pm2 restart all
# or
systemctl restart hoperx-backend
systemctl restart hoperx-frontend

# 6. Verify health
curl https://api.yourdomain.com/api/v1/health
```

### 3. Post-Deployment (T+1 hour)
- [ ] Verify all services running
- [ ] Test login flow
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Verify SSL certificates
- [ ] Test critical user flows

### 4. Monitoring (T+24 hours)
- [ ] Review application logs
- [ ] Check error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any issues

---

## 📞 Rollback Procedure

**If critical issues arise:**

```bash
# 1. Stop services
pm2 stop all

# 2. Restore previous code
git revert HEAD
npm install
npm run build

# 3. Rollback database (if needed)
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 4. Restart services
pm2 start all

# 5. Verify functionality
curl https://api.yourdomain.com/api/v1/health
```

---

## ✅ Final Sign-Off

**Deployment Lead:** ___________________  
**Date:** ___________________  
**Time:** ___________________

**Critical Checks:**
- [ ] SSL/TLS configured and tested
- [ ] Environment variables validated
- [ ] Database migrations successful
- [ ] Backups configured and tested
- [ ] Load testing passed
- [ ] Security audit completed
- [ ] UAT sign-off received
- [ ] Monitoring operational
- [ ] Rollback plan documented

**Status:** [ ] APPROVED FOR PRODUCTION

---

**Version:** 1.0  
**Next Review:** After First Week of Production
