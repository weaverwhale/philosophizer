# Philosophizer

Agentic chat with tools and reasoning, using the wisdom of history's greatest philosophers and theologians.

Built with Bun, React, TypeScript, and PostgreSQL with pgvector for semantic search over primary source texts.

## Technologies Used

- **Runtime**: Bun
- **AI SDK**: Vercel AI SDK v6 (beta)
- **Frontend**: React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Database**: PostgreSQL 16 with pgvector
- **RAG**: HQE (Hypothetical Question Embeddings) for improved semantic search
- **Authentication**: JWT with bcrypt
- **Markdown**: Streamdown (optimized for streaming AI responses)
- **Validation**: Zod schemas

## Setup

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://docker.com)

### Installation

```bash
# Install dependencies
bun install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables to set:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/philosophizer

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Admin Access
ADMIN_EMAILS=admin@example.com,another.admin@example.com

# AI Provider
OPENAI_API_KEY=your-openai-api-key

# Optional: ChromaDB (defaults to localhost:8000)
CHROMA_URL=http://localhost:8000

# Optional: Docker Hub Integration (for admin panel)
DOCKER_HUB_USERNAME=your-dockerhub-username
DOCKER_HUB_REPO=philosophizer-pgvector
DOCKER_HUB_TOKEN=your-dockerhub-token
```

See `.env.example` for all available configuration options.

## Admin Panel

The admin panel provides a web interface for managing the database, RAG system, and backups.

### Admin Access

Set admin email addresses in your `.env` file:

```env
ADMIN_EMAILS=admin@example.com,another.admin@example.com
```

Only users with email addresses listed in `ADMIN_EMAILS` can access the admin panel at `/admin`.

### Admin Features

The admin panel provides:

1. **Database Statistics**
   - View total chunks, philosophers indexed, user count, conversation count
   - Database sizes and detailed breakdowns
   - Real-time stats refresh

2. **RAG Management**
   - Re-seed database: Clear and re-index all philosopher texts
   - Clear RAG data: Remove all RAG data from the database
   - Monitor operation progress with real-time logs

3. **Backup Management**
   - Create new backups of the pgvector database
   - List all backup files with sizes and timestamps
   - Download backup files

4. **Restore & Publish**
   - Restore from any backup file
   - Publish Docker images to Docker Hub
   - Monitor script execution with console output

5. **Docker Hub Integration**
   - View published Docker images
   - See image tags, sizes, architectures, and last updated times
   - Direct links to Docker Hub

### Docker Hub Configuration

To enable Docker Hub integration in the admin panel, set these environment variables:

```env
DOCKER_HUB_USERNAME=your-dockerhub-username
DOCKER_HUB_REPO=philosophizer-pgvector
DOCKER_HUB_TOKEN=your-dockerhub-token  # Optional, for private repos
```

### Backup & Restore Scripts

The admin panel uses the same scripts available from the command line:

```bash
# Create a backup
./scripts/backup-pgvector.sh

# Restore from a backup
./scripts/restore-pgvector.sh

# Publish to Docker Hub
./scripts/publish-pgvector.sh username/repo:tag
```

## Database Setup

### PostgreSQL (Required)

Start PostgreSQL with Docker:

```bash
# Start PostgreSQL
bun run postgres

# Setup database schema
bun run db:setup

# View logs
bun run postgres:logs

# Stop PostgreSQL
bun run postgres:stop
```

Or use local PostgreSQL:

```bash
createdb philosophizer
psql -d philosophizer -f src/db/schema.sql
```

## RAG with HQE (Hypothetical Question Embeddings)

The app uses **HQE** to improve semantic search over philosophical and theological texts. For each text chunk, the system:

1. Generates 3 hypothetical questions the chunk would answer
2. Creates embeddings for both content and questions
3. Uses hybrid search (70% questions, 30% content) for better query-answer alignment

This significantly improves retrieval accuracy by matching user queries to semantically similar questions.

**Configuration:** Edit `src/constants/rag.ts` to adjust questions per chunk and search weights.

### Index Texts with HQE

```bash
# Index all texts (automatically resumes, skipping existing chunks)
bun run rag:index

# Reset: clear and reindex everything
bun run rag:reset

# Clear and reindex everything (same as reset)
bun run rag:clear

# Show collection statistics
bun run rag:stats
```

**Note:**

- By default, indexing automatically resumes and skips existing chunks. Use `--force` or `--reset` to reindex everything.
- HQE indexing takes 2-3x longer than standard indexing due to question generation.

### RAG API Endpoints

Once the server is running, you can query the vector store via API:

**Query passages (HQE enabled by default):**

```bash
curl -X POST http://localhost:1738/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is virtue?", "limit": 5}'
```

With filters:

```bash
curl -X POST http://localhost:1738/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is virtue?", "philosopher": "aristotle", "limit": 10}'
```

Disable HQE (content-only search):

```bash
curl -X POST http://localhost:1738/rag \
  -H "Content-Type: application/json" \
  -d '{"query": "What is virtue?", "useHQE": false}'
```

**Get collection stats:**

```bash
curl http://localhost:1738/rag
```

## Conversations API

Save and recall chat conversations.

**List all conversations:**

```bash
curl http://localhost:1738/conversations
```

**Create a new conversation:**

```bash
curl -X POST http://localhost:1738/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Discussion about virtue"}'
```

**Get a conversation with messages:**

```bash
curl http://localhost:1738/conversations/{id}
```

**Update conversation (title or messages):**

```bash
curl -X PUT http://localhost:1738/conversations/{id} \
  -H "Content-Type: application/json" \
  -d '{"title": "New title", "messages": [...]}'
```

**Delete a conversation:**

```bash
curl -X DELETE http://localhost:1738/conversations/{id}
```

## Usage

### Development Mode

```bash
bun run dev
```

### Production Mode

```bash
bun run start
```

### Debug Mode

```bash
bun run dev:debug
```

## Docker Compose

For local production deployment with all services:

```bash
docker compose up -d
```
