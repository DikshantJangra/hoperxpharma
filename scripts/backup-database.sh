#!/bin/bash

# HopeRxPharma - Database Backup Script
# Version: 1.0
# Purpose: Automated daily database backups with cloud upload

set -e

# Configuration
BACKUP_DIR="/var/backups/hoperx"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
LOG_FILE="/var/log/hoperx-backup.log"

# Cloud storage (uncomment and configure based on your provider)
# S3_BUCKET="s3://your-bucket/backups"
# R2_BUCKET="r2://your-bucket/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "================================================"
log "Starting database backup process"
log "================================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    if [ -f "backend/.env" ]; then
        export $(grep "^DATABASE_URL=" backend/.env | xargs)
    else
        log "ERROR: DATABASE_URL not found"
        exit 1
    fi
fi

# Backup filename
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

log "Creating database backup..."
log "Backup file: $COMPRESSED_FILE"

# Perform backup
if pg_dump "$DATABASE_URL" | gzip > "$COMPRESSED_FILE"; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log "✅ Backup created successfully ($BACKUP_SIZE)"
else
    log "❌ Backup failed!"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if gunzip -t "$COMPRESSED_FILE" 2>/dev/null; then
    log "✅ Backup integrity verified"
else
    log "❌ Backup integrity check failed!"
    exit 1
fi

# Upload to cloud storage (uncomment and configure)
# log "Uploading to cloud storage..."
# if aws s3 cp "$COMPRESSED_FILE" "$S3_BUCKET/" 2>&1 | tee -a "$LOG_FILE"; then
#     log "✅ Uploaded to S3"
# else
#     log "⚠️  Cloud upload failed (backup still available locally)"
# fi

# Cleanup old backups
log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log "✅ Deleted $DELETED_COUNT old backup(s)"
else
    log "No old backups to delete"
fi

# List recent backups
log "Recent backups:"
ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz | tail -n 5 | while read -r line; do
    log "  $line"
done

log "================================================"
log "Backup process completed successfully"
log "Latest backup: $COMPRESSED_FILE"
log "================================================"

exit 0
