import { useState, useEffect, useRef } from 'react';

interface MultiSelectOption {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  showSelectAll?: boolean;
  openUpward?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items',
  emptyText = 'All items',
  showSelectAll = true,
  openUpward = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
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

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // max-h-64 + padding

      let top: number;
      if (openUpward) {
        top = rect.top - dropdownHeight;
      } else {
        top = rect.bottom + 4; // 4px gap
      }

      setPosition({
        top,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, openUpward]);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(p => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(options.map(p => p.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getSelectedNames = () => {
    if (selected.length === 0) return emptyText;
    if (selected.length === 1) {
      return options.find(p => p.id === selected[0])?.name || '';
    }
    return `${selected.length} ${placeholder.toLowerCase()} selected`;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
          }}
        >
          {showSelectAll && (
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
          )}
          <div className="p-1">
            {options.map(option => (
              <label
                key={option.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <span className="text-sm text-text">{option.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
