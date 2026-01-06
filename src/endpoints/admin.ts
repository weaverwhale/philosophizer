import { requireAdmin } from '../middleware/auth';
import { getCollectionStats, clearCollection } from '../rag/utils/vectorStore';
import { getPool } from '../db/connection';
import { spawn } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { TEXT_SOURCES } from '../rag/sources';
import { createChunksWithMetadata } from '../rag/utils/chunker';
import { readDownloadedText } from '../rag/utils/downloader';
import { addChunks } from '../rag/utils/vectorStore';
import { generateQuestions } from '../rag/utils/questionGenerator';
import { embed, embedMany } from 'ai';
import { EMBEDDING_MODEL } from '../utils/providers';
import { getSystemPrompt } from '../constants/prompts';
import { PHILOSOPHERS } from '../constants/philosophers';

const PROJECT_ROOT = join(import.meta.dir, '..', '..');

/**
 * GET /admin/stats - Get comprehensive database statistics
 */
export const getStats = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const pool = getPool();

    // Get RAG stats
    const ragStats = await getCollectionStats();

    // Get user count
    const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(userResult.rows[0]?.count || '0');

    // Get conversation count
    const convResult = await pool.query(
      'SELECT COUNT(*) as count FROM conversations'
    );
    const conversationCount = parseInt(convResult.rows[0]?.count || '0');

    // Get database size
    const dbSizeResult = await pool.query(`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as total_size,
        pg_size_pretty(pg_total_relation_size('philosopher_text_chunks')) as chunks_table_size,
        pg_size_pretty(pg_total_relation_size('conversations')) as conversations_table_size,
        pg_size_pretty(pg_total_relation_size('users')) as users_table_size
    `);

    return new Response(
      JSON.stringify({
        rag: {
          totalChunks: ragStats.totalChunks,
          byPhilosopher: ragStats.byPhilosopher,
          bySource: ragStats.bySource,
        },
        database: {
          users: userCount,
          conversations: conversationCount,
          sizes: dbSizeResult.rows[0],
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Admin stats error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /admin/rag/clear - Clear all RAG data
 */
export const clearRAG = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    await clearCollection();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RAG collection cleared successfully',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Clear RAG error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /admin/rag/reseed - Re-index all philosopher texts
 */
export const reseedRAG = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const logs: string[] = [];
    let successCount = 0;
    let failCount = 0;

    logs.push('Starting RAG re-seed operation...');
    logs.push(`Processing ${TEXT_SOURCES.length} text sources`);

    // Clear existing data
    logs.push('Clearing existing collection...');
    await clearCollection();
    logs.push('Collection cleared successfully');

    // Index each source
    for (const source of TEXT_SOURCES) {
      try {
        logs.push(`\nProcessing: ${source.title} (${source.philosopher})`);

        // Read the downloaded text
        const text = await readDownloadedText(source.id);
        if (!text) {
          logs.push(`  ✗ Failed to read text for ${source.id}`);
          failCount++;
          continue;
        }

        logs.push(`  Text length: ${text.length.toLocaleString()} characters`);

        // Chunk the text
        const chunks = createChunksWithMetadata(
          text,
          source.id,
          source.philosopher,
          source.title,
          source.author
        );

        logs.push(`  Created ${chunks.length} chunks`);

        // Generate questions and embeddings for each chunk
        logs.push(`  Generating questions and embeddings...`);
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]!;

          // Generate questions for this chunk
          const questions = await generateQuestions(chunk.content);

          // Generate embeddings for the questions
          let questionEmbeddings: number[][] = [];
          if (questions.length > 0) {
            if (questions.length === 1) {
              const { embedding } = await embed({
                model: EMBEDDING_MODEL,
                value: questions[0]!,
              });
              questionEmbeddings = [embedding];
            } else {
              const { embeddings } = await embedMany({
                model: EMBEDDING_MODEL,
                values: questions,
              });
              questionEmbeddings = embeddings;
            }
          }

          // Attach questions and embeddings to chunk
          chunk.questions = questions;
          chunk.questionEmbeddings = questionEmbeddings;

          if ((i + 1) % 10 === 0 || i === chunks.length - 1) {
            logs.push(
              `    Progress: ${i + 1}/${chunks.length} chunks processed`
            );
          }
        }

        // Add to vector store
        const added = await addChunks(chunks);
        logs.push(`  ✓ Indexed ${added} chunks`);
        successCount++;
      } catch (error) {
        logs.push(
          `  ✗ Error: ${error instanceof Error ? error.message : String(error)}`
        );
        failCount++;
      }
    }

    logs.push('\n=== Summary ===');
    logs.push(`Successful: ${successCount}`);
    logs.push(`Failed: ${failCount}`);

    // Get final stats
    const stats = await getCollectionStats();
    logs.push(`Total chunks indexed: ${stats.totalChunks}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'RAG re-seed completed',
        stats: {
          successful: successCount,
          failed: failCount,
          totalChunks: stats.totalChunks,
        },
        logs: logs.join('\n'),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reseed RAG error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /admin/backup - Create a database backup
 */
export const createBackup = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const scriptPath = join(PROJECT_ROOT, 'scripts', 'backup-pgvector.sh');

    return new Promise<Response>(resolve => {
      const logs: string[] = [];
      const process = spawn('bash', [scriptPath]);

      process.stdout.on('data', data => {
        logs.push(data.toString());
      });

      process.stderr.on('data', data => {
        logs.push(data.toString());
      });

      process.on('close', code => {
        if (code === 0) {
          resolve(
            new Response(
              JSON.stringify({
                success: true,
                message: 'Backup created successfully',
                logs: logs.join(''),
                timestamp: new Date().toISOString(),
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        } else {
          resolve(
            new Response(
              JSON.stringify({
                success: false,
                error: 'Backup failed',
                message: `Script exited with code ${code}`,
                logs: logs.join(''),
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /admin/backups - List all backup files
 */
export const listBackups = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const files = await readdir(PROJECT_ROOT);
    const backupFiles = files.filter(
      f =>
        f.startsWith('pgvector-backup') &&
        f.endsWith('.sql') &&
        f !== 'pgvector-merge.sql'
    );

    const backupsWithStats = await Promise.all(
      backupFiles.map(async filename => {
        const filepath = join(PROJECT_ROOT, filename);
        const stats = await stat(filepath);

        // Parse timestamp from filename if it exists (pgvector-backup-YYYYMMDD_HHMMSS.sql)
        const timestampMatch = filename.match(
          /pgvector-backup-(\d{8}_\d{6})\.sql/
        );
        let timestamp: string | null = null;
        if (timestampMatch) {
          const dateStr = timestampMatch[1]!;
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const hour = dateStr.substring(9, 11);
          const minute = dateStr.substring(11, 13);
          const second = dateStr.substring(13, 15);
          timestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        }

        return {
          filename,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          timestamp,
        };
      })
    );

    // Sort by modified date, newest first
    backupsWithStats.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    return new Response(
      JSON.stringify({
        backups: backupsWithStats,
        count: backupsWithStats.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('List backups error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /admin/backups/:filename - Download a backup file
 */
export const downloadBackup = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const url = new URL(req.url);
    const filename = url.pathname.split('/').pop();

    if (!filename || !filename.endsWith('.sql')) {
      return new Response(
        JSON.stringify({
          error: 'Invalid filename',
          message: 'Filename must end with .sql',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Security: only allow backup files
    if (!filename.startsWith('pgvector-backup')) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Only backup files can be downloaded',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const filepath = join(PROJECT_ROOT, filename);

    // Check if file exists
    try {
      await stat(filepath);
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'Backup file not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Return file for download
    const file = Bun.file(filepath);
    return new Response(file, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Download backup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /admin/restore - Restore from a backup file
 */
export const restoreBackup = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = (await req.json()) as { filename?: string };

    if (!body.filename) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Filename is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Security check
    if (
      !body.filename.startsWith('pgvector-backup') ||
      !body.filename.endsWith('.sql')
    ) {
      return new Response(
        JSON.stringify({
          error: 'Invalid filename',
          message: 'Only backup files can be restored',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const scriptPath = join(PROJECT_ROOT, 'scripts', 'restore-pgvector.sh');

    return new Promise<Response>(resolve => {
      const logs: string[] = [];
      // Use --merge mode for restore
      const process = spawn('bash', [scriptPath, '--merge'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Auto-answer 'y' to the confirmation prompt
      process.stdin?.write('y\n');
      process.stdin?.end();

      process.stdout.on('data', data => {
        logs.push(data.toString());
      });

      process.stderr.on('data', data => {
        logs.push(data.toString());
      });

      process.on('close', code => {
        if (code === 0) {
          resolve(
            new Response(
              JSON.stringify({
                success: true,
                message: 'Backup restored successfully',
                logs: logs.join(''),
                timestamp: new Date().toISOString(),
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        } else {
          resolve(
            new Response(
              JSON.stringify({
                success: false,
                error: 'Restore failed',
                message: `Script exited with code ${code}`,
                logs: logs.join(''),
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /admin/publish - Publish Docker image to Docker Hub
 */
export const publishDocker = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const body = (await req.json()) as { imageName?: string };

    if (!body.imageName) {
      return new Response(
        JSON.stringify({
          error: 'Bad request',
          message: 'Image name is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const scriptPath = join(PROJECT_ROOT, 'scripts', 'publish-pgvector.sh');

    return new Promise<Response>(resolve => {
      const logs: string[] = [];
      const process = spawn('bash', [scriptPath, body.imageName!]);

      process.stdout.on('data', data => {
        logs.push(data.toString());
      });

      process.stderr.on('data', data => {
        logs.push(data.toString());
      });

      process.on('close', code => {
        if (code === 0) {
          resolve(
            new Response(
              JSON.stringify({
                success: true,
                message: 'Docker image published successfully',
                logs: logs.join(''),
                timestamp: new Date().toISOString(),
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        } else {
          resolve(
            new Response(
              JSON.stringify({
                success: false,
                error: 'Publish failed',
                message: `Script exited with code ${code}`,
                logs: logs.join(''),
              }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          );
        }
      });
    });
  } catch (error) {
    console.error('Publish Docker error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /admin/docker/images - Get published Docker images from Docker Hub
 */
export const getDockerImages = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const username = process.env.DOCKER_HUB_USERNAME;
    const repo = process.env.DOCKER_HUB_REPO || 'philosophizer-pgvector';

    if (!username) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'DOCKER_HUB_USERNAME environment variable not set',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const url = `https://hub.docker.com/v2/repositories/${username}/${repo}/tags`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({
            images: [],
            count: 0,
            message: 'Repository not found or no images published yet',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`Docker Hub API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{
        name: string;
        last_updated: string;
        full_size: number;
        images: Array<{
          architecture: string;
          os: string;
          size: number;
        }>;
      }>;
    };

    const images = data.results.map(tag => ({
      tag: tag.name,
      lastUpdated: tag.last_updated,
      size: tag.full_size,
      sizeFormatted: formatBytes(tag.full_size),
      architectures: tag.images.map(img => `${img.os}/${img.architecture}`),
      url: `https://hub.docker.com/r/${username}/${repo}/tags`,
    }));

    return new Response(
      JSON.stringify({
        images,
        count: images.length,
        repository: `${username}/${repo}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get Docker images error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Helper function to estimate token count
 * Uses a rough approximation: 1 token ≈ 4 characters for English text
 * This is a reasonable approximation for GPT models
 */
function estimateTokenCount(text: string): number {
  // Remove extra whitespace and normalize
  const normalized = text.trim();
  // Rough approximation: 1 token ≈ 4 characters
  // This is fairly accurate for English text with GPT models
  return Math.ceil(normalized.length / 4);
}

/**
 * GET /admin/prompts - Get all available prompts with token counts
 */
export const getPrompts = async (req: Request) => {
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const url = new URL(req.url);
    const philosopherIdsParam = url.searchParams.get('philosopherIds');

    // Parse philosopher IDs - can be comma-separated string or single ID
    let philosopherIds: string | string[] | undefined;
    if (philosopherIdsParam) {
      const ids = philosopherIdsParam.split(',').filter(id => id.trim());
      philosopherIds =
        ids.length === 1 ? ids[0] : ids.length > 1 ? ids : undefined;
    }

    // Generate the appropriate system prompt
    const systemPrompt = getSystemPrompt(philosopherIds);
    const tokenCount = estimateTokenCount(systemPrompt);

    // Get list of available philosophers
    const availablePhilosophers = Object.entries(PHILOSOPHERS).map(
      ([id, phil]) => ({
        id,
        name: phil.name,
        tradition: phil.tradition,
      })
    );

    // Format philosopher name(s) for display
    let philosopherName: string;
    if (!philosopherIds) {
      philosopherName = 'Default (All Philosophers)';
    } else if (typeof philosopherIds === 'string') {
      philosopherName = PHILOSOPHERS[philosopherIds]?.name || 'Unknown';
    } else {
      const names = philosopherIds
        .map(id => PHILOSOPHERS[id]?.name)
        .filter(Boolean);
      philosopherName = names.length > 0 ? names.join(', ') : 'Unknown';
    }

    return new Response(
      JSON.stringify({
        prompt: systemPrompt,
        tokenCount,
        characterCount: systemPrompt.length,
        philosopherId: philosopherIds || 'default',
        philosopherName,
        availablePhilosophers,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get prompts error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Export all endpoints
export const admin = {
  '/admin/stats': { GET: getStats },
  '/admin/prompts': { GET: getPrompts },
  '/admin/rag/clear': { POST: clearRAG },
  '/admin/rag/reseed': { POST: reseedRAG },
  '/admin/backup': { POST: createBackup },
  '/admin/backups': { GET: listBackups },
  '/admin/backups/:filename': { GET: downloadBackup },
  '/admin/restore': { POST: restoreBackup },
  '/admin/publish': { POST: publishDocker },
  '/admin/docker/images': { GET: getDockerImages },
};
