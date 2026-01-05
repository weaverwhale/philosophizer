import { useState, useEffect, useRef } from 'react';

interface PhilosopherMultiSelectProps {
  philosophers: Array<{ id: string; name: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function PhilosopherMultiSelect({
  philosophers,
  selected,
  onChange,
}: PhilosopherMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const togglePhilosopher = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(philosophers.map(p => p.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getSelectedNames = () => {
    if (selected.length === 0) return 'All Philosophers';
    if (selected.length === 1) {
      return philosophers.find(p => p.id === selected[0])?.name || '';
    }
    return `${selected.length} philosophers selected`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between"
      >
        <span className="truncate">{getSelectedNames()}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="sticky top-0 bg-surface border-b border-border p-2 flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="flex-1 px-2 py-1 text-xs bg-surface-secondary hover:bg-surface border border-border rounded text-text transition-colors"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 px-2 py-1 text-xs bg-surface-secondary hover:bg-surface border border-border rounded text-text transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="p-1">
            {philosophers.map(philosopher => (
              <label
                key={philosopher.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(philosopher.id)}
                  onChange={() => togglePhilosopher(philosopher.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-text">{philosopher.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
