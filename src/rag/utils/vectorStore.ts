/**
 * Vector store utility for embedding and querying philosopher texts
 * Uses PostgreSQL with pgvector for vector storage and AI SDK for embeddings
 */

import { embed, embedMany } from 'ai';
import type { TextChunk } from './chunker';
import {
  DEFAULT_QUERY_LIMIT,
  MIN_RELEVANCE_SCORE,
  ADJACENT_CHUNK_WINDOW,
  EMBEDDING_BATCH_SIZE,
  QUESTION_EMBEDDING_WEIGHT,
  CONTENT_EMBEDDING_WEIGHT,
} from '../../constants/rag';
import { EMBEDDING_MODEL_NAME } from '../../constants/providers';
import { EMBEDDING_MODEL } from '../../utils/providers';
import { getPool } from '../../db/connection';

/**
 * Generate embeddings for texts using AI SDK
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (texts.length === 1) {
    const { embedding } = await embed({
      model: EMBEDDING_MODEL,
      value: texts[0]!,
    });
    return [embedding];
  }

  const { embeddings } = await embedMany({
    model: EMBEDDING_MODEL,
    values: texts,
  });
  return embeddings;
}

/**
 * Generate a single embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
  });
  return embedding;
}

/**
 * Initialize the vector store (verify pgvector extension is enabled)
 */
export async function initVectorStore(): Promise<void> {
  const pool = getPool();

  try {
    // Verify pgvector extension is enabled
    const result = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
    );

    if (!result.rows[0]?.exists) {
      throw new Error(
        'pgvector extension is not enabled. Run: CREATE EXTENSION vector;'
      );
    }
  } catch (error) {
    console.error('Failed to initialize vector store:', error);
    throw error;
  }
}

/**
 * Add chunks to the vector store with optional question embeddings (HQE)
 */
export async function addChunks(chunks: TextChunk[]): Promise<number> {
  if (chunks.length === 0) return 0;

  await initVectorStore();
  const pool = getPool();
  let added = 0;

  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);

    // Generate embeddings using AI SDK
    const batchDocs = batch.map(c => c.content);
    const batchEmbeddings = await generateEmbeddings(batchDocs);

    // Insert chunks in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j]!;
        const embedding = batchEmbeddings[j]!;

        // Format question embeddings for PostgreSQL array of vectors
        const questionEmbeddingsFormatted = chunk.questionEmbeddings
          ? `{${chunk.questionEmbeddings.map(emb => `"${JSON.stringify(emb)}"`).join(',')}}`
          : null;

        await client.query(
          `INSERT INTO philosopher_text_chunks 
           (id, content, embedding, philosopher, source_id, title, chunk_index, start_char, end_char, questions, question_embeddings)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             content = EXCLUDED.content,
             embedding = EXCLUDED.embedding,
             philosopher = EXCLUDED.philosopher,
             source_id = EXCLUDED.source_id,
             title = EXCLUDED.title,
             chunk_index = EXCLUDED.chunk_index,
             start_char = EXCLUDED.start_char,
             end_char = EXCLUDED.end_char,
             questions = EXCLUDED.questions,
             question_embeddings = EXCLUDED.question_embeddings`,
          [
            chunk.id,
            chunk.content,
            JSON.stringify(embedding), // pgvector accepts array as JSON string
            chunk.metadata.philosopher,
            chunk.metadata.sourceId,
            chunk.metadata.title,
            chunk.metadata.chunkIndex,
            chunk.metadata.startChar ?? 0,
            chunk.metadata.endChar ?? 0,
            chunk.questions || null,
            questionEmbeddingsFormatted,
          ]
        );
      }

      await client.query('COMMIT');
      added += batch.length;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (chunks.length > EMBEDDING_BATCH_SIZE) {
      console.log(
        `  Embedded ${Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`
      );
    }
  }

  return added;
}

export interface QueryResult {
  id: string;
  content: string;
  philosopher: string;
  sourceId: string;
  title: string;
  chunkIndex: number;
  relevanceScore: number;
}

export interface QueryOptions {
  philosopher?: string;
  sourceId?: string;
  limit?: number;
  minScore?: number;
  useHQE?: boolean; // Whether to use HQE hybrid search (default: true)
}

/**
 * Query for relevant passages using HQE hybrid search
 * Combines content embeddings and question embeddings for better retrieval
 */
