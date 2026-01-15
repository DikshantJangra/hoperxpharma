# CSV to Medicine Master Migration Guide

## Overview
This guide helps you migrate medicine data from the CSV file to the new Medicine Master database schema.

## Prerequisites
- PostgreSQL database is running and accessible
- Prisma schema is up to date
- CSV file exists at `scripts/medicine-data/updated_indian_medicine_data.csv`

## Migration Steps

### Step 1: Sync Database Schema
```bash
cd backend
npm run build
```

This will:
- Generate Prisma client
- Push schema changes to database (if any)

### Step 2: Run CSV Migration
```bash
npm run medicine:migrate-csv
```

This script will:
- Read all medicines from the CSV file
- Parse salt compositions
- Create MedicineMaster records
- Create Salt records (if they don't exist)
- Link medicines to salts via MedicineSaltLink
- Create ID mappings for legacy reference
- Process in batches of 50 for performance

### Step 3: Initialize Typesense Search
```bash
npm run medicine:init-search
npm run medicine:rebuild-index
```

This will:
- Create the Typesense collection
- Index all medicines for fast search

## What Gets Migrated

### CSV Fields → Medicine Master Schema

| CSV Field | Medicine Master Field | Notes |
|-----------|----------------------|-------|
| id | legacyIds[] | Stored for reference |
| name | name | Medicine brand name |
| salt_composition | compositionText | Full composition text |
| salt_composition | MedicineSaltLink | Parsed into individual salts |
| manufacturer_name | manufacturerName | Manufacturer |
| pack_size_label | packSize | Pack size |
| pack_size_label | form | Extracted (Tablet, Syrup, etc.) |
| Is_discontinued | status | TRUE → DISCONTINUED, FALSE → APPROVED |
| price | - | Not migrated (store-specific) |

### Derived Fields

- **schedule**: Auto-detected from composition (H, H1, etc.)
- **requiresPrescription**: Auto-detected from composition
- **defaultGstRate**: Set to 12% (standard for medicines)
- **confidenceScore**: Set to 80 (high confidence for CSV data)
- **status**: APPROVED or DISCONTINUED based on CSV

## Data Validation

The script handles:
- Missing or empty compositions
- Various strength formats (mg, g, mcg, ml, %)
- Multiple salts in combination medicines
- Duplicate salt names (case-insensitive)

## Monitoring Progress

The script outputs:
- ✅ Success messages for each migrated medicine
- ❌ Error messages for failed migrations
- 📊 Final summary with success/failure counts

## Troubleshooting

### Error: "CSV file not found"
- Check that `scripts/medicine-data/updated_indian_medicine_data.csv` exists
- Verify you're running from the `backend` directory

### Error: "Unique constraint violation"
- The script is idempotent - it will skip existing records
- If you need to re-run, clear the tables first:
```sql
DELETE FROM medicine_salt_link;
DELETE FROM medicine_master;
DELETE FROM id_mapping WHERE source = 'CSV_MIGRATION';
```

### Error: "Salt not found"
- The script auto-creates salts if they don't exist
- Check the Salt table for existing records

## Post-Migration

After successful migration:

1. **Verify Data**:
```sql
SELECT COUNT(*) FROM medicine_master;
SELECT COUNT(*) FROM medicine_salt_link;
SELECT COUNT(*) FROM salt;
```

2. **Test Search**:
```bash
curl "http://localhost:8000/api/v1/medicines/search?q=paracetamol"
```

3. **Check Frontend**:
- Open the app
- Try searching for medicines
- Verify results display correctly

## Rollback

To rollback the migration:
```sql
DELETE FROM medicine_salt_link WHERE "medicineId" IN (
  SELECT id FROM medicine_master WHERE "createdBy" = 'csv_migration'
);
DELETE FROM medicine_master WHERE "createdBy" = 'csv_migration';
DELETE FROM id_mapping WHERE source = 'CSV_MIGRATION';
```

## Performance

- Processes ~50 medicines per batch
- Expected time: ~2-5 minutes for 1000 medicines
- Database connections are pooled for efficiency
