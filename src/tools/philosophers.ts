/**
 * Philosopher Tools
 *
 * AI tools for consulting the wisdom of history's greatest philosophers and theologians.
 * Uses the unified philosopher constants and RAG system for semantic search.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { PHILOSOPHERS, type Philosopher } from '../constants/philosophers';
import {
  PHILOSOPHER_QUERY_LIMIT,
  CONTEXT_EXPANSION_THRESHOLD,
  ADJACENT_CHUNK_WINDOW,
  CONTEXT_PREVIEW_LENGTH,
} from '../constants/rag';
import {
  getAdjacentChunks,
  isRAGInitialized,
  queryPassages,
  type QueryResult,
} from '../rag/utils/vectorStore';

// ============================================================================
// RAG INTEGRATION
// ============================================================================

/**
 * Common stop words to filter out from queries for better semantic search
 */
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'should',
  'could',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'what',
  'which',
  'who',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'both',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'no',
  'nor',
  'not',
  'only',
  'own',
  'same',
  'so',
  'than',
  'too',
  'very',
  'just',
  'etc',
  'vs',
  'via',
]);

/**
 * Enhanced query analysis that extracts key terms and cleans the query
 * Returns both the filtered query and important keywords for hybrid search
 */
function analyzeQuery(query: string): {
  filteredQuery: string;
  keywords: string[];
} {
  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Filter out stop words
  const filtered = words.filter(word => !STOP_WORDS.has(word));

  // Extract most important keywords (longer words, philosophical terms)
  const keywords = filtered
    .filter(word => word.length > 4) // Longer words are often more meaningful
    .slice(0, 5); // Limit to top 5 keywords

  // If filtering removes everything, return original
  const filteredQuery =
    filtered.length > 0 ? filtered.join(' ') : query.toLowerCase();

  return {
    filteredQuery,
    keywords,
  };
}

/**
 * Calculate BM25-like relevance score for re-ranking
 * Rewards term frequency while penalizing common terms
 */
function calculateBM25Score(
  content: string,
  queryTerms: string[],
  allResults: QueryResult[]
): number {
  if (!content || queryTerms.length === 0) return 0;

  const contentLower = content.toLowerCase();
  const contentLength = contentLower.split(/\s+/).length;

  // Calculate average content length
  const avgLength =
    allResults.reduce((sum, r) => {
      return sum + r.content.split(/\s+/).length;
    }, 0) / allResults.length;

  let score = 0;

  for (const term of queryTerms) {
    // Count exact word matches (word boundaries)
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = contentLower.match(regex);
    const termFreq = matches ? matches.length : 0;

    if (termFreq > 0) {
      // Calculate document frequency (how many results contain this term)
      const docFreq = allResults.filter(r =>
        r.content.toLowerCase().includes(term)
      ).length;

      // IDF component
      const idf = Math.log((allResults.length + 1) / (docFreq + 0.5));

      // Length normalization
      const lengthNorm = contentLength / avgLength;

      // BM25-like formula (k1=1.5, b=0.75)
      const k1 = 1.5;
      const b = 0.75;
      const numerator = termFreq * (k1 + 1);
      const denominator = termFreq + k1 * (1 - b + b * lengthNorm);

      score += idf * (numerator / denominator);
    }
  }

  return score / Math.max(1, queryTerms.length);
}

/**
 * Calculate term proximity score
 * Rewards results where query terms appear close together
 */
function calculateProximityScore(
  content: string,
  queryTerms: string[]
): number {
  if (!content || queryTerms.length <= 1) return 0;

  const contentLower = content.toLowerCase();
  const termPositions: Record<string, number[]> = {};

  // Find all positions of each term
  for (const term of queryTerms) {
    const positions: number[] = [];
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    let match;

    while ((match = regex.exec(contentLower)) !== null) {
      positions.push(match.index);
    }

    if (positions.length > 0) {
      termPositions[term] = positions;
    }
  }

  const termsFound = Object.keys(termPositions);
  if (termsFound.length <= 1) return 0;

  let totalProximity = 0;
  let pairCount = 0;

  // Calculate minimum distance between all term pairs
  for (let i = 0; i < termsFound.length - 1; i++) {
    for (let j = i + 1; j < termsFound.length; j++) {
      const term1 = termsFound[i];
      const term2 = termsFound[j];
      if (!term1 || !term2) continue;

      const positions1 = termPositions[term1];
      const positions2 = termPositions[term2];
      if (!positions1 || !positions2) continue;

      let minDistance = Infinity;

      for (const pos1 of positions1) {
        for (const pos2 of positions2) {
          minDistance = Math.min(minDistance, Math.abs(pos1 - pos2));
        }
      }

      // Score based on proximity (closer = better, max distance = 300 chars)
      if (minDistance < 300) {
        totalProximity += 1 - minDistance / 300;
      }

      pairCount++;
    }
  }

  return pairCount > 0 ? totalProximity / pairCount : 0;
}

