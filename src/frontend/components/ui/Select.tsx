import { useState, useEffect, useRef } from 'react';

interface SelectOption {
  id: string;
  name: string;
}

interface SelectProps {
  options: SelectOption[];
  selected: string | null;
  onChange: (selected: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  emptyValue?: string | null;
  openUpward?: boolean;
  disabled?: boolean;
}

export function Select({
  options,
  selected,
  onChange,
  placeholder = 'Select item',
  emptyText = 'Default',
  emptyValue = null,
  openUpward = false,
  disabled = false,
}: SelectProps) {
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

  const handleSelect = (value: string | null) => {
    onChange(value);
    setIsOpen(false);
  };

  const getSelectedName = () => {
    if (!selected) return emptyText;
    return options.find(o => o.id === selected)?.name || emptyText;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text text-left focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">{getSelectedName()}</span>
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

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
          }}
        >
          <div className="p-1">
            <button
              type="button"
              onClick={() => handleSelect(emptyValue)}
              className={`w-full text-left px-3 py-2 hover:bg-surface-secondary rounded transition-colors ${
                !selected ? 'bg-surface-secondary' : ''
              }`}
            >
              <span className="text-sm text-text">{emptyText}</span>
            </button>
            {options.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-3 py-2 hover:bg-surface-secondary rounded transition-colors ${
                  selected === option.id ? 'bg-surface-secondary' : ''
                }`}
              >
                <span className="text-sm text-text">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

