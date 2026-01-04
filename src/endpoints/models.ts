import { getAvailableModelProviders, modelProviders } from '../utils/providers';
import { LLM_MODEL } from '../constants/providers';

export const models = {
  GET: async (req: Request) => {
    try {
      const url = new URL(req.url);
      const availableOnly = url.searchParams.get('available') === 'true';

      const providers = availableOnly
        ? await getAvailableModelProviders()
        : await modelProviders();

      // Return simplified version without the actual model objects
      const response = {
        defaultModel: LLM_MODEL,
        models: providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          available: provider.available,
          costPerToken: provider.costPerToken,
        })),
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[Models] Error fetching model providers:', error);
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
