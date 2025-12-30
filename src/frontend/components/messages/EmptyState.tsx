import { Logo } from '../Logo';

interface EmptyStateProps {
  starterQuestions: string[];
  onStarterQuestion: (question: string) => void;
  selectedPhilosopher?: string | null;
  philosopherName?: string | null;
}

export function EmptyState({
  starterQuestions,
  onStarterQuestion,
  selectedPhilosopher,
  philosopherName,
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center py-8">
        <Logo />
        <h2 className="text-3xl font-semibold text-text">
          {selectedPhilosopher && philosopherName
            ? `Ask ${philosopherName}`
            : 'Ask anything about philosophy or theology'}
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-8 mx-auto">
          {starterQuestions.map(question => (
            <button
              key={question}
              onClick={() => onStarterQuestion(question)}
              className="cursor-pointer p-4 py-3 bg-surface border border-border hover:bg-surface-secondary text-text-secondary hover:text-text rounded-lg text-sm text-left transition-all"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