/**
 * Enhanced re-ranking with multiple scoring factors
 */
function reRankResults(
  results: QueryResult[],
  query: string,
  keywords: string[]
): QueryResult[] {
  if (results.length === 0) return results;

  const queryTerms = [...keywords, ...query.toLowerCase().split(/\s+/)].filter(
    (term, index, arr) => term.length > 2 && arr.indexOf(term) === index
  );

  // Calculate enhanced scores
  const scoredResults = results.map(result => {
    let enhancedScore = result.relevanceScore;

    // BM25 scoring (weight: 0.3)
    const bm25 = calculateBM25Score(result.content, queryTerms, results);
    enhancedScore += 0.3 * bm25;

    // Term proximity scoring (weight: 0.15)
    const proximity = calculateProximityScore(result.content, queryTerms);
    enhancedScore += 0.15 * proximity;

    // Content quality bonus
    const wordCount = result.content.split(/\s+/).length;
    if (wordCount > 100) {
      enhancedScore += 0.05; // Bonus for substantial content
    } else if (wordCount < 20) {
      enhancedScore -= 0.05; // Penalty for very short content
    }

    return {
      ...result,
      relevanceScore: enhancedScore,
    };
  });

  // Sort by enhanced score
  return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Remove duplicate or highly similar results
 */
function deduplicateResults(results: QueryResult[]): QueryResult[] {
  if (results.length <= 1) return results;

  const unique: QueryResult[] = [];

  for (const result of results) {
    let isDuplicate = false;

    for (const existing of unique) {
      // Check for same source and adjacent chunks
      if (
        result.sourceId === existing.sourceId &&
        Math.abs(result.chunkIndex - existing.chunkIndex) <= 1
      ) {
        // Calculate content overlap
        const words1 = new Set(
          result.content
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3)
        );
        const words2 = new Set(
          existing.content
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 3)
        );

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        const overlap = intersection.size / union.size;

        if (overlap > 0.6) {
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      unique.push(result);
    }
  }

  return unique;
}

/**
 * Query the RAG system for relevant passages with expanded context
 * Uses query augmentation and adjacent chunk retrieval for better results
 */
async function queryRAG(
  philosopherKey: string,
  topic: string
): Promise<{ found: boolean; passages: string }> {
  try {
    // Check if RAG is initialized
    if (!(await isRAGInitialized())) {
      return { found: false, passages: '' };
    }

    // Enhanced query analysis
    const { filteredQuery, keywords } = analyzeQuery(topic);

    // Query for relevant passages using filtered query
    // Fetch more results initially for better re-ranking
    const initialResults = await queryPhilosopher(
      philosopherKey,
      filteredQuery,
      PHILOSOPHER_QUERY_LIMIT * 2
    );

    if (initialResults.length === 0) {
      return { found: false, passages: '' };
    }

    // Re-rank results with enhanced scoring
    const rerankedResults = reRankResults(initialResults, topic, keywords);

    // Remove duplicates
    const uniqueResults = deduplicateResults(rerankedResults);

    // Take top results after re-ranking and deduplication
    const results = uniqueResults.slice(0, PHILOSOPHER_QUERY_LIMIT);

    // Format the results with expanded context for high-relevance matches
    let passages = `\n### 📚 Relevant Passages from Primary Sources\n`;
    passages += `*Query: "${topic}"`;
    if (filteredQuery !== topic.toLowerCase() && keywords.length > 0) {
      passages += ` (key terms: ${keywords.join(', ')})`;
    }
    passages += ` — Found ${results.length} relevant passages*\n`;

    for (const result of results) {
      const relevancePercent = (result.relevanceScore * 100).toFixed(0);
      passages += `\n**From "${result.title}"** *(${relevancePercent}% match)*\n`;

      // For high-relevance results, fetch surrounding context
      if (result.relevanceScore > CONTEXT_EXPANSION_THRESHOLD) {
        try {
          const adjacentChunks = await getAdjacentChunks(
            result.sourceId,
            result.chunkIndex,
            ADJACENT_CHUNK_WINDOW
          );

          // Find preceding and following context
          const preceding = adjacentChunks.find(
            c => c.chunkIndex === result.chunkIndex - 1
          );
          const following = adjacentChunks.find(
            c => c.chunkIndex === result.chunkIndex + 1
          );

          if (preceding) {
            // Show last N chars of preceding context
            const previewText = preceding.content
              .slice(-CONTEXT_PREVIEW_LENGTH)
              .trim();
            passages += `> [...] ${previewText}\n>\n`;
          }

          passages += `> ${result.content}\n`;

          if (following) {
            // Show first N chars of following context
            const previewText = following.content
              .slice(0, CONTEXT_PREVIEW_LENGTH)
              .trim();
            passages += `>\n> ${previewText} [...]\n`;
          }
        } catch {
          // Fall back to just the main passage
          passages += `> ${result.content}\n`;
        }
      } else {
        passages += `> ${result.content}\n`;
      }
    }

    return { found: true, passages };
  } catch (error) {
    // RAG not available - fall back to static content
    console.log('[Philosopher Tool] RAG not available, using static content');
    return { found: false, passages: '' };
  }
}

// ============================================================================
// TOOL FACTORY
// ============================================================================

/**
 * Create a philosopher tool from the unified constants
 */
function createPhilosopherTool(key: string, philosopher: Philosopher) {
  return tool({
    description: `Consult the wisdom of ${philosopher.name} (${philosopher.era}). ${philosopher.description} Expert in: ${philosopher.areasOfExpertise.join(', ')}.`,
    inputSchema: z.object({
      topic: z
        .string()
        .describe(
          `The philosophical, ethical, or spiritual topic to explore through the lens of ${philosopher.name}'s teachings`
        ),
      includeExcerpts: z
        .boolean()
        .optional()
        .describe('Include key excerpts from primary sources (default: true)'),
      includeSources: z
        .boolean()
        .optional()
        .describe('Include links to primary source texts (default: true)'),
    }),
    execute: async ({
      topic,
      includeExcerpts = true,
      includeSources = true,
    }) => {
      let output = `## ${philosopher.name} (${philosopher.era})\n`;
      output += `*${philosopher.tradition}*\n\n`;
      output += `### About\n${philosopher.description}\n\n`;

      output += `### Key Teachings\n`;
      philosopher.keyTeachings.forEach(teaching => {
        output += `- ${teaching}\n`;
      });

      // Key Concepts with detailed explanations
      output += `\n### Key Concepts\n`;
      philosopher.keyConcepts.forEach(concept => {
        output += `\n**${concept.name}**\n`;
        output += `${concept.explanation}\n`;
        if (concept.relatedTerms && concept.relatedTerms.length > 0) {
          output += `*Related: ${concept.relatedTerms.join(', ')}*\n`;
        }
      });

      output += `\n### Notable Works\n`;
      philosopher.notableWorks.forEach(work => {
        output += `- ${work}\n`;
      });

      // Primary Sources with URLs
      if (includeSources && philosopher.textSources.length > 0) {
        output += `\n### Primary Source Texts\n`;
        philosopher.textSources.forEach(source => {
          output += `- **[${source.title}](${source.url})**`;
          if (source.description) {
            output += ` — ${source.description}`;
          }
          output += `\n`;
        });
      }

      // RAG-powered relevant passages (semantic search through primary sources)
      const ragResult = await queryRAG(key, topic);
      if (ragResult.found) {
        output += ragResult.passages;
      }

      // Key Excerpts from works (static, curated excerpts)
      if (includeExcerpts && philosopher.keyExcerpts.length > 0) {
        output += `\n### Curated Key Excerpts\n`;
        philosopher.keyExcerpts.forEach(excerpt => {
          output += `\n**${excerpt.work}**\n`;
          output += `> "${excerpt.passage}"\n`;
          if (excerpt.context) {
            output += `*Context: ${excerpt.context}*\n`;
          }
        });
      }

      output += `\n### Famous Quotes\n`;
      philosopher.famousQuotes.forEach(quote => {
        output += `> "${quote}"\n\n`;
      });

      output += `\n---\n`;
      output += `**Topic requested:** "${topic}"\n\n`;
      output += `*Use this comprehensive context—including ${philosopher.name}'s key concepts, semantically-searched passages from their works, and philosophical tradition—to formulate a thoughtful response that authentically reflects their perspective.*`;

      return output;
    },
  });
}

// ============================================================================
// PHILOSOPHER TOOL GENERATION
// ============================================================================

/**
 * Programmatically create all philosopher tools from the PHILOSOPHERS object.
 * This eliminates the need to manually export each philosopher tool.
 * Simply add a philosopher to the PHILOSOPHERS constant and it will automatically
 * be available as a tool.
 */
export const philosopherTools = Object.entries(PHILOSOPHERS).reduce(
  (tools, [key, philosopher]) => {
    tools[key] = createPhilosopherTool(key, philosopher);
    return tools;
  },
  {} as Record<string, ReturnType<typeof createPhilosopherTool>>
);

/**
 * Get the list of all available philosopher tool names
 */
export function getAvailablePhilosophers(): string[] {
  return Object.keys(philosopherTools);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Query a specific philosopher's texts for relevant passages
 */
export async function queryPhilosopher(
  philosopher: string,
  topic: string,
  limit: number = 5
): Promise<QueryResult[]> {
  return queryPassages(topic, { philosopher, limit });
}

/**
 * Query all philosophers for relevant passages
 */
export async function queryAllPhilosophers(
  topic: string,
  limit: number = 5
): Promise<QueryResult[]> {
  return queryPassages(topic, { limit });
}
