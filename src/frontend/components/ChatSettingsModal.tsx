import { useMemo, useEffect, useState, useRef } from 'react';
import { PHILOSOPHERS } from '../../constants/philosophers';
import {
  TRADITION_GROUP_MAP,
  TRADITION_GROUP_ORDER,
} from '../../constants/traditions';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPhilosopher: string | null;
  onSelectPhilosopher: (philosopherId: string | null) => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ChatSettingsModal({
  isOpen,
  onClose,
  selectedPhilosopher,
  onSelectPhilosopher,
  anchorRef,
}: ChatSettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  // Calculate position based on anchor button
  useEffect(() => {
    if (isOpen && anchorRef?.current && modalRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const modalRect = modalRef.current.getBoundingClientRect();

      // Position below the button
      const top = anchorRect.bottom + 8; // 8px gap

      // Center horizontally relative to button, but keep within viewport
      let left = anchorRect.left + anchorRect.width / 2 - modalRect.width / 2;

      // Ensure modal stays within viewport
      const padding = 16;
      if (left < padding) {
        left = padding;
      } else if (left + modalRect.width > window.innerWidth - padding) {
        left = window.innerWidth - modalRect.width - padding;
      }

      setPosition({ top, left });
      setIsPositioned(true);
    } else if (!isOpen) {
      setIsPositioned(false);
    }
  }, [isOpen, anchorRef]);

  // Build grouped philosophers from the PHILOSOPHERS constant
  const grouped = useMemo(() => {
    const groups: Record<string, Array<{ id: string; name: string }>> = {};

    for (const [id, philosopher] of Object.entries(PHILOSOPHERS)) {
      const displayGroup =
        TRADITION_GROUP_MAP[philosopher.tradition] || philosopher.tradition;

      if (!groups[displayGroup]) {
        groups[displayGroup] = [];
      }

      groups[displayGroup].push({
        id,
        name: philosopher.name,
      });
    }

    // Sort philosophers within each group by name
    for (const group in groups) {
      groups[group]!.sort((a, b) => a.name.localeCompare(b.name));
    }

    return groups;
  }, []);

  const selectedPhilosopherName = selectedPhilosopher
    ? PHILOSOPHERS[selectedPhilosopher]?.name
    : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Modal - Tooltip Style */}
      <div
        ref={modalRef}
        className="fixed w-80 bg-surface border border-border rounded-lg shadow-2xl z-50 max-h-[60vh] flex flex-col transition-opacity"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text">Chat Settings</h3>
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text rounded transition-colors cursor-pointer"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-4">
            {/* Philosopher/Theologian Selection */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Select a focus
              </label>
              <p className="text-xs text-text-muted mb-3">
                Select a specific philosopher/theologian to focus the
                conversation, or choose "All" for multi-perspective insights.
              </p>
              <div className="relative">
                <select
                  value={selectedPhilosopher || ''}
                  onChange={e => onSelectPhilosopher(e.target.value || null)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer appearance-none pr-8"
                >
                  <option value="">All Philosophers/Theologians</option>
                  {TRADITION_GROUP_ORDER.map(groupName => {
                    const phils = grouped[groupName];
                    if (!phils || phils.length === 0) return null;

                    return (
                      <optgroup key={groupName} label={groupName}>
                        {phils.map(phil => (
                          <option key={phil.id} value={phil.id}>
                            {phil.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
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

              {/* Current Selection Display */}
              {selectedPhilosopherName && (
                <div className="mt-3 p-3 bg-surface-secondary border border-border rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-primary mt-0.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-text">
                        {selectedPhilosopherName}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        All responses will primarily reflect{' '}
                        {selectedPhilosopherName}'s perspective and teachings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={() => onSelectPhilosopher(null)}
            disabled={!selectedPhilosopher}
            className="flex-1 px-4 py-2 bg-surface-secondary border border-border text-text rounded-lg hover:bg-surface transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
