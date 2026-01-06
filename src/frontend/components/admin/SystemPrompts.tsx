import { useState, useEffect } from 'react';
import { PhilosopherMultiSelect } from '../PhilosopherMultiSelect';

interface PromptData {
  prompt: string;
  tokenCount: number;
  characterCount: number;
  philosopherId: string;
  philosopherName: string;
  availablePhilosophers: Array<{
    id: string;
    name: string;
    tradition: string;
  }>;
  timestamp: string;
}

export function SystemPrompts() {
  const [promptData, setPromptData] = useState<PromptData | null>(null);
  const [selectedPhilosophers, setSelectedPhilosophers] = useState<string[]>(
    []
  );
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [philosophers, setPhilosophers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Fetch philosophers list on mount
  useEffect(() => {
    const fetchPhilosophers = async () => {
      try {
        const response = await fetch('/api/philosophers');
        if (response.ok) {
          const data = await response.json();
          setPhilosophers(data.philosophers);
        }
      } catch (error) {
        console.error('Failed to fetch philosophers:', error);
      }
    };
    fetchPhilosophers();
  }, []);

  const loadPrompt = async (philosopherIds?: string[]) => {
    try {
      setLoadingPrompt(true);
      const token = localStorage.getItem('auth_token');
      const url =
        philosopherIds && philosopherIds.length > 0
          ? `/admin/prompts?philosopherIds=${philosopherIds.join(',')}`
          : '/admin/prompts';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPromptData(data);
    } catch (error) {
      console.error('Failed to load prompt:', error);
    } finally {
      setLoadingPrompt(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">System Prompts</h2>
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-text mb-2">
            Select Philosophers (or leave empty for default)
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <PhilosopherMultiSelect
                philosophers={philosophers}
                selected={selectedPhilosophers}
                onChange={setSelectedPhilosophers}
              />
            </div>
            <button
              onClick={() => loadPrompt(selectedPhilosophers)}
              disabled={loadingPrompt}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {loadingPrompt ? 'Loading...' : 'Load Prompt'}
            </button>
          </div>
          {selectedPhilosophers.length > 0 && (
            <p className="text-xs text-text-muted mt-2">
              {selectedPhilosophers.length} philosopher
              {selectedPhilosophers.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {promptData && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-text-muted text-sm">Token Count</div>
                <div className="text-2xl font-bold text-text mt-1">
                  {promptData.tokenCount.toLocaleString()}
                </div>
              </div>
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-text-muted text-sm">Character Count</div>
                <div className="text-2xl font-bold text-text mt-1">
                  {promptData.characterCount.toLocaleString()}
                </div>
              </div>
              <div className="bg-background border border-border rounded-lg p-3">
                <div className="text-text-muted text-sm">Selected Prompt</div>
                <div className="text-lg font-bold text-text mt-1 truncate">
                  {promptData.philosopherName}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-md font-semibold text-text">
                  Prompt Content
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(promptData.prompt);
                    alert('Prompt copied to clipboard!');
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="bg-gray-900 border border-border rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {promptData.prompt}
                </pre>
              </div>
            </div>

            <div className="mt-2 text-xs text-text-muted">
              Last updated: {new Date(promptData.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {!promptData && !loadingPrompt && (
          <div className="text-text-muted text-sm text-center py-8">
            Select a philosopher and click "Load Prompt" to view the system
            prompt and token count.
          </div>
        )}
      </div>
    </section>
  );
}
