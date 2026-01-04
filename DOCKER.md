# Docker Compose Configuration Guide

This project includes multiple Docker Compose configurations optimized for different deployment scenarios.

## Configuration Files Overview

| File                     | Use Case              | Hardware                   | Auto-Secrets | GPU Support      |
| ------------------------ | --------------------- | -------------------------- | ------------ | ---------------- |
| `docker-compose.yml`     | **Local Development** | Laptop/Desktop             | ❌           | ❌               |
| `docker-compose.gpu.yml` | **Production (GPU)**  | Any GPU Server/Workstation | ✅           | ✅               |
| `docker-compose.dgx.yml` | **NVIDIA DGX**        | DGX Systems                | ✅           | ✅ DGX-Optimized |

## Which Configuration Should I Use?

### 🖥️ Local Development (`docker-compose.yml`)

**Best for:** Development on your local machine

**Hardware:** Any laptop or desktop (no GPU required)

**Features:**

- Uses LM Studio on host machine for models
- No GPU required
- Fast startup
- Easy debugging

**Usage:**

```bash
# Start LM Studio on host first
docker compose up -d
```

---

### 🚀 Production with GPU (`docker-compose.gpu.yml`)

**Best for:** Production deployments on any GPU-enabled machine

**Hardware:**

- Workstations (RTX 3090, 4090, A6000, etc.)
- Cloud GPU instances (AWS p3/p4, GCP A100, Azure NC series)
- Servers with NVIDIA GPUs
- Gaming rigs with 8GB+ VRAM

**Features:**

- ✅ Automated secret generation
- ✅ GPU acceleration with Ollama
- ✅ Configurable for different GPU sizes
- ✅ Concurrent connection handling
- ✅ Works on any NVIDIA GPU setup

**Usage:**

```bash
docker compose -f docker-compose.gpu.yml up -d
```

**Configuration (.env file):**

```bash
# Adjust based on your GPU memory
OLLAMA_NUM_PARALLEL=8        # Concurrent requests (lower for smaller GPUs)
OLLAMA_NUM_GPU=1             # Number of GPUs to use
LLM_MODEL=qwen2.5:1.5b-instruct  # Or larger model if you have VRAM
```

---

### 🏢 NVIDIA DGX Systems (`docker-compose.dgx.yml`)

**Best for:** Large-scale production on NVIDIA DGX infrastructure

**Hardware:**

- NVIDIA DGX A100
- NVIDIA DGX H100
- NVIDIA DGX Station

**Features:**

- ✅ All features from `docker-compose.gpu.yml`
- ✅ Optimized for DGX multi-GPU architecture
- ✅ Higher default concurrency settings
- ✅ Advanced GPU memory management
- ✅ Enterprise-grade configuration

**Usage:**

```bash
docker compose -f docker-compose.dgx.yml up -d
```

**Configuration (.env file):**

```bash
# DGX-optimized defaults
OLLAMA_NUM_PARALLEL=12       # Higher for DGX GPUs
OLLAMA_NUM_GPU=99            # Use all available GPUs
OLLAMA_GPU_COUNT=all         # Docker: use all GPUs
```

## Quick Decision Tree

```
Do you have an NVIDIA GPU?
    ↓
    NO → Use docker-compose.yml (development)
    ↓
    YES → Production or Development?
        ↓
        Development → docker-compose.yml (with LM Studio)
        ↓
        Production → What hardware?
            ↓
            DGX System → docker-compose.dgx.yml
            ↓
            Other GPU Server/Workstation → docker-compose.gpu.yml
```

## GPU Memory Requirements

### Minimum Configuration

- **8GB VRAM**: qwen2.5:1.5b + nomic-embed-text
- **Concurrent requests**: 2-4

### Recommended Configuration

- **16GB+ VRAM**: qwen2.5:3b + nomic-embed-text
- **Concurrent requests**: 4-8

### High-Performance Configuration

- **24GB+ VRAM**: qwen2.5:7b or mistral:7b + nomic-embed-text
- **Concurrent requests**: 8-12

### Enterprise Configuration (DGX)

- **40GB+ VRAM**: Multiple large models
- **Concurrent requests**: 12-16+

## Configuration Examples

### Example 1: RTX 4090 (24GB)

**File:** `docker-compose.gpu.yml`

**.env:**

```bash
OLLAMA_NUM_PARALLEL=8
OLLAMA_NUM_GPU=1
LLM_MODEL=qwen2.5:7b-instruct
EMBEDDING_MODEL=nomic-embed-text
```

### Example 2: AWS p3.2xlarge (V100 16GB)

**File:** `docker-compose.gpu.yml`

**.env:**

```bash
OLLAMA_NUM_PARALLEL=4
OLLAMA_NUM_GPU=1
LLM_MODEL=qwen2.5:3b-instruct
EMBEDDING_MODEL=nomic-embed-text
```

### Example 3: DGX A100 (80GB)

**File:** `docker-compose.dgx.yml`

**.env:**

