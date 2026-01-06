# 💾 Database Backup Guide

## Overview

Your database contains **5 critical tables** that need to be backed up:

- `users` - All user accounts
- `conversations` - Chat history
- `conversation_messages` - All messages
- `philosopher_text_chunks` - Vector embeddings
- `magic_links` - Auth tokens

**Without backups, if you lose your instance, all data is gone forever.**

This guide sets up **automated, free backups** using GitHub Actions.

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Add GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your database connection string
5. Click **Add secret**

**Where to get DATABASE_URL:**

- **Railway:** Dashboard → Postgres → Connect → Connection String URL
- **Fly.io:** `fly postgres connect -a your-postgres-app`
- **Render:** Dashboard → Postgres → External Database URL

### Step 2: Enable Backups

```bash
# The workflow file is already in .github/workflows/backup.yml
# Just push it to GitHub:
git add .github/workflows/backup.yml
git commit -m "Enable automated database backups"
git push
```

### Step 3: Test It

1. Go to your GitHub repo → **Actions** tab
2. Click **Database Backup** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait ~1 minute
5. ✅ Green checkmark = success!

**That's it!** Your database now backs up automatically every day at 2 AM UTC.

---

## 📦 What You Get

- ✅ **Automated daily backups** at 2 AM UTC
- ✅ **90-day retention** (GitHub Artifacts)
- ✅ **30 backups kept** at any time (oldest deleted automatically)
- ✅ **100% free** (GitHub Actions + Artifacts)
- ✅ **Email notifications** if backups fail
- ✅ **Manual trigger** available anytime

**Cost:** $0.00 forever

---

## 📥 Download a Backup

### From GitHub Actions

1. Go to **Actions** tab
2. Click **Database Backup** workflow
3. Click on any successful run (green checkmark)
4. Scroll down to **Artifacts** section
5. Click `database-backup-XXX` to download
6. Extract: `unzip database-backup-XXX.zip`
7. Decompress: `gunzip backup-YYYYMMDD_HHMMSS.sql.gz`

### Using GitHub CLI (Optional)

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Download latest backup
gh run download --repo owner/repo
```

---

## 🔄 Restore a Backup

### Restore to Local Database (Testing)

```bash
# 1. Download and extract backup from GitHub Actions
gunzip backup-20260106_020000.sql.gz

# 2. Make sure local database is running
docker compose up -d postgres

# 3. Restore
./scripts/restore-database.sh backup-20260106_020000.sql
```

### Restore to Production

```bash
# 1. Download and extract backup from GitHub Actions
gunzip backup-20260106_020000.sql.gz

# 2. Restore (⚠️ WARNING: This replaces ALL data!)
./scripts/restore-database.sh backup-20260106_020000.sql --remote "$DATABASE_URL"
```

### Disaster Recovery (Lost Instance)

If you accidentally delete your instance:

```bash
# 1. Create new database instance
# 2. Get the new DATABASE_URL
# 3. Download latest backup from GitHub Actions
# 4. Extract and decompress
gunzip backup-latest.sql.gz

# 5. Restore to new database
./scripts/restore-database.sh backup-latest.sql --remote "$NEW_DATABASE_URL"

# ✅ All users, conversations, and data restored!
```

---

## 🛠️ Manual Backups

You can also create backups manually anytime:

### Backup Local Database

```bash
# Backup your local Docker database
bun run backup:local

# Backups saved to: backups/full-backup-YYYYMMDD_HHMMSS.sql
ls -lh backups/
```

### Backup Production Database

```bash
# Set your DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Create backup
bun run backup:remote

# Or use the script directly
./scripts/backup-database.sh --remote "$DATABASE_URL"
```

---

## 📅 Backup Schedule

| Event                | Frequency         | Retention    |
| -------------------- | ----------------- | ------------ |
| Automated backup     | Daily at 2 AM UTC | 90 days      |
| Maximum backups kept | 30 most recent    | Auto-cleanup |
| Manual backup        | Anytime           | On-demand    |

### Change Backup Schedule

Edit `.github/workflows/backup.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC (current)
    # - cron: '0 */6 * * *'  # Every 6 hours
    # - cron: '0 0 * * 0'    # Weekly on Sunday
