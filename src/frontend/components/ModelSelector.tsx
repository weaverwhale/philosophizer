import { useEffect, useState } from 'react';

interface ModelProvider {
  id: string;
  name: string;
  available: boolean;
  costPerToken?: {
    prompt: number;
    completion: number;
  };
}

interface ModelsResponse {
  defaultModel: string;
  models: ModelProvider[];
}

interface ModelSelectorProps {
  selectedModel: string | null;
  onSelectModel: (modelId: string | null) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/models?available=true');
        if (response.ok) {
          const data = await response.json();
          setModelsData(data);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-text mb-2">
        AI Model
      </label>
      <p className="text-xs text-text-muted mb-3">
        Choose the AI model to use for responses. "Default Model" uses your
        configured LLM (LMStudio/Ollama).
      </p>
      <div className="relative">
        <select
          value={selectedModel || ''}
          onChange={e => onSelectModel(e.target.value || null)}
          className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer appearance-none pr-8"
          disabled={disabled || loading}
        >
          <option value="">Default Model</option>
          {modelsData?.models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
              {model.costPerToken &&
                ` ($${model.costPerToken.prompt}/$${model.costPerToken.completion} per 1M tokens)`}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
