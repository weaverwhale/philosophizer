# 🚀 Automated Docker Deployment

## Zero-Configuration Deployment

The DGX docker-compose configuration now **automatically generates and manages secrets** for you!

## Quick Start (Literally One Command!)

```bash
# That's it! Just deploy
docker compose -f docker-compose.dgx.yml up -d
```

On first run:

1. ✅ Secrets are automatically generated using cryptographically secure methods
2. ✅ Secrets are persisted in a Docker volume
3. ✅ Application starts with secure configuration
4. ✅ Models are downloaded automatically
5. ✅ Database is initialized

**No manual secret generation needed!** 🎉

## How It Works

### Automatic Secret Generation

The Docker entrypoint script (`scripts/docker-entrypoint.sh`) runs before your app starts:

```
Container Start
    ↓
Check for secrets in /app/secrets/.secrets
    ↓
┌─────────────────────┬──────────────────────┐
│ Secrets exist?      │ No secrets found?    │
│ → Load and use them │ → Generate new ones  │
│                     │ → Save to volume     │
└─────────────────────┴──────────────────────┘
    ↓
Start application with secure secrets
```

### Secrets Persistence

Secrets are stored in a named Docker volume: `philosophizer-app-secrets`

```
philosophizer-app-secrets (Docker Volume)
    └── .secrets
        ├── JWT_SECRET=<64 chars>
        └── POSTGRES_PASSWORD=<32 chars>
```

This volume persists across:

- Container restarts
- Container rebuilds
- Docker Compose down/up cycles

## Viewing Auto-Generated Secrets

```bash
# View the generated secrets
docker compose exec app cat /app/secrets/.secrets

# Example output:
# Auto-generated secrets - DO NOT EDIT MANUALLY
# Generated: 2024-01-03 12:34:56 UTC
# JWT_SECRET=abc123...xyz789
# POSTGRES_PASSWORD=def456...uvw012
```

## Manual Override (Optional)

If you prefer to set your own secrets, create a `.env` file:

```bash
# Generate your own secrets
./scripts/generate-secrets.sh

# Or manually
echo "JWT_SECRET=$(openssl rand -base64 64)" > .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env
```

**Priority:** `.env` file secrets > Auto-generated secrets

## Backup & Restore

### Backup Secrets Volume

```bash
# Backup secrets to tar.gz
docker run --rm \
  -v philosophizer-app-secrets:/secrets \
  -v $(pwd):/backup \
  alpine tar czf /backup/secrets-backup.tar.gz -C /secrets .

# Encrypt the backup (recommended)
gpg --symmetric --cipher-algo AES256 secrets-backup.tar.gz
```

### Restore Secrets

```bash
# Decrypt (if encrypted)
gpg --decrypt secrets-backup.tar.gz.gpg > secrets-backup.tar.gz

# Restore to volume
docker run --rm \
  -v philosophizer-app-secrets:/secrets \
  -v $(pwd):/backup \
  alpine tar xzf /backup/secrets-backup.tar.gz -C /secrets

# Restart app
docker compose restart app
```

## Migration Scenarios

### Scenario 1: First Time Deployment (DGX)

```bash
# Clone repo on DGX
git clone <repo> && cd philosophizer

# Just deploy - secrets auto-generated!
docker compose -f docker-compose.dgx.yml up -d

# Check logs
docker compose logs -f app
```

### Scenario 2: Moving to New Server

```bash
# On old server: Backup secrets
docker run --rm \
  -v philosophizer-app-secrets:/secrets \
  -v $(pwd):/backup \
  alpine tar czf /backup/secrets-backup.tar.gz -C /secrets .

# Transfer to new server
scp secrets-backup.tar.gz user@new-server:/path/

# On new server: Deploy and restore
cd /path/to/philosophizer
docker compose -f docker-compose.dgx.yml up -d --remove-orphans

# Wait for startup, then stop
docker compose stop app

# Restore secrets
docker run --rm \
  -v philosophizer-app-secrets:/secrets \
  -v $(pwd):/backup \
  alpine tar xzf /backup/secrets-backup.tar.gz -C /secrets

# Restart with restored secrets
docker compose start app
```

