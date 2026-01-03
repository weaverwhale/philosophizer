# Philosophizer

Agentic chat with tools and reasoning, using the wisdom of history's greatest philosophers and theologians.

Built with Bun, React, TypeScript, and PostgreSQL with pgvector for semantic search over primary source texts.

## Features

- **AI Agent**: Multi-model support with streaming responses and tool calling
- **RAG Search**: HQE (Hypothetical Question Embeddings) for improved semantic search over philosophical texts
- **Authentication**: Secure JWT-based user authentication
- **Conversations**: Save and manage chat history
- **Admin Panel**: Web interface for database management, backups, and Docker Hub integration
- **Modern Stack**: React 19, TailwindCSS 4, Vercel AI SDK v6, PostgreSQL 16 with pgvector

## Screenshots

![Chat Interface](screens/ss1.png)
_Conversational AI interface with philosophical wisdom_

![Search & Discovery](screens/ss2.png)
_Semantic search over primary philosophical texts_

![RAG Statistics](screens/ss3.png)
_RAG indexed writers_

## Quick Start

### Development

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL with Docker
bun run postgres

# Start development server
bun run dev
```

Visit http://localhost:1738 to get started!

### Production (GPU Server)

**✨ Zero-configuration deployment with automated secret management!**

```bash
# One command - secrets auto-generated!
docker compose -f docker-compose.gpu.yml up -d
```

Works on any NVIDIA GPU: Workstations, Cloud instances (AWS/GCP/Azure), or DGX systems.

The system automatically generates secure secrets, downloads GPU-accelerated models, and handles concurrent connections.

**📖 See [DOCKER.md](DOCKER.md)** to choose the right configuration for your hardware.

## Documentation

| Guide                              | Description                                                             |
| ---------------------------------- | ----------------------------------------------------------------------- |
| **[DOCKER.md](DOCKER.md)**         | Choose the right Docker Compose config for your hardware (dev/GPU/DGX)  |
| **[SETUP.md](SETUP.md)**           | Complete installation, configuration, RAG indexing, and admin workflows |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Automated deployment, secret management, backup/restore procedures      |
| **[PRODUCTION.md](PRODUCTION.md)** | Advanced security, enterprise secrets (Vault/AWS), GPU optimization     |
| **[SECRETS.md](SECRETS.md)**       | Quick reference for manual secret generation (optional)                 |

## Key Technologies

- **Runtime**: Bun
- **Frontend**: React 19, TypeScript, TailwindCSS 4
- **Backend**: Vercel AI SDK v6 (beta), Zod validation
- **Database**: PostgreSQL 16 with pgvector
- **RAG**: HQE (Hypothetical Question Embeddings)
- **Auth**: JWT with bcrypt
- **Markdown**: Streamdown (optimized for streaming)

## Docker Hub

Pre-loaded PostgreSQL images with indexed philosopher texts are available:

```bash
docker pull mjweaver01/philosophizer-pgv-hqe:latest
```

See [SETUP.md](SETUP.md) for details on embedding models and compatibility.

## License

MIT
