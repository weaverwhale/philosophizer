import { readDownloadedText } from '../rag/utils/downloader';
import { getAllTextSources } from '../constants/philosophers';
import { getPhilosopher } from '../constants/philosophers';

/**
 * Texts endpoint - serves/downloads text files
 */
export const textsEndpoint = {
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const sourceId = url.pathname.split('/').pop();

      if (!sourceId) {
        return new Response(JSON.stringify({ error: 'Missing source ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get source information for filename
      const allSources = getAllTextSources();
      const source = allSources.find(s => s.id === sourceId);

      if (!source) {
        return new Response(JSON.stringify({ error: 'Source not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Read the text file
      const text = await readDownloadedText(sourceId);

      if (!text) {
        return new Response(
          JSON.stringify({
            error: 'Text file not found or not yet downloaded',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Get philosopher name for filename
      const philosopher = getPhilosopher(source.philosopher);
      const philosopherName = philosopher?.name || source.philosopher;

      // Create a safe filename
      const safeTitle = source.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const safePhilosopher = philosopherName
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      const filename = `${safeTitle}-${safePhilosopher}.txt`;

      // Return text file with download headers
      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error) {
      console.error('Texts endpoint error:', error);
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
