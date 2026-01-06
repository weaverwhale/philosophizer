#!/bin/bash
#
# Restore complete database backup for Philosophizer
# Restores ALL tables including users, conversations, and vector data
#
# Usage:
#   ./scripts/restore-database.sh <backup-file> [--remote DATABASE_URL]
#
# Examples:
#   ./scripts/restore-database.sh backups/full-backup-latest.sql                    # Restore to local Docker
#   ./scripts/restore-database.sh backups/full-backup-latest.sql --remote $DB_URL   # Restore to remote
#
# WARNING: This will REPLACE ALL DATA in the target database!

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📥 Philosophizer Complete Database Restore"
echo "==========================================="
echo ""

# Parse command line arguments
BACKUP_FILE="$1"
MODE="local"
REMOTE_URL=""

if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file required"
  echo "   Usage: $0 <backup-file> [--remote DATABASE_URL]"
  echo ""
  echo "Available backups:"
  ls -lh "$PROJECT_ROOT/backups/"*.sql 2>/dev/null || echo "   (no backups found)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [ "$2" = "--remote" ]; then
  MODE="remote"
  REMOTE_URL="$3"
  
  if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: --remote requires DATABASE_URL"
    echo "   Usage: $0 <backup-file> --remote postgresql://user:pass@host:port/db"
    exit 1
  fi
fi

# Show backup info
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$BACKUP_FILE" 2>/dev/null || stat -c "%y" "$BACKUP_FILE" 2>/dev/null | cut -d. -f1)

echo "📁 Backup file: $BACKUP_FILE"
echo "📊 Size: $BACKUP_SIZE"
echo "📅 Created: $BACKUP_DATE"
echo ""

if [ "$MODE" = "local" ]; then
  echo "📍 Target: Local Docker database"
else
  echo "📍 Target: Remote database"
  echo "🔗 URL: ${REMOTE_URL%%@*}@***" # Hide password
fi

echo ""
echo "⚠️  WARNING: This will REPLACE ALL DATA in the target database!"
echo "⚠️  All users, conversations, and messages will be overwritten!"
echo ""
read -p "Are you absolutely sure? Type 'yes' to continue: " -r
echo ""

if [ "$REPLY" != "yes" ]; then
  echo "Cancelled"
  exit 0
fi

# Perform restore based on mode
if [ "$MODE" = "local" ]; then
  # Check if PostgreSQL container is running
  if ! docker compose ps postgres | grep -q "Up"; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "   Run: docker compose up -d postgres"
    exit 1
  fi
  
  DB_CONTAINER="philosophizer-postgres"
  DB_NAME="${POSTGRES_DB:-philosophizer}"
  DB_USER="${POSTGRES_USER:-postgres}"
  
  echo "💾 Restoring backup..."
  docker compose exec -T postgres psql -U "$DB_USER" -d postgres < "$BACKUP_FILE"
  
else
  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found"
    echo "   Install PostgreSQL client tools:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt install postgresql-client"
    exit 1
  fi
  
  echo "💾 Restoring backup..."
  psql "$REMOTE_URL" < "$BACKUP_FILE"
fi

if [ $? -ne 0 ]; then
  echo "❌ Restore failed"
  exit 1
fi

echo ""
echo "✅ Restore complete!"
echo ""

# Get statistics
if [ "$MODE" = "local" ]; then
  echo "📊 Restored database statistics:"
  docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  tablename,
  COALESCE(
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = t.tablename),
    0
  ) as rows
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
"
else
  echo "📊 Restored database statistics:"
  psql "$REMOTE_URL" -c "
SELECT 
  tablename,
  COALESCE(
    (SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = t.tablename),
    0
  ) as rows
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
"
fi

echo ""
echo "🎉 Database restored successfully!"
echo ""

