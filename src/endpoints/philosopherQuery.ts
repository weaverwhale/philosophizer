/**
 * Philosopher Query Endpoint
 *
 * Simulates what happens when the agent calls a philosopher tool.
 * Returns the same structured data that would be passed to the agent pipeline,
 * allowing direct querying of philosophers without going through the full agent.
 */

import { z } from 'zod';
import {
  PHILOSOPHERS,
  getPhilosopher,
  type Philosopher,
} from '../constants/philosophers';
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
// TYPES
// ============================================================================

interface PhilosopherQueryRequest {
  philosopherId: string;
  topic: string;
  includeExcerpts?: boolean;
  includeSources?: boolean;
}

interface PhilosopherQueryResponse {
  philosopher: {
    id: string;
    name: string;
    era: string;
    tradition: string;
    description: string;
  };
  topic: string;
  response: {
    rawOutput: string; // Full markdown output (what the tool returns)
    structured: {
      keyTeachings: string[];
      keyConcepts: Array<{
        name: string;
        explanation: string;
        relatedTerms?: string[];
      }>;
      notableWorks: string[];
      textSources?: Array<{
        title: string;
        url: string;
        description?: string;
      }>;
      ragPassages?: Array<{
        title: string;
        content: string;
        relevanceScore: number;
        hasContext?: boolean;
      }>;
      keyExcerpts?: Array<{
        work: string;
        passage: string;
        context?: string;
      }>;
      famousQuotes: string[];
    };
  };
}

// ============================================================================
// RAG INTEGRATION
// ============================================================================

/**
 * Query the RAG system for relevant passages with expanded context
 */
async function queryRAG(
  philosopherKey: string,
  topic: string
): Promise<{
  found: boolean;
  passages: string;
  structured: Array<{
    title: string;
    content: string;
    relevanceScore: number;
    hasContext?: boolean;
  }>;
}> {
  try {
    if (!(await isRAGInitialized())) {
      return { found: false, passages: '', structured: [] };
    }

    const results = await queryPassages(topic, {
      philosopher: philosopherKey,
      limit: PHILOSOPHER_QUERY_LIMIT,
    });

    if (results.length === 0) {
      return { found: false, passages: '', structured: [] };
    }

    let passages = `\n### 📚 Relevant Passages from Primary Sources\n`;
    passages += `*Query: "${topic}" — Found ${results.length} relevant passages*\n`;

    const structured: Array<{
      title: string;
      content: string;
      relevanceScore: number;
      hasContext?: boolean;
    }> = [];

    for (const result of results) {
      const relevancePercent = (result.relevanceScore * 100).toFixed(0);
      passages += `\n**From "${result.title}"** *(${relevancePercent}% match)*\n`;

      let fullContent = result.content;
      let hasContext = false;

      // For high-relevance results, fetch surrounding context
      if (result.relevanceScore > CONTEXT_EXPANSION_THRESHOLD) {
        try {
          const adjacentChunks = await getAdjacentChunks(
            result.sourceId,
            result.chunkIndex,
            ADJACENT_CHUNK_WINDOW
          );

          const preceding = adjacentChunks.find(
            c => c.chunkIndex === result.chunkIndex - 1
          );
          const following = adjacentChunks.find(
            c => c.chunkIndex === result.chunkIndex + 1
          );

          if (preceding) {
            const previewText = preceding.content
              .slice(-CONTEXT_PREVIEW_LENGTH)
              .trim();
            passages += `> [...] ${previewText}\n>\n`;
            fullContent = `[...] ${previewText}\n\n${fullContent}`;
            hasContext = true;
          }

          passages += `> ${result.content}\n`;

          if (following) {
            const previewText = following.content
              .slice(0, CONTEXT_PREVIEW_LENGTH)
              .trim();
            passages += `>\n> ${previewText} [...]\n`;
            fullContent = `${fullContent}\n\n${previewText} [...]`;
            hasContext = true;
          }
        } catch {
          passages += `> ${result.content}\n`;
        }
      } else {
        passages += `> ${result.content}\n`;
      }

      structured.push({
        title: result.title,
        content: fullContent,
        relevanceScore: result.relevanceScore,
        hasContext,
      });
    }

    return { found: true, passages, structured };
  } catch (error) {
    console.log('[Philosopher Query] RAG not available, using static content');
    return { found: false, passages: '', structured: [] };
  }
}

