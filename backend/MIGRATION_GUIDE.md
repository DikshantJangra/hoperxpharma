# Medicine Data Migration Guide

This guide explains how to migrate existing medicine data from CSV/JSON files to the new Universal Medicine Master database.

## Prerequisites

1. **Database Setup**: Ensure Prisma migrations are applied
   ```bash
   cd backend
   npx prisma migrate dev
   ```

2. **Typesense Setup**: Ensure Typesense is running
   ```bash
   # Check Typesense health
   curl http://localhost:8108/health
   ```

3. **Environment Variables**: Configure in `.env`
   ```env
   DATABASE_URL="postgresql://..."
   TYPESENSE_HOST="localhost"
   TYPESENSE_PORT="8108"
   TYPESENSE_API_KEY="your-api-key"
   ```

## Migration Process

### Step 1: Prepare Source Data

Ensure your source file (`medicine-index.json`) is in the correct format:

```json
[
  {
    "id": "old-id-123",
    "name": "Paracetamol",
    "genericName": "Acetaminophen",
    "composition": "Paracetamol 500mg",
    "manufacturer": "ABC Pharma",
    "form": "Tablet",
    "packSize": "10 tablets",
    "schedule": "G",
    "requiresPrescription": false,
    "gstRate": 12,
    "hsnCode": "30049099",
    "barcode": "1234567890123"
  }
]
```

### Step 2: Run Dry Run (Recommended)

Test the migration without writing data:

```bash
npm run migrate:medicines -- --source=medicine-index.json --dry-run
```

This will:
- Validate data format
- Check for duplicates
- Report potential issues
- Show estimated results

### Step 3: Run Full Migration

Execute the actual migration:

```bash
npm run migrate:medicines -- --source=medicine-index.json
```

**Options:**
- `--source=<path>`: Path to source JSON file (default: `medicine-index.json`)
- `--dry-run`: Test mode, no data written
- `--batch-size=<n>`: Records per batch (default: 100)
- `--skip-indexing`: Skip Typesense indexing (faster, but search won't work)

### Step 4: Verify Results

Check the migration report:

```bash
cat backend/migration-reports/migration-<timestamp>.json
```

Verify database records:

```bash
npx prisma studio
```

Test search functionality:

```bash
curl http://localhost:3000/api/v1/medicines/search?q=paracetamol
```

## Migration Features

### 1. Data Normalization

The migration automatically normalizes:
- **Names**: Title case, trimmed whitespace
- **Strengths**: Standardized units (mg, mcg, ml, etc.)
- **Pack Sizes**: Consistent format

### 2. Deduplication

Duplicate detection uses fuzzy matching:
- Name similarity > 85%
- Composition similarity > 85%
- Same manufacturer

Duplicates are skipped, and ID mappings are created for backward compatibility.

### 3. ID Mapping

Old IDs are mapped to new canonical IDs:
- Enables backward compatibility
- Existing references continue to work
- Lookup via `/api/v1/medicines/lookup?oldId=<id>`

### 4. Batch Processing

Large datasets are processed in batches:
- Default: 100 records per batch
- Prevents memory issues
- Progress tracking

### 5. Error Handling

Errors are logged but don't stop migration:
- Failed records are reported
- Partial success is possible
- Detailed error messages

## Post-Migration Tasks

### 1. Update Frontend

Replace MiniSearch with new API:

```typescript
// Old (remove)
import { searchMedicines } from '@/lib/miniSearch';

// New
import { searchMedicines } from '@/lib/api/medicines';

const results = await searchMedicines({
  query: 'paracetamol',
  storeId: currentStore.id,
});
```

### 2. Remove Old CSV Files

After verifying migration:

```bash
# Backup first
mv medicine-index.json medicine-index.json.backup

# Remove from frontend
rm public/data/medicine-index.json
```

### 3. Update PO Composer

Update purchase order medicine search:

```typescript
// components/PurchaseOrder/MedicineSearch.tsx
const { data: medicines } = useQuery({
  queryKey: ['medicines', 'search', query],
  queryFn: () => searchMedicines({ query, storeId }),
});
```

### 4. Verify Store Overlays

Check that store-specific data is preserved:

```bash
curl http://localhost:3000/api/v1/stores/<storeId>/medicines/<canonicalId>
```

## Troubleshooting

### Issue: Migration Fails with "Connection Refused"

**Solution**: Ensure PostgreSQL and Typesense are running

```bash
# Check PostgreSQL
psql -U postgres -c "SELECT 1"

# Check Typesense
curl http://localhost:8108/health
```

### Issue: High Duplicate Count

**Solution**: Adjust deduplication threshold

```bash
# More strict (fewer duplicates detected)
npm run migrate:medicines -- --dedupe-threshold=95

# More lenient (more duplicates detected)
npm run migrate:medicines -- --dedupe-threshold=75
```

### Issue: Out of Memory

**Solution**: Reduce batch size

```bash
npm run migrate:medicines -- --batch-size=50
```

### Issue: Slow Indexing

**Solution**: Skip indexing during migration, rebuild after

```bash
# Migrate without indexing
npm run migrate:medicines -- --skip-indexing

# Rebuild index after
npm run rebuild-search-index
```

## Rollback

If migration fails or produces incorrect results:

### 1. Database Rollback

```bash
# Revert migration
npx prisma migrate reset

# Re-apply previous migrations
npx prisma migrate deploy
```

### 2. Clear Typesense Index

```bash
curl -X DELETE "http://localhost:8108/collections/medicines" \
  -H "X-TYPESENSE-API-KEY: your-api-key"
```

### 3. Restore Backup

```bash
# Restore database backup
psql -U postgres -d pharmacy_db < backup.sql

# Restore CSV file
mv medicine-index.json.backup medicine-index.json
```

## Performance Expectations

For 250,000 records:
- **Duration**: ~15-30 minutes
- **Memory**: ~500MB peak
- **Disk**: ~150MB database + ~100MB search index
- **Throughput**: ~150-300 records/second

## Support

For issues or questions:
1. Check migration report for error details
2. Review logs in `backend/logs/migration.log`
3. Consult the design document: `.kiro/specs/universal-medicine-master/design.md`
