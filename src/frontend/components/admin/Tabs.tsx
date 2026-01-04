import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab Headers */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="flex overflow-x-auto px-4 gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 p-3 font-medium whitespace-nowrap cursor-pointer
                  ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary bg-background'
                      : 'text-text-muted border-b-2 border-transparent hover:text-text hover:bg-surface-hover'
                  }
                `}
              >
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={activeTab === tab.id ? 'block' : 'hidden'}
          >
            <div className="max-w-6xl mx-auto px-4 py-8">{tab.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
