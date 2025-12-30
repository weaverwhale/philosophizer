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

# AI Provider
OPENAI_API_KEY=your-openai-api-key

# Optional: ChromaDB (defaults to localhost:8000)
CHROMA_URL=http://localhost:8000
```

See `.env.example` for all available configuration options.

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
# Index all texts (generates questions automatically)
bun run rag:index

# Clear and reindex
bun run rag:clear
```

**Note:** HQE indexing takes 2-3x longer than standard indexing due to question generation.

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

## Usage Tracking & Analytics

The app includes comprehensive usage tracking to help you understand how users interact with your application.

### Features

- **Session Tracking**: Monitors user login sessions, IP addresses, and activity
- **Event Tracking**: Records user actions (messages, conversations, logins)
- **Daily Statistics**: Aggregated metrics per user per day
- **Analytics API**: Query and analyze usage data

### Setup

Run the migration to add usage tracking tables to your database:

```bash
./scripts/migrate-usage-tracking.sh
```

Or if setting up a fresh database, the schema is already included in `src/db/schema.sql`.

### Analytics Endpoints

All endpoints require authentication:

```bash
# Get user events
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/events?limit=50"

# Get daily statistics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/daily-stats"

# Get activity summary (last 30 days)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/summary"

# Get system-wide aggregate stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:1738/analytics/aggregate"
```

### Testing Analytics

Use the provided test script:

```bash
./scripts/test-analytics.sh YOUR_AUTH_TOKEN
```

See `USAGE_TRACKING.md` for detailed documentation.

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
