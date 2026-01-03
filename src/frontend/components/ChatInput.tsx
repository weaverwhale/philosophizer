import { useEffect, useRef } from 'react';

interface ChatInputProps {
  input: string;
  isProcessing: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  selectedPhilosopher?: string | null;
  philosopherName?: string | null;
}

export function ChatInput({
  input,
  isProcessing,
  onInputChange,
  onSubmit,
  onStop,
  selectedPhilosopher,
  philosopherName,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea as the user types (up to a max height).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits, Shift+Enter inserts newline.
    if (e.key !== 'Enter' || e.shiftKey) return;
    if ((e.nativeEvent as any)?.isComposing) return;

    e.preventDefault();
    if (isProcessing || !input.trim()) return;
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <div className="relative flex items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedPhilosopher && philosopherName
              ? `Ask ${philosopherName} anything...`
              : 'Ask anything...'
          }
          rows={1}
          className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none overflow-y-auto no-scrollbar max-h-[240px]"
        />
        {isProcessing ? (
          <button
            type="button"
            onClick={() => {
              onStop?.();
            }}
            className="cursor-pointer absolute right-2 bottom-[6px] p-2 text-text-muted hover:text-red-500 transition-colors"
            title="Stop generating"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="cursor-pointer absolute right-2 bottom-[6px] p-2 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
