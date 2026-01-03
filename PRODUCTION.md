# Production Deployment Guide

## 🔒 Security: Handling Secrets in Production

### Critical Security Requirements

**NEVER** use default secrets in production! The following must be changed:

- `JWT_SECRET` - Used to sign authentication tokens
- `POSTGRES_PASSWORD` - Database password

### Step 1: Generate Strong Secrets

Use these commands to generate cryptographically secure secrets:

```bash
# Generate JWT secret (64 bytes, base64 encoded)
openssl rand -base64 64

# Generate PostgreSQL password (32 bytes)
openssl rand -base64 32
```

### Step 2: Create Production Environment File

Create a `.env` file in the project root (this file is gitignored):

```bash
# Copy the example file
cp .env.example .env

# Edit with your generated secrets
nano .env  # or vim, code, etc.
```

**Example production `.env`:**

```bash
# Database
POSTGRES_DB=philosophizer
POSTGRES_USER=postgres
POSTGRES_PASSWORD=xK9mP2vN8qL5wR7tY3bH6jF4sA1dG0zC9m  # Generated secret
POSTGRES_PORT=5432

# JWT Authentication
JWT_SECRET=vR8kM3nP5qW2tY7bL9xZ4cF1hJ6gS0aK3mN8pQ5wT2yB7lX9zC4fH1jG6sA0dM3n  # Generated secret
JWT_EXPIRES_IN=7d

# Application
NODE_ENV=production
PORT=1738

# LLM Configuration (Ollama on DGX)
AI_BASE_URL=http://ollama:11434/v1
LLM_MODEL=qwen2.5:1.5b-instruct
SEARCH_MODEL=qwen2.5:1.5b-instruct
AI_API_KEY=ollama
OPENAI_API_KEY=ollama

# Embeddings (Ollama on DGX)
EMBEDDING_BASE_URL=http://ollama:11434/v1
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_API_KEY=ollama

# Ollama GPU Configuration
OLLAMA_NUM_PARALLEL=8
OLLAMA_NUM_GPU=1
OLLAMA_GPU_COUNT=all
OLLAMA_MAX_VRAM=0.9
OLLAMA_PORT=11434
```

### Step 3: Production Deployment Options

#### Option A: Using `.env` File (Simplest)

Docker Compose automatically loads `.env` from the project directory:

```bash
# The .env file in the same directory as docker-compose.yml is automatically loaded
docker compose up -d
```

**Security checklist:**
- ✅ Ensure `.env` is in `.gitignore`
- ✅ Set file permissions: `chmod 600 .env`
- ✅ Never commit `.env` to version control
- ✅ Use different secrets for each environment (dev, staging, prod)

#### Option B: Docker Secrets (Recommended for Swarm/Production)

For Docker Swarm or production clusters:

```bash
# Create secrets
echo "your-jwt-secret-here" | docker secret create jwt_secret -
echo "your-postgres-password-here" | docker secret create postgres_password -

# Update docker-compose.yml to use secrets
```

**docker-compose.secrets.yml:**

```yaml
services:
  postgres:
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
    secrets:
      - postgres_password

  app:
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
    secrets:
      - jwt_secret
      - postgres_password

secrets:
  jwt_secret:
    external: true
  postgres_password:
    external: true
```

#### Option C: Environment Variables (CI/CD)

For automated deployments:

```bash
# Set environment variables before running docker compose
export JWT_SECRET="$(openssl rand -base64 64)"
export POSTGRES_PASSWORD="$(openssl rand -base64 32)"

docker compose up -d
```

#### Option D: Secrets Management System (Enterprise)

For enterprise deployments, integrate with:

- **HashiCorp Vault** - Centralized secrets management
- **AWS Secrets Manager** - For AWS deployments
- **Azure Key Vault** - For Azure deployments
- **Google Secret Manager** - For GCP deployments

### Step 4: Verify Security

Before deploying to production, verify:

