import {
  queryPassages,
  getCollectionStats,
  type QueryResult,
  type QueryOptions,
} from '../rag/utils/vectorStore';

export interface RagQueryRequest extends QueryOptions {
  query: string;
}

export interface RagQueryResponse {
  results: QueryResult[];
  query: string;
  elapsed: number;
}

export interface RagStatsResponse {
  totalChunks: number;
  byPhilosopher: Record<string, number>;
  bySource: Record<string, number>;
}

export const rag = {
  /**
   * POST /rag - Query the vector store for relevant passages
   */
  POST: async (req: Request) => {
    try {
      const body = (await req.json()) as RagQueryRequest;

      // Return empty results if query is missing or empty
      if (typeof body.query !== 'string' || !body.query.trim()) {
        const response: RagQueryResponse = {
          results: [],
          query: body.query || '',
          elapsed: 0,
        };
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const startTime = Date.now();
      const query = body.query.trim();

      const results = await queryPassages(query, body);
      const elapsed = Date.now() - startTime;

      const response: RagQueryResponse = {
        results,
        query: body.query,
        elapsed,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('RAG query error:', error);
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
   * GET /rag - Get collection statistics
   */
  GET: async (_req: Request) => {
    try {
      const stats = await getCollectionStats();

      const response: RagStatsResponse = {
        totalChunks: stats.totalChunks,
        byPhilosopher: stats.byPhilosopher,
        bySource: stats.bySource,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('RAG stats error:', error);
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
