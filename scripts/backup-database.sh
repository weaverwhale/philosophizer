#!/bin/bash
#
# Complete database backup for Philosophizer
# Backs up ALL tables including users, conversations, and vector data
#
# Usage:
#   ./scripts/backup-database.sh [--remote DATABASE_URL]
#
# Examples:
#   ./scripts/backup-database.sh                              # Backup local Docker database
#   ./scripts/backup-database.sh --remote $DATABASE_URL       # Backup remote database (Railway, etc.)
#
# Output:
#   - backups/full-backup-YYYYMMDD_HHMMSS.sql      # Complete database dump
#   - backups/full-backup-latest.sql               # Symlink to latest backup
#   - backups/full-backup-YYYYMMDD_HHMMSS.sql.gz   # Compressed backup

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full-backup-${TIMESTAMP}.sql"
LATEST_LINK="$BACKUP_DIR/full-backup-latest.sql"

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "💾 Philosophizer Complete Database Backup"
echo "=========================================="
echo ""

# Parse command line arguments
MODE="local"
REMOTE_URL=""

if [ "$1" = "--remote" ]; then
  MODE="remote"
  REMOTE_URL="$2"
  
  if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: --remote requires DATABASE_URL"
    echo "   Usage: $0 --remote postgresql://user:pass@host:port/db"
    exit 1
  fi
fi

# Perform backup based on mode
if [ "$MODE" = "local" ]; then
  echo "📍 Mode: Local Docker database"
  echo ""
  
  # Check if PostgreSQL container is running
  if ! docker compose ps postgres | grep -q "Up"; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "   Run: docker compose up -d postgres"
    exit 1
  fi
  
  DB_CONTAINER="philosophizer-postgres"
  DB_NAME="${POSTGRES_DB:-philosophizer}"
  DB_USER="${POSTGRES_USER:-postgres}"
  
  echo "💾 Creating backup..."
  docker compose exec -T postgres pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE"
  
else
  echo "📍 Mode: Remote database"
  echo "🔗 URL: ${REMOTE_URL%%@*}@***" # Hide password in output
  echo ""
  
  # Check if pg_dump is available
  if ! command -v pg_dump &> /dev/null; then
    echo "❌ Error: pg_dump not found"
    echo "   Install PostgreSQL client tools:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt install postgresql-client"
    exit 1
  fi
  
  echo "💾 Creating backup..."
  pg_dump "$REMOTE_URL" \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE"
fi

if [ $? -ne 0 ]; then
  echo "❌ Backup failed"
  exit 1
fi

# Compress the backup
echo "🗜️  Compressing backup..."
gzip -c "$BACKUP_FILE" > "${BACKUP_FILE}.gz"

# Update latest symlink
rm -f "$LATEST_LINK"
ln -s "$(basename "$BACKUP_FILE")" "$LATEST_LINK"

# Get file sizes
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)

echo ""
echo "✅ Backup complete!"
echo ""
echo "📁 Files created:"
echo "   $BACKUP_FILE ($BACKUP_SIZE)"
echo "   ${BACKUP_FILE}.gz ($COMPRESSED_SIZE)"
echo "   $LATEST_LINK → $(basename "$BACKUP_FILE")"
echo ""

# Get statistics
if [ "$MODE" = "local" ]; then
  echo "📊 Database statistics:"
  docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as columns,
  COALESCE(
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = t.tablename),
    0
  ) as rows
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
else
  echo "📊 Database statistics:"
  psql "$REMOTE_URL" -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as columns,
  COALESCE(
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = t.tablename),
    0
  ) as rows
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Review: head -50 $BACKUP_FILE"
echo "   2. Restore: ./scripts/restore-database.sh $BACKUP_FILE"
echo "   3. Upload to cloud storage (recommended)"
echo ""
echo "💡 Recommended: Set up automated backups"
echo "   - Add to cron: 0 2 * * * $0 --remote \$DATABASE_URL"
echo "   - Store backups in S3/B2/Dropbox"
echo ""