```

---

## 🔍 Monitor Backups

### Check Status

1. Go to **Actions** tab in GitHub
2. Look for green checkmarks ✅
3. Red ❌ means failure (you'll get an email)

### View All Backups

1. **Actions** → **Database Backup** workflow
2. Each successful run = one backup
3. Click any run → **Artifacts** to download

### Test Backups Monthly

```bash
# Download a backup and restore to local database
# This verifies backups are working correctly
docker compose up -d postgres
./scripts/restore-database.sh backup-latest.sql

# Check data is there
docker compose exec postgres psql -U postgres -d philosophizer -c "SELECT COUNT(*) FROM users;"
```

---

## 📊 Backup Contents

Each backup includes:

```sql
-- Database schema
CREATE TABLE users ...
CREATE TABLE conversations ...
CREATE TABLE conversation_messages ...
CREATE TABLE philosopher_text_chunks ...
CREATE TABLE magic_links ...

-- All data (compressed)
INSERT INTO users VALUES ...
INSERT INTO conversations VALUES ...
-- etc.
```

**Typical backup size:** 1-50MB compressed (depending on usage)

---

## ❓ FAQ

**Q: How much does this cost?**  
A: **$0.00** - Completely free! GitHub Actions gives you 2000 minutes/month free, and each backup takes ~1 minute.

**Q: What if GitHub Actions fails?**  
A: You'll get an email notification. Check the logs in the Actions tab and re-run manually.

**Q: Can I backup more frequently?**  
A: Yes! Edit the cron schedule in `.github/workflows/backup.yml` (e.g., `0 */6 * * *` for every 6 hours).

**Q: Are backups encrypted?**  
A: GitHub Artifacts are private to your repository. Only people with repo access can download them.

**Q: How long are backups kept?**  
A: **90 days** with automatic cleanup. The system keeps the **30 most recent backups** and deletes older ones.

**Q: What if I need backups older than 90 days?**  
A: Download important backups periodically and store them locally or in your own cloud storage (Dropbox, Google Drive, etc.).

**Q: Can I backup while the app is running?**  
A: Yes! PostgreSQL backups are non-blocking and don't affect your running application.

**Q: What if my database is too large for GitHub Artifacts?**  
A: GitHub Artifacts support up to 2GB per file. If your database exceeds this, you'll need to use external cloud storage.

---

## 🎯 Best Practices

1. ✅ **Test restore monthly** - Verify backups work by restoring to local database
2. ✅ **Download important backups** - Periodically download and store critical backups locally
3. ✅ **Monitor backup status** - Check Actions tab weekly for green checkmarks
4. ✅ **Backup before major changes** - Run manual backup before deploying big updates
5. ✅ **Document recovery procedures** - Make sure your team knows how to restore

---

## 🆘 Troubleshooting

### Backup Failed

1. Check the error logs in Actions tab
2. Verify `DATABASE_URL` secret is correct
3. Test connection: `psql "$DATABASE_URL" -c "SELECT 1;"`
4. Re-run manually from Actions tab

### Can't Download Backup

1. Make sure you're logged into GitHub
2. Check that the workflow run succeeded (green checkmark)
3. Artifacts appear at the bottom of the run page
4. Artifacts expire after 90 days

### Restore Failed

1. Check that the backup file is valid: `gunzip -t backup.sql.gz`
2. Verify DATABASE_URL is correct
3. Make sure target database exists
4. Check PostgreSQL client is installed: `pg_dump --version`

---

## 📝 Quick Reference

```bash
# Setup (one time)
# 1. Add DATABASE_URL secret to GitHub
# 2. Push workflow file
git add .github/workflows/backup.yml && git commit -m "Add backups" && git push

# Manual backups
bun run backup:local                    # Backup local database
bun run backup:remote                   # Backup production database

# Restore
./scripts/restore-database.sh <file>                      # Restore local
./scripts/restore-database.sh <file> --remote $DB_URL    # Restore production

# Download from GitHub
# Actions → Database Backup → Select run → Artifacts → Download
```

---

## 🎉 Summary

You now have:

- ✅ **Automated daily backups** running in the cloud
- ✅ **90 days of backup history** (30 backups kept)
- ✅ **Zero cost** forever
- ✅ **Easy restore** process
- ✅ **Peace of mind** knowing your data is safe

**Your data is protected!** 😴

---

## 📚 Related Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment and secret management
- **[PRODUCTION.md](PRODUCTION.md)** - Production security best practices
- **[SETUP.md](SETUP.md)** - Initial setup and configuration