```bash
OLLAMA_NUM_PARALLEL=16
OLLAMA_NUM_GPU=1
OLLAMA_GPU_COUNT=all
LLM_MODEL=qwen2.5:7b-instruct
EMBEDDING_MODEL=nomic-embed-text
```

### Example 4: Multi-GPU Workstation (2x RTX 3090)

**File:** `docker-compose.gpu.yml`

**.env:**

```bash
OLLAMA_NUM_PARALLEL=10
OLLAMA_NUM_GPU=2
OLLAMA_GPU_COUNT=2
LLM_MODEL=qwen2.5:3b-instruct
EMBEDDING_MODEL=nomic-embed-text
```

### Example 5: Small GPU Server (GTX 1080 Ti 11GB)

**File:** `docker-compose.gpu.yml`

**.env:**

```bash
OLLAMA_NUM_PARALLEL=3
OLLAMA_NUM_GPU=1
LLM_MODEL=qwen2.5:1.5b-instruct
EMBEDDING_MODEL=nomic-embed-text
```

## Feature Comparison

| Feature                 | Development        | GPU          | DGX          |
| ----------------------- | ------------------ | ------------ | ------------ |
| **GPU Required**        | ❌                 | ✅           | ✅           |
| **Auto-Secrets**        | ❌                 | ✅           | ✅           |
| **Model Download**      | Manual (LM Studio) | Auto         | Auto         |
| **Concurrent Requests** | 1-2                | 4-12         | 12-16+       |
| **Multi-GPU**           | ❌                 | ✅           | ✅ Optimized |
| **Production Ready**    | ❌                 | ✅           | ✅           |
| **Setup Time**          | 5 min              | 10 min       | 10 min       |
| **Model Selection**     | Manual             | Configurable | Configurable |

## Environment Variables Reference

### Common Variables (All Configurations)

```bash
# Database
POSTGRES_DB=philosophizer
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<auto-generated or custom>
POSTGRES_PORT=5432

# Application
PORT=1738
NODE_ENV=production
JWT_SECRET=<auto-generated or custom>
JWT_EXPIRES_IN=7d
```

### GPU-Specific Variables (gpu.yml, dgx.yml)

```bash
# Ollama Configuration
OLLAMA_NUM_PARALLEL=8        # Concurrent requests
OLLAMA_NUM_GPU=1             # Number of GPUs
OLLAMA_GPU_COUNT=all         # Docker GPU allocation
OLLAMA_MAX_VRAM=0.9          # Max VRAM usage (90%)
OLLAMA_FLASH_ATTENTION=1     # Enable flash attention
OLLAMA_PORT=11434

# LMStudio Provider - points to Ollama container
LMSTUDIO_BASE_URL=http://ollama:11434/v1

# Model Selection
LLM_MODEL=qwen2.5:1.5b-instruct
EMBEDDING_MODEL=nomic-embed-text
SEARCH_MODEL=qwen2.5:1.5b-instruct
```

### Development-Specific Variables (docker-compose.yml)

```bash
# Embedding service (LM Studio on host machine)
EMBEDDING_BASE_URL=http://host.docker.internal:1234/v1
EMBEDDING_API_KEY=lm-studio
```

## Switching Between Configurations

### From Development to GPU Production

```bash
# Stop development containers
docker compose down

# Deploy with GPU
docker compose -f docker-compose.gpu.yml up -d
```

### From GPU to DGX

```bash
# Stop GPU containers
docker compose -f docker-compose.gpu.yml down

# Deploy on DGX
docker compose -f docker-compose.dgx.yml up -d
```

### Preserving Data

All configurations use the same named volumes, so your data persists:

- `philosophizer-postgres-data` - Database
- `philosophizer-ollama-data` - Downloaded models
- `philosophizer-app-secrets` - Auto-generated secrets

## Monitoring GPU Usage

```bash
# Real-time GPU monitoring
nvidia-smi dmon -s u

# Check GPU utilization
watch -n 1 nvidia-smi

# Container GPU usage
docker stats philosophizer-ollama
```

## Troubleshooting

### GPU Not Detected

```bash
# Test GPU access
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# If fails: Install NVIDIA Container Toolkit
# See: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html
```

### Out of Memory Errors

1. Reduce `OLLAMA_NUM_PARALLEL`
2. Use smaller model (e.g., qwen2.5:1.5b instead of 7b)
3. Reduce `OLLAMA_MAX_VRAM` to 0.8

### Slow Inference

1. Increase `OLLAMA_NUM_GPU` if you have multiple GPUs
2. Enable flash attention: `OLLAMA_FLASH_ATTENTION=1`
3. Use faster model or quantized version

## Need Help?

- **Development Setup**: See [SETUP.md](SETUP.md)
- **Automated Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security & Production**: See [PRODUCTION.md](PRODUCTION.md)
- **Manual Secrets**: See [SECRETS.md](SECRETS.md)

## Summary

**Use `docker-compose.yml`** for local development with LM Studio

**Use `docker-compose.gpu.yml`** for production on any GPU machine

**Use `docker-compose.dgx.yml`** specifically for NVIDIA DGX systems

All GPU configurations include automated secret management and are production-ready! 🚀