export async function queryPassages(
  query: string,
  options: QueryOptions = {}
): Promise<QueryResult[]> {
  const {
    philosopher,
    sourceId,
    limit = DEFAULT_QUERY_LIMIT,
    minScore = MIN_RELEVANCE_SCORE,
    useHQE = true,
  } = options;

  await initVectorStore();
  const pool = getPool();

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  const queryEmbeddingStr = JSON.stringify(queryEmbedding);

  // Build WHERE clause
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (philosopher) {
    conditions.push(`philosopher = $${paramIndex}`);
    params.push(philosopher);
    paramIndex++;
  }

  if (sourceId) {
    conditions.push(`source_id = $${paramIndex}`);
    params.push(sourceId);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  if (!useHQE) {
    // Traditional content-only search
    const result = await pool.query(
      `SELECT 
         id,
         content,
         philosopher,
         source_id,
         title,
         chunk_index,
         1 - (embedding <=> $${paramIndex}::vector) AS relevance_score
       FROM philosopher_text_chunks
       ${whereClause}
       ORDER BY embedding <=> $${paramIndex}::vector
       LIMIT $${paramIndex + 1}`,
      [...params, queryEmbeddingStr, limit * 2]
    );

    const queryResults: QueryResult[] = result.rows
      .filter(row => row.relevance_score >= minScore)
      .slice(0, limit)
      .map(row => ({
        id: row.id,
        content: row.content,
        philosopher: row.philosopher,
        sourceId: row.source_id,
        title: row.title,
        chunkIndex: row.chunk_index,
        relevanceScore: row.relevance_score,
      }));

    return queryResults;
  }

  // HQE hybrid search: combine content and question embeddings
  // Get top results from both content embeddings and question embeddings
  const contentQueryParam = paramIndex;
  const questionQueryParam = paramIndex + 1;
  const limitParam = paramIndex + 2;

  const result = await pool.query(
    `WITH content_search AS (
       SELECT 
         id,
         content,
         philosopher,
         source_id,
         title,
         chunk_index,
         (1 - (embedding <=> $${contentQueryParam}::vector)) * ${CONTENT_EMBEDDING_WEIGHT} AS content_score
       FROM philosopher_text_chunks
       ${whereClause}
       ORDER BY embedding <=> $${contentQueryParam}::vector
       LIMIT $${limitParam}
     ),
     question_search AS (
       SELECT 
         id,
         content,
         philosopher,
         source_id,
         title,
         chunk_index,
         MAX(1 - (qemb::vector <=> $${questionQueryParam}::vector)) * ${QUESTION_EMBEDDING_WEIGHT} AS question_score
       FROM philosopher_text_chunks
       CROSS JOIN LATERAL unnest(question_embeddings) AS qemb
       ${whereClause}
       GROUP BY id, content, philosopher, source_id, title, chunk_index
       ORDER BY question_score DESC
       LIMIT $${limitParam}
     ),
     combined AS (
       SELECT 
         COALESCE(c.id, q.id) AS id,
         COALESCE(c.content, q.content) AS content,
         COALESCE(c.philosopher, q.philosopher) AS philosopher,
         COALESCE(c.source_id, q.source_id) AS source_id,
         COALESCE(c.title, q.title) AS title,
         COALESCE(c.chunk_index, q.chunk_index) AS chunk_index,
         COALESCE(c.content_score, 0) + COALESCE(q.question_score, 0) AS relevance_score
       FROM content_search c
       FULL OUTER JOIN question_search q ON c.id = q.id
     )
     SELECT * FROM combined
     ORDER BY relevance_score DESC
     LIMIT $${limitParam}`,
    [...params, queryEmbeddingStr, queryEmbeddingStr, limit * 2]
  );

  // Filter by minimum score and format results
  const queryResults: QueryResult[] = result.rows
    .filter(row => row.relevance_score >= minScore)
    .slice(0, limit)
    .map(row => ({
      id: row.id,
      content: row.content,
      philosopher: row.philosopher,
      sourceId: row.source_id,
      title: row.title,
      chunkIndex: row.chunk_index,
      relevanceScore: row.relevance_score,
    }));

  return queryResults;
}

/**
 * Query multiple philosophers at once
 */
export async function queryMultiplePhilosophers(
  query: string,
  philosophers: string[],
  options: Omit<QueryOptions, 'philosopher'> = {}
): Promise<QueryResult[]> {
  const allResults: QueryResult[] = [];

  for (const philosopher of philosophers) {
    const results = await queryPassages(query, { ...options, philosopher });
    allResults.push(...results);
  }

  allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return allResults.slice(0, options.limit || DEFAULT_QUERY_LIMIT);
}

/**
 * Get adjacent chunks for expanded context around a matched passage
 * Returns chunks before and after the given chunk index
 */
export async function getAdjacentChunks(
  sourceId: string,
  chunkIndex: number,
  window: number = ADJACENT_CHUNK_WINDOW
): Promise<QueryResult[]> {
  await initVectorStore();
  const pool = getPool();

  // Calculate which chunk indices to fetch
  const minIndex = chunkIndex - window;
  const maxIndex = chunkIndex + window;

  const result = await pool.query(
    `SELECT 
       id,
       content,
       philosopher,
       source_id,
       title,
       chunk_index
     FROM philosopher_text_chunks
     WHERE source_id = $1 
       AND chunk_index >= $2 
       AND chunk_index <= $3
       AND chunk_index != $4
     ORDER BY chunk_index`,
    [sourceId, minIndex, maxIndex, chunkIndex]
  );

  return result.rows.map(row => ({
    id: row.id,
    content: row.content,
    philosopher: row.philosopher,
    sourceId: row.source_id,
    title: row.title,
    chunkIndex: row.chunk_index,
    relevanceScore: 1, // Adjacent chunks have full relevance to context
  }));
}

/**
 * Get a passage with surrounding context (the matched chunk plus adjacent chunks)
 */
export async function getPassageWithContext(
  sourceId: string,
  chunkIndex: number,
  contextWindow: number = ADJACENT_CHUNK_WINDOW
): Promise<{ main: QueryResult | null; context: QueryResult[] }> {
  await initVectorStore();
  const pool = getPool();

  // Get the main chunk
  const mainResult = await pool.query(
    `SELECT 
       id,
       content,
       philosopher,
       source_id,
       title,
       chunk_index
     FROM philosopher_text_chunks
     WHERE source_id = $1 AND chunk_index = $2
     LIMIT 1`,
    [sourceId, chunkIndex]
  );

  let main: QueryResult | null = null;
  if (mainResult.rows.length > 0) {
    const row = mainResult.rows[0]!;
    main = {
      id: row.id,
      content: row.content,
      philosopher: row.philosopher,
      sourceId: row.source_id,
      title: row.title,
      chunkIndex: row.chunk_index,
      relevanceScore: 1,
    };
  }

  // Get adjacent chunks for context
  const context = await getAdjacentChunks(sourceId, chunkIndex, contextWindow);

  return { main, context };
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(): Promise<{
  totalChunks: number;
  byPhilosopher: Record<string, number>;
  bySource: Record<string, number>;
}> {
  await initVectorStore();
  const pool = getPool();

  // Get total count
  const totalResult = await pool.query(
    'SELECT COUNT(*) as count FROM philosopher_text_chunks'
  );
  const totalChunks = parseInt(totalResult.rows[0]?.count ?? '0', 10);

  // Get counts by philosopher
  const philosopherResult = await pool.query(
    `SELECT philosopher, COUNT(*) as count 
     FROM philosopher_text_chunks 
     GROUP BY philosopher`
  );
  const byPhilosopher: Record<string, number> = {};
  for (const row of philosopherResult.rows) {
    byPhilosopher[row.philosopher] = parseInt(row.count, 10);
  }

  // Get counts by source
  const sourceResult = await pool.query(
    `SELECT source_id, COUNT(*) as count 
     FROM philosopher_text_chunks 
     GROUP BY source_id`
  );
  const bySource: Record<string, number> = {};
  for (const row of sourceResult.rows) {
    bySource[row.source_id] = parseInt(row.count, 10);
  }

  return { totalChunks, byPhilosopher, bySource };
}

/**
 * Check if a source is already indexed
 */
export async function isSourceIndexed(sourceId: string): Promise<boolean> {
  await initVectorStore();
  const pool = getPool();

  const result = await pool.query(
    'SELECT EXISTS(SELECT 1 FROM philosopher_text_chunks WHERE source_id = $1)',
    [sourceId]
  );

  return result.rows[0]?.exists ?? false;
}

/**
 * Get indexed chunk indices for a source (for resume functionality)
 */
export async function getIndexedChunkIndices(
  sourceId: string
): Promise<Set<number>> {
  await initVectorStore();
  const pool = getPool();

  const result = await pool.query(
    'SELECT chunk_index FROM philosopher_text_chunks WHERE source_id = $1',
    [sourceId]
  );

  return new Set(result.rows.map(row => row.chunk_index));
}

/**
 * Get the count of indexed chunks for a source
 */
export async function getSourceChunkCount(sourceId: string): Promise<number> {
  await initVectorStore();
  const pool = getPool();

  const result = await pool.query(
    'SELECT COUNT(*) as count FROM philosopher_text_chunks WHERE source_id = $1',
    [sourceId]
  );

  return parseInt(result.rows[0]?.count ?? '0', 10);
}

/**
 * Delete chunks for a source
 */
export async function deleteSource(sourceId: string): Promise<number> {
  await initVectorStore();
  const pool = getPool();

  const result = await pool.query(
    'DELETE FROM philosopher_text_chunks WHERE source_id = $1',
    [sourceId]
  );

  return result.rowCount ?? 0;
}

/**
 * Clear all chunks
 */
export async function clearCollection(): Promise<void> {
  await initVectorStore();
  const pool = getPool();

  await pool.query('TRUNCATE TABLE philosopher_text_chunks');
  console.log('✓ Collection cleared');
}

/**
 * Format results for display
 */
export function formatResults(results: QueryResult[]): string {
  if (results.length === 0) {
    return 'No relevant passages found.';
  }

  let output = `Found ${results.length} relevant passage(s):\n\n`;

  for (const result of results) {
    const score = (result.relevanceScore * 100).toFixed(1);
    output += `---\n`;
    output += `📚 ${result.title} (${result.philosopher})\n`;
    output += `📊 Relevance: ${score}%\n\n`;
    output += `${result.content}\n\n`;
  }

  return output;
}

/**
 * Check if the RAG system has been initialized (texts indexed)
 */
export async function isRAGInitialized(): Promise<boolean> {
  try {
    const stats = await getCollectionStats();
    return stats.totalChunks > 0;
  } catch {
    return false;
  }
}
