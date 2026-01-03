#!/usr/bin/env bun
/**
 * Test script to dry-run text processing and chunking on a specific source
 * without actually indexing to the vector store
 *
 * Usage:
 *   bun run src/rag/testChunking.ts <source-id>
 *   bun run src/rag/testChunking.ts gregory-nyssa-soul-resurrection
 */

import { TEXT_SOURCES, type TextSource } from './sources';
import { downloadText, readDownloadedText } from './utils/downloader';
import { createChunksWithMetadata, getChunkStats } from './utils/chunker';

/**
 * Show sample chunks from the beginning, middle, and end
 */
function showSampleChunks(chunks: any[], sampleSize: number = 3) {
  console.log(`\n📋 Sample Chunks (first ${sampleSize}):`);
  console.log('═'.repeat(80));

  for (let i = 0; i < Math.min(sampleSize, chunks.length); i++) {
    const chunk = chunks[i];
    console.log(`\nChunk ${i}:`);
    console.log(`  Length: ${chunk.content.length} chars`);
    console.log(`  Preview: ${chunk.content.slice(0, 200)}...`);
    console.log('─'.repeat(80));
  }

  if (chunks.length > sampleSize * 2) {
    console.log(`\n📋 Sample Chunks (middle ${sampleSize}):`);
    console.log('═'.repeat(80));

    const midStart = Math.floor(chunks.length / 2) - Math.floor(sampleSize / 2);
    for (
      let i = midStart;
      i < midStart + Math.min(sampleSize, chunks.length - midStart);
      i++
    ) {
      const chunk = chunks[i];
      console.log(`\nChunk ${i}:`);
      console.log(`  Length: ${chunk.content.length} chars`);
      console.log(`  Preview: ${chunk.content.slice(0, 200)}...`);
      console.log('─'.repeat(80));
    }
  }

  console.log(`\n📋 Sample Chunks (last ${sampleSize}):`);
  console.log('═'.repeat(80));

  for (
    let i = Math.max(0, chunks.length - sampleSize);
    i < chunks.length;
    i++
  ) {
    const chunk = chunks[i];
    console.log(`\nChunk ${i}:`);
    console.log(`  Length: ${chunk.content.length} chars`);
    console.log(`  Preview: ${chunk.content.slice(0, 200)}...`);
    console.log('─'.repeat(80));
  }
}

/**
 * Show chunk size distribution
 */
