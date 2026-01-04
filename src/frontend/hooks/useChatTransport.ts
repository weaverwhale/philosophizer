import { useMemo, useRef } from 'react';
import { DefaultChatTransport } from 'ai';

interface UseChatTransportOptions {
  selectedModel: string | null;
  selectedPhilosopher: string | null;
}

/**
 * Creates a chat transport that dynamically uses the latest model and philosopher selections.
 * Uses refs internally to ensure the transport body always reads current values.
 */
export function useChatTransport({
  selectedModel,
  selectedPhilosopher,
}: UseChatTransportOptions) {
  // Use refs to capture latest values
  const selectedModelRef = useRef(selectedModel);
  const selectedPhilosopherRef = useRef(selectedPhilosopher);

  // Keep refs in sync with props
  selectedModelRef.current = selectedModel;
  selectedPhilosopherRef.current = selectedPhilosopher;

  // Create transport once - body function reads from refs
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/agent',
        headers: (): Record<string, string> => {
          const token = localStorage.getItem('auth_token');
          const headers: Record<string, string> = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          return headers;
        },
        body: () => ({
          philosopherId: selectedPhilosopherRef.current,
          modelId: selectedModelRef.current,
        }),
      }),
    []
  );

  return transport;
}