```bash
# Check that .env is not in git
git status  # Should not show .env

# Verify secrets are set
docker compose config | grep -A 5 "JWT_SECRET"  # Should show your secret

# Check file permissions
ls -la .env  # Should show -rw------- (600)
```

## 🚀 DGX Deployment

### Prerequisites

1. **NVIDIA Container Toolkit** installed:
```bash
# Verify GPU access in Docker
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi
```

2. **Secrets configured** (see above)

3. **DGX network access** configured

### Deployment Steps

```bash
# 1. Copy files to DGX
scp -r philosophizer/ user@dgx-server:/path/to/deployment/

# 2. SSH to DGX
ssh user@dgx-server

# 3. Navigate to project
cd /path/to/deployment/philosophizer

# 4. Create .env file with production secrets
nano .env  # Add your generated secrets

# 5. Use the DGX-optimized compose file
docker compose -f docker-compose.dgx.yml up -d

# 6. Monitor startup
docker compose logs -f

# 7. Wait for models to download
docker compose logs -f ollama-pull-embeddings
docker compose logs -f ollama-pull-qwen

# 8. Verify GPU usage
nvidia-smi

# 9. Test the application
curl http://localhost:1738/health
```

### Post-Deployment

```bash
# Monitor GPU utilization
nvidia-smi dmon -s u

# View application logs
docker compose logs -f app

# Check concurrent connections
docker compose logs app | grep "concurrent"
```

## 🔐 Security Best Practices

### 1. Network Security

```yaml
# In docker-compose.yml, create isolated network
networks:
  philosophizer-net:
    driver: bridge

services:
  postgres:
    networks:
      - philosophizer-net
    # Don't expose port 5432 to host if not needed
    # Comment out the ports section
```

### 2. Regular Updates

```bash
# Update base images
docker compose pull

# Rebuild with latest dependencies
docker compose up -d --build
```

### 3. Backup Secrets

Store encrypted backups of production secrets in a secure location:

```bash
# Encrypt .env file for backup
gpg --symmetric --cipher-algo AES256 .env
# Creates: .env.gpg

# Decrypt when needed
gpg --decrypt .env.gpg > .env
```

### 4. Rotate Secrets Regularly

Generate new secrets every 90 days:

```bash
# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)

# Update .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env

# Restart services
docker compose restart app
```

## 📊 Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:1738/health

# Database health
docker compose exec postgres pg_isready

# Ollama health
curl http://localhost:11434/api/tags
```

### GPU Monitoring

```bash
# Real-time GPU utilization
watch -n 1 nvidia-smi

# GPU memory usage
nvidia-smi --query-gpu=memory.used,memory.total --format=csv

# Process monitoring
nvidia-smi pmon
```

## 🆘 Troubleshooting

### Forgot to Change Secrets

If you deployed with default secrets:

```bash
# 1. Generate new secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
NEW_POSTGRES_PASSWORD=$(openssl rand -base64 32)

# 2. Update .env file
nano .env

# 3. Stop services
docker compose down

# 4. Remove old database volume (WARNING: deletes data)
docker volume rm philosophizer-postgres-data

# 5. Restart with new secrets
docker compose up -d
```

### Secret Not Loading

```bash
# Check if .env exists
ls -la .env

# Verify docker compose can read it
docker compose config

# Check permissions
chmod 600 .env
```

## 📝 Checklist Before Production

- [ ] Generated strong JWT_SECRET (64+ bytes)
- [ ] Generated strong POSTGRES_PASSWORD (32+ bytes)
- [ ] Created `.env` file with production values
- [ ] Verified `.env` is in `.gitignore`
- [ ] Set `.env` file permissions to 600
- [ ] Tested deployment in staging environment
- [ ] Configured appropriate OLLAMA_NUM_PARALLEL for your GPU
- [ ] Set up monitoring and logging
- [ ] Configured backup strategy
- [ ] Documented secrets backup location
- [ ] Set up SSL/TLS for public endpoints (if applicable)
- [ ] Configured firewall rules
- [ ] Set up regular secret rotation schedule