// ============================================================================
// PHILOSOPHER TOOL EXECUTION
// ============================================================================

/**
 * Execute philosopher tool logic - mirrors what happens in the agent pipeline
 */
async function executePhilosopherQuery(
  key: string,
  philosopher: Philosopher,
  topic: string,
  includeExcerpts: boolean = true,
  includeSources: boolean = true
): Promise<PhilosopherQueryResponse> {
  // Build raw markdown output (what the tool returns to the agent)
  let output = `## ${philosopher.name} (${philosopher.era})\n`;
  output += `*${philosopher.tradition}*\n\n`;
  output += `### About\n${philosopher.description}\n\n`;

  output += `### Key Teachings\n`;
  philosopher.keyTeachings.forEach(teaching => {
    output += `- ${teaching}\n`;
  });

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

  // RAG-powered relevant passages
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

  // Build structured response
  return {
    philosopher: {
      id: philosopher.id,
      name: philosopher.name,
      era: philosopher.era,
      tradition: philosopher.tradition,
      description: philosopher.description,
    },
    topic,
    response: {
      rawOutput: output,
      structured: {
        keyTeachings: philosopher.keyTeachings,
        keyConcepts: philosopher.keyConcepts,
        notableWorks: philosopher.notableWorks,
        textSources: includeSources
          ? philosopher.textSources.map(s => ({
              title: s.title,
              url: s.url,
              description: s.description,
            }))
          : undefined,
        ragPassages: ragResult.found ? ragResult.structured : undefined,
        keyExcerpts: includeExcerpts ? philosopher.keyExcerpts : undefined,
        famousQuotes: philosopher.famousQuotes,
      },
    },
  };
}

// ============================================================================
// ENDPOINT
// ============================================================================

/**
 * POST /api/ask-philosopher
 *
 * Ask a specific philosopher a question and get the tool response
 * that would be returned to the agent pipeline.
 *
 * Request body:
 * {
 *   "philosopherId": "plato",
 *   "topic": "What is justice?",
 *   "includeExcerpts": true,  // optional, default true
 *   "includeSources": true    // optional, default true
 * }
 */
export const philosopherQueryEndpoint = {
  POST: async (req: Request) => {
    try {
      const body = (await req.json()) as PhilosopherQueryRequest;

      // Validate request
      if (!body.philosopherId) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: philosopherId' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (!body.topic) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: topic' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Get philosopher
      const philosopher = getPhilosopher(body.philosopherId);
      if (!philosopher) {
        return new Response(
          JSON.stringify({
            error: 'Philosopher not found',
            availablePhilosophers: Object.keys(PHILOSOPHERS),
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Execute philosopher tool logic
      const result = await executePhilosopherQuery(
        body.philosopherId,
        philosopher,
        body.topic,
        body.includeExcerpts ?? true,
        body.includeSources ?? true
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[Philosopher Query] Error:', error);
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
  },

  /**
   * GET /api/ask-philosopher?philosopherId=plato&topic=What+is+justice?
   *
   * Alternative GET endpoint for simple queries
   */
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const philosopherId = url.searchParams.get('philosopherId');
      const topic = url.searchParams.get('topic');
      const includeExcerpts =
        url.searchParams.get('includeExcerpts') !== 'false';
      const includeSources = url.searchParams.get('includeSources') !== 'false';

      if (!philosopherId) {
        return new Response(
          JSON.stringify({
            error: 'Missing required parameter: philosopherId',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      if (!topic) {
        return new Response(
          JSON.stringify({ error: 'Missing required parameter: topic' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const philosopher = getPhilosopher(philosopherId);
      if (!philosopher) {
        return new Response(
          JSON.stringify({
            error: 'Philosopher not found',
            availablePhilosophers: Object.keys(PHILOSOPHERS),
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const result = await executePhilosopherQuery(
        philosopherId,
        philosopher,
        topic,
        includeExcerpts,
        includeSources
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[Philosopher Query] Error:', error);
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
  },
};