function showChunkDistribution(chunks: any[]) {
  const lengths = chunks.map(c => c.content.length);

  // Create histogram buckets
  const buckets: { [key: string]: number } = {
    '0-500': 0,
    '501-1000': 0,
    '1001-1500': 0,
    '1501-2000': 0,
    '2001-3000': 0,
    '3000+': 0,
  };

  for (const length of lengths) {
    if (length <= 500) buckets['0-500']!++;
    else if (length <= 1000) buckets['501-1000']!++;
    else if (length <= 1500) buckets['1001-1500']!++;
    else if (length <= 2000) buckets['1501-2000']!++;
    else if (length <= 3000) buckets['2001-3000']!++;
    else buckets['3000+']!++;
  }

  console.log('\n📊 Chunk Size Distribution:');
  console.log('═'.repeat(80));

  for (const [range, count] of Object.entries(buckets)) {
    const percentage = ((count / chunks.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round((count / chunks.length) * 50));
    console.log(
      `  ${range.padEnd(15)} ${count.toString().padStart(4)} (${percentage.padStart(5)}%) ${bar}`
    );
  }
}

/**
 * Show text sample before chunking
 */
function showTextSample(text: string, sampleLength: number = 1000) {
  console.log('\n📄 Raw Text Sample (first 1000 chars):');
  console.log('═'.repeat(80));
  console.log(text.slice(0, sampleLength));
  console.log('═'.repeat(80));

  console.log('\n📄 Raw Text Sample (middle 1000 chars):');
  console.log('═'.repeat(80));
  const midStart = Math.floor(text.length / 2) - Math.floor(sampleLength / 2);
  console.log(text.slice(midStart, midStart + sampleLength));
  console.log('═'.repeat(80));
}

/**
 * Analyze paragraph structure
 */
function analyzeParagraphStructure(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const lengths = paragraphs.map(p => p.length);

  console.log('\n📐 Paragraph Analysis:');
  console.log('═'.repeat(80));
  console.log(`  Total paragraphs: ${paragraphs.length}`);
  console.log(
    `  Average length: ${Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)} chars`
  );
  console.log(`  Shortest: ${Math.min(...lengths)} chars`);
  console.log(`  Longest: ${Math.max(...lengths)} chars`);

  // Show distribution
  const smallParagraphs = lengths.filter(l => l < 200).length;
  const mediumParagraphs = lengths.filter(l => l >= 200 && l < 1000).length;
  const largeParagraphs = lengths.filter(l => l >= 1000 && l < 3000).length;
  const hugeParagraphs = lengths.filter(l => l >= 3000).length;

  console.log(`  < 200 chars: ${smallParagraphs}`);
  console.log(`  200-1000 chars: ${mediumParagraphs}`);
  console.log(`  1000-3000 chars: ${largeParagraphs}`);
  console.log(`  3000+ chars: ${hugeParagraphs}`);
}

/**
 * Main test function
 */
async function main() {
  const sourceId = process.argv[2];

  if (!sourceId) {
    console.error('❌ Error: Please provide a source ID');
    console.log('\nUsage: bun run src/rag/testChunking.ts <source-id>');
    console.log('\nAvailable sources:');
    TEXT_SOURCES.forEach(s => {
      console.log(`  ${s.id.padEnd(40)} - ${s.title} (${s.philosopher})`);
    });
    process.exit(1);
  }

  const source = TEXT_SOURCES.find(s => s.id === sourceId);
  if (!source) {
    console.error(`❌ Error: Source not found: ${sourceId}`);
    console.log('\nAvailable sources:');
    TEXT_SOURCES.forEach(s => {
      console.log(`  ${s.id.padEnd(40)} - ${s.title} (${s.philosopher})`);
    });
    process.exit(1);
  }

  console.log('═'.repeat(80));
  console.log('           Text Processing Test - Dry Run');
  console.log('═'.repeat(80));
  console.log(`\n📚 Testing: ${source.title}`);
  console.log(`   Author: ${source.author}`);
  console.log(`   Philosopher: ${source.philosopher}`);
  console.log(`   Format: ${source.format}`);
  console.log(`   URL: ${source.url}`);

  // Download the text
  console.log('\n⬇️  Downloading...');
  const downloadResult = await downloadText(source);
  if (!downloadResult.success) {
    console.error(`❌ Download failed: ${downloadResult.error}`);
    process.exit(1);
  }

  // Read the downloaded text
  console.log('📖 Reading text...');
  const text = await readDownloadedText(source.id);
  if (!text) {
    console.error('❌ Failed to read downloaded text');
    process.exit(1);
  }

  console.log(`✅ Text loaded: ${text.length.toLocaleString()} characters`);

  // Analyze paragraph structure
  analyzeParagraphStructure(text);

  // Show text samples
  showTextSample(text);

  // Chunk the text
  console.log('\n🧩 Chunking text...');
  const chunks = createChunksWithMetadata(
    text,
    source.id,
    source.philosopher,
    source.title,
    source.author
  );

  // Get and display statistics
  const stats = getChunkStats(chunks);
  console.log('\n📊 Chunking Statistics:');
  console.log('═'.repeat(80));
  console.log(`  Total chunks: ${stats.count}`);
  console.log(`  Total characters: ${stats.totalChars.toLocaleString()}`);
  console.log(`  Average chunk length: ${stats.avgLength} chars`);
  console.log(`  Minimum chunk length: ${stats.minLength} chars`);
  console.log(`  Maximum chunk length: ${stats.maxLength} chars`);
  console.log(`  Estimated tokens: ${stats.estimatedTokens.toLocaleString()}`);

  // Show chunk size distribution
  showChunkDistribution(chunks);

  // Show sample chunks
  showSampleChunks(chunks);

  console.log('\n✅ Test complete! (No data was written to the vector store)');
  console.log('═'.repeat(80));
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
