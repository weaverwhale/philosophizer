#!/usr/bin/env bun
/**
 * Script to download and index philosopher texts into the vector store
 *
 * Supports multiple text formats:
 * - Plain text files (.txt)
 * - PDF files (.pdf)
 * - HTML pages
 *
 * Usage:
 *   bun run src/rag/scripts/indexTexts.ts                    # Index all texts (resumes by default)
 *   bun run src/rag/scripts/indexTexts.ts --philosopher plato  # Index specific philosopher
 *   bun run src/rag/scripts/indexTexts.ts --source plato-republic  # Index specific source
 *   bun run src/rag/scripts/indexTexts.ts --reset             # Clear and reindex everything
 *   bun run src/rag/scripts/indexTexts.ts --clear            # Clear and reindex everything
 *   bun run src/rag/scripts/indexTexts.ts --force            # Force reindex everything
 *   bun run src/rag/scripts/indexTexts.ts --stats            # Show collection stats
 */

import {
  TEXT_SOURCES,
  getSourcesByPhilosopher,
  type TextSource,
} from './sources';
import { downloadText, readDownloadedText } from './utils/downloader';
import { createChunksWithMetadata, getChunkStats } from './utils/chunker';
import {
  addChunks,
  isSourceIndexed,
  clearCollection,
  getCollectionStats,
  getIndexedChunkIndices,
  getSourceChunkCount,
} from './utils/vectorStore';
import { generateQuestions } from './utils/questionGenerator';
import { embed, embedMany } from 'ai';
import { EMBEDDING_MODEL } from '../utils/providers';
import 'dotenv/config';

interface IndexOptions {
  philosopher?: string;
  sourceId?: string;
  clear?: boolean;
  reset?: boolean;
  stats?: boolean;
  force?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): IndexOptions {
  const args = process.argv.slice(2);
  const options: IndexOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--philosopher':
      case '-p':
        options.philosopher = args[++i];
        break;
      case '--source':
      case '-s':
        options.sourceId = args[++i];
        break;
      case '--clear':
      case '-c':
        options.clear = true;
        break;
      case '--reset':
        options.reset = true;
        break;
      case '--stats':
        options.stats = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      default:
        if (!arg?.startsWith('-')) {
          // Treat as philosopher name if no flag
          options.philosopher = arg;
        }
    }
  }

  return options;
}

/**
 * Index a single text source
 */
async function indexSource(
  source: TextSource,
  force: boolean = false
): Promise<boolean> {
  console.log(`\n📚 Processing: ${source.title} (${source.philosopher})`);

  // Check existing index status
  const existingChunkIndices = await getIndexedChunkIndices(source.id);
  const existingCount = existingChunkIndices.size;

  // Download the text
  const downloadResult = await downloadText(source);
  if (!downloadResult.success) {
    console.error(`  ✗ Download failed: ${downloadResult.error}`);
    return false;
  }

  // Read the downloaded text
  const text = await readDownloadedText(source.id);
  if (!text) {
    console.error(`  ✗ Failed to read downloaded text`);
    return false;
  }

  console.log(`  📄 Text length: ${text.length.toLocaleString()} characters`);

  // Chunk the text
  const allChunks = createChunksWithMetadata(
    text,
    source.id,
    source.philosopher,
    source.title,
    source.author
  );

  const stats = getChunkStats(allChunks);
  console.log(
    `  🧩 Created ${stats.count} chunks (avg ${stats.avgLength} chars)`
  );

  // Determine which chunks to process
  // By default, resume (skip existing chunks) unless force is true
  let chunksToProcess = allChunks;
  let skippedCount = 0;

  if (!force && existingCount > 0) {
    chunksToProcess = allChunks.filter(
      chunk => !existingChunkIndices.has(chunk.metadata.chunkIndex)
    );
    skippedCount = allChunks.length - chunksToProcess.length;

    if (chunksToProcess.length === 0) {
      console.log(
        `  ✓ All ${allChunks.length} chunks already indexed, nothing to add`
      );
      return true;
    }

    console.log(
      `  🔄 Resuming: ${skippedCount} chunks already indexed, ${chunksToProcess.length} new chunks to process`
    );
  }

  // Generate questions and embeddings for each chunk
  console.log(
    `  ❓ Generating hypothetical questions for ${chunksToProcess.length} chunks...`
  );
  for (let i = 0; i < chunksToProcess.length; i++) {
    const chunk = chunksToProcess[i]!;

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

    if ((i + 1) % 5 === 0 || i === chunksToProcess.length - 1) {
      console.log(
        `    Progress: ${i + 1}/${chunksToProcess.length} chunks processed${!force && skippedCount > 0 ? ` (${skippedCount} already done)` : ''}`
      );
    }
  }

  console.log(
    `  ✓ Generated questions for all ${chunksToProcess.length} chunks`
  );

  // Add to vector store
  try {
    const added = await addChunks(chunksToProcess);
    console.log(
      `  ✓ Indexed ${added} chunks with HQE${!force && existingCount > 0 ? ` (total: ${existingCount + added})` : ''}`
    );
    return true;
  } catch (error) {
    console.error(
      `  ✗ Indexing failed: ${error instanceof Error ? error.message : error}`
    );
    return false;
  }
}

