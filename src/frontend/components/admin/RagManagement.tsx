interface RagManagementProps {
  operationInProgress: boolean;
  refreshing: boolean;
  onReseed: () => void;
  onClear: () => void;
  onRefresh: () => void;
}

export function RagManagement({
  operationInProgress,
  refreshing,
  onReseed,
  onClear,
  onRefresh,
}: RagManagementProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">RAG Management</h2>
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex gap-3 mb-4">
          <button
            onClick={onReseed}
            disabled={true}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Re-seed Database
          </button>
          <button
            onClick={onClear}
            disabled={true}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Clear RAG Data
          </button>
          <button
            onClick={onRefresh}
            disabled={operationInProgress || refreshing}
            className="px-4 py-2 bg-surface border border-border text-text rounded-md hover:bg-surface-hover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
        <div className="text-xs text-text-muted">
          <p>
            <strong>Re-seed:</strong> Clear and re-index all philosopher texts.
            Takes 5-10 minutes.
          </p>
          <p className="mt-1">
            <strong>Clear:</strong> Remove all RAG data from the database. Use
            before restoring a backup.
          </p>
        </div>
      </div>
    </section>
  );
}

