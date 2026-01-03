# 🔐 Production Secrets - Quick Reference

## Critical Security Issue

The `docker-compose.dgx.yml` file now **requires** production secrets to be set in the `.env` file. It will **fail to start** if you haven't configured them properly.

## Quick Setup (30 seconds)

```bash
# 1. Generate secrets automatically
./scripts/generate-secrets.sh

# 2. Deploy
docker compose -f docker-compose.dgx.yml up -d
```

That's it! The script will:
- Generate cryptographically secure secrets
- Create/update your `.env` file
- Set proper file permissions (600)
- Backup existing `.env` if present

## Manual Setup (if preferred)

```bash
# Generate JWT secret (64 bytes)
openssl rand -base64 64

# Generate PostgreSQL password (32 bytes)
openssl rand -base64 32

# Copy to .env file
cp .env.example .env
nano .env  # Add your generated secrets

# Secure the file
chmod 600 .env
```

## What Changed?

### Before (INSECURE ❌)
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET:-change-this-in-production}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
```
- Had default fallback values
- Would work without .env file
- **Security risk in production!**

### After (SECURE ✅)
```yaml
environment:
  # SECURITY: Must be set in .env file!
  - JWT_SECRET=${JWT_SECRET:?JWT_SECRET must be set in .env file}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set in .env file}
```
- **Requires** secrets to be set
- **Fails immediately** if missing
- Forces you to generate proper secrets

## Error Messages

### If you forget to set secrets:

```
Error: JWT_SECRET must be set in .env file
```

**Solution:** Run `./scripts/generate-secrets.sh`

### If .env file is missing:

```
Error: POSTGRES_PASSWORD must be set in .env file
```

**Solution:** Run `./scripts/generate-secrets.sh` or copy `.env.example` to `.env`

## Environment Variables Required

| Variable | Purpose | How to Generate |
|----------|---------|-----------------|
| `JWT_SECRET` | Signs authentication tokens | `openssl rand -base64 64` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 32` |

## Files

| File | Purpose | Committed to Git? |
|------|---------|-------------------|
| `.env.example` | Template with placeholders | ✅ Yes |
| `.env` | Your actual secrets | ❌ **Never!** |
| `PRODUCTION.md` | Detailed security guide | ✅ Yes |
| `scripts/generate-secrets.sh` | Auto-generate secrets | ✅ Yes |

## Verify Your Setup

```bash
# Check .env exists and has secrets
cat .env | grep JWT_SECRET

# Check file permissions (should be -rw-------)
ls -la .env

# Test docker compose can read it
docker compose -f docker-compose.dgx.yml config | grep JWT_SECRET

# Start services
docker compose -f docker-compose.dgx.yml up -d
```

## Security Best Practices

✅ **DO:**
- Use `./scripts/generate-secrets.sh` for production
- Keep `.env` file out of version control (already in `.gitignore`)
- Use different secrets for dev/staging/production
- Rotate secrets every 90 days
- Backup `.env` securely (encrypted)

❌ **DON'T:**
- Commit `.env` to git
- Share secrets in Slack/email/chat
- Use the same secrets across environments
- Use weak or predictable passwords
- Leave default values in production

## Need Help?

- **Quick start:** Run `./scripts/generate-secrets.sh`
- **Detailed guide:** Read `PRODUCTION.md`
- **Generate manually:** `openssl rand -base64 64`

## DGX Deployment Commands

```bash
# On your local machine
scp -r . user@dgx-server:/path/to/deployment/

# SSH to DGX
ssh user@dgx-server
cd /path/to/deployment

# Generate secrets on DGX
./scripts/generate-secrets.sh

# Deploy with GPU support
docker compose -f docker-compose.dgx.yml up -d

# Monitor
docker compose logs -f
nvidia-smi dmon -s u
```

---

**Remember:** The DGX docker-compose file will now **fail to start** without proper secrets. This is intentional for security! 🔒