### Scenario 3: Rotating Secrets

```bash
# Stop app
docker compose stop app

# Remove old secrets
docker volume rm philosophizer-app-secrets

# Create new volume (will trigger regeneration)
docker compose up -d app

# Or manually set new secrets in .env and restart
```

## Environment Variable Precedence

1. **.env file** (highest priority)
2. **Environment variables** passed to docker compose
3. **Auto-generated secrets** in volume
4. **Defaults** in docker-compose.yml (lowest priority)

## Security Features

✅ **Automatic Generation**: Uses OpenSSL for cryptographic randomness
✅ **Persistence**: Secrets survive restarts and rebuilds
✅ **Isolation**: Secrets stored in dedicated volume
✅ **Non-root**: App runs as non-root user (bunjs:nodejs)
✅ **Secure Permissions**: Secrets file is chmod 600
✅ **No Defaults**: No weak default passwords in production

## Comparison: Before vs After

### Before (Manual)

```bash
# Step 1: Generate secrets
./scripts/generate-secrets.sh

# Step 2: Review .env
nano .env

# Step 3: Deploy
docker compose up -d

# Issue: Forgot to generate? App fails to start!
```

### After (Automated)

```bash
# One command - done!
docker compose -f docker-compose.dgx.yml up -d

# Secrets automatically handled ✨
```

## Monitoring

### Check Secret Generation Logs

```bash
# View entrypoint logs
docker compose logs app | grep -A 10 "Initializing secrets"

# Example output:
# [INFO] Initializing secrets...
# [WARN] No secrets found, generating new ones...
# [SUCCESS] Secrets generated and saved to /app/secrets/.secrets
# [INFO] JWT_SECRET: abc12345...xyz78901 (88 chars)
# [INFO] POSTGRES_PASSWORD: def456...uvw012 (44 chars)
```

### Verify Secrets Are Loaded

```bash
# Check environment (secrets will be masked)
docker compose exec app env | grep SECRET

# Check secrets file directly
docker compose exec app cat /app/secrets/.secrets
```

## FAQ

**Q: Are auto-generated secrets secure?**
A: Yes! They use `openssl rand -base64` which is cryptographically secure.

**Q: Can I use my own secrets?**
A: Yes! Create a `.env` file - it takes priority over auto-generated secrets.

**Q: What if I lose the secrets volume?**
A: Without a backup, you'll need to regenerate secrets. Users will need to re-authenticate, and you'll lose access to the old database password.

**Q: Should I backup the secrets volume?**
A: **YES!** Encrypt and store backups securely for disaster recovery.

**Q: Can I see the secrets in plain text?**
A: Yes: `docker compose exec app cat /app/secrets/.secrets`

**Q: Do I need the .env.example file?**
A: It's helpful for reference, but not required for automated deployment.

## Best Practices

1. **Backup secrets volume** before major changes
2. **Encrypt backups** using GPG or similar
3. **Test restore procedure** in staging environment
4. **Document secret location** for your team
5. **Rotate secrets** every 90 days
6. **Use .env file** for sensitive production deployments
7. **Never commit** secrets to git

## Advanced: Using Secrets Management Systems

While auto-generation works great, you can still integrate with enterprise secret managers:

### HashiCorp Vault

```bash
# Fetch from Vault
export JWT_SECRET=$(vault kv get -field=jwt_secret secret/philosophizer)
export POSTGRES_PASSWORD=$(vault kv get -field=postgres_password secret/philosophizer)

docker compose up -d
```

### AWS Secrets Manager

```bash
# Fetch from AWS
export JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id philosophizer/jwt --query SecretString --output text)
export POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value --secret-id philosophizer/postgres --query SecretString --output text)

docker compose up -d
```

---

**TL;DR**: Just run `docker compose -f docker-compose.dgx.yml up -d` and everything is handled for you! 🎉