/**
 * Main indexing function
 */
async function main() {
  const options = parseArgs();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           Philosopher RAG - Text Indexing Script           ');
  console.log('═══════════════════════════════════════════════════════════');

  // Show stats and exit
  if (options.stats) {
    console.log('\n📊 Collection Statistics:');
    try {
      const stats = await getCollectionStats();
      console.log(`  Total chunks: ${stats.totalChunks}`);
      const philosophers = Object.keys(stats.byPhilosopher);
      console.log(`  Philosophers indexed: ${philosophers.length}`);
      if (philosophers.length > 0) {
        console.log(`  - ${philosophers.join('\n  - ')}`);
      }
    } catch (error) {
      console.log('  No collection found or error reading stats.');
    }
    return;
  }

  // Clear collection if requested (reset or clear)
  if (options.reset || options.clear) {
    console.log('\n🗑 Clearing existing collection...');
    await clearCollection();
  }

  // Determine which sources to index
  let sources: TextSource[];

  if (options.sourceId) {
    const source = TEXT_SOURCES.find(s => s.id === options.sourceId);
    if (!source) {
      console.error(`\n✗ Source not found: ${options.sourceId}`);
      console.log('\nAvailable sources:');
      TEXT_SOURCES.forEach(s => console.log(`  - ${s.id}`));
      process.exit(1);
    }
    sources = [source];
  } else if (options.philosopher) {
    sources = getSourcesByPhilosopher(options.philosopher);
    if (sources.length === 0) {
      console.error(
        `\n✗ No sources found for philosopher: ${options.philosopher}`
      );
      console.log('\nAvailable philosophers:');
      const philosophers = [...new Set(TEXT_SOURCES.map(s => s.philosopher))];
      philosophers.forEach(p => console.log(`  - ${p}`));
      process.exit(1);
    }
  } else {
    sources = TEXT_SOURCES;
  }

  console.log(`\n📥 Will process ${sources.length} text(s)`);

  // Index each source
  let success = 0;
  let failed = 0;

  for (const source of sources) {
    const result = await indexSource(
      source,
      options.force || options.clear || options.reset
    );
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                         Summary                            ');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✓ Successful: ${success}`);
  console.log(`  ✗ Failed: ${failed}`);

  // Show final stats
  try {
    const stats = await getCollectionStats();
    console.log(`\n📊 Collection now contains:`);
    console.log(`  Total chunks: ${stats.totalChunks}`);
    console.log(
      `  Philosophers: ${Object.keys(stats.byPhilosopher).join(', ')}`
    );
  } catch {
    // Ignore stats errors
  }

  console.log('\n✅ Done!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
