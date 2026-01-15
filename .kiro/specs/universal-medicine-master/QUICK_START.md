# Quick Start Guide - Universal Medicine Master

Get up and running with the new medicine master system in 5 minutes.

## Prerequisites

- PostgreSQL running
- Typesense installed and running
- Node.js 18+
- Existing medicine data in JSON format

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pharmacy_db"
TYPESENSE_HOST="localhost"
TYPESENSE_PORT="8108"
TYPESENSE_API_KEY="your-api-key"
```

## Step 3: Run Database Migration

```bash
npx prisma migrate dev
npx prisma generate
```

## Step 4: Migrate Medicine Data

```bash
# Dry run first
npm run migrate:medicines -- --source=medicine-index.json --dry-run

# Full migration
npm run migrate:medicines -- --source=medicine-index.json
```

## Step 5: Start Backend

```bash
npm run dev
```

## Step 6: Test API

```bash
# Search medicines
curl "http://localhost:3000/api/v1/medicines/search?q=paracetamol"

# Get merged medicine (master + store overlay)
curl "http://localhost:3000/api/v1/stores/YOUR_STORE_ID/medicines/CANONICAL_ID"
```

## Common Commands

```bash
# Rebuild search index
npm run rebuild-search-index

# Run property tests
npm test backend/tests/medicine-master/

# Check migration report
cat backend/migration-reports/migration-*.json

# Open Prisma Studio
npx prisma studio
```

## API Examples

### Search with Filters

```bash
curl "http://localhost:3000/api/v1/medicines/search?q=paracetamol&manufacturer=ABC&requiresPrescription=false"
```

### Set Store Pricing

```bash
curl -X PUT "http://localhost:3000/api/v1/stores/store-123/medicines/med-456/overlay" \
  -H "Content-Type: application/json" \
  -d '{"customMrp": 150, "stockQuantity": 50}'
```

### Submit New Medicine

```bash
curl -X POST "http://localhost:3000/api/v1/medicines/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "MANUAL",
    "name": "New Medicine",
    "composition": "Active 100mg",
    "manufacturer": "ABC Pharma",
    "form": "Tablet",
    "sourceStoreId": "store-123"
  }'
```

## Troubleshooting

**Migration fails**: Check PostgreSQL connection and Typesense health

**Search not working**: Run `npm run rebuild-search-index`

**Slow queries**: Verify database indexes with `npx prisma studio`

## Next Steps

1. Read full documentation: `IMPLEMENTATION_COMPLETE.md`
2. Review API routes: `backend/src/routes/v1/medicines*.routes.js`
3. Check property tests: `backend/tests/medicine-master/`
4. Update frontend to use new API

## Support

- Design doc: `.kiro/specs/universal-medicine-master/design.md`
- Migration guide: `backend/MIGRATION_GUIDE.md`
- Tasks: `.kiro/specs/universal-medicine-master/tasks.md`
