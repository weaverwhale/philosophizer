import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { LoadingLogo } from '../components/Logo';

interface QueryResult {
  id: string;
  content: string;
  philosopher: string;
  sourceId: string;
  title: string;
  chunkIndex: number;
  relevanceScore: number;
}

interface RagQueryResponse {
  results: QueryResult[];
  query: string;
  elapsed: number;
}

interface PhilosophersData {
  philosophers: Array<{
    id: string;
    name: string;
  }>;
}

function ResultCard({ result, query }: { result: QueryResult; query: string }) {
  // Highlight query terms in content
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const words = searchQuery
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (words.length === 0) return text;

    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-primary/20 text-primary">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Truncate content for display
  const truncateContent = (content: string, maxLength: number = 500) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const downloadUrl = `/api/texts/${result.sourceId}`;
  const truncatedContent = truncateContent(result.content);
  const relevancePercent = (result.relevanceScore * 100).toFixed(1);

  return (
    <div className="bg-surface border border-border rounded-lg p-5 hover:border-border-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-text text-lg mb-1">
            {result.title}
          </h3>
          <div className="text-sm text-text-muted mb-2">
            {result.philosopher}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>Chunk #{result.chunkIndex}</span>
            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
              {relevancePercent}% relevant
            </span>
          </div>
        </div>
        <a
          href={downloadUrl}
          download
          className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all"
          title="Download text file"
        >
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
            <path d="M21 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>

      <div className="text-sm text-text-secondary leading-relaxed">
        {highlightText(truncatedContent, query)}
      </div>
    </div>
  );
}

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [resultsQuery, setResultsQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [philosopherFilter, setPhilosopherFilter] = useState<string>('');
  const [sourceIdFilter, setSourceIdFilter] = useState<string>('');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0.3);
  const [philosophers, setPhilosophers] = useState<PhilosophersData | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const isSearchingRef = useRef(false);

  // Load philosophers list for filter
  useEffect(() => {
    async function fetchPhilosophers() {
      try {
        const response = await fetch('/api/philosophers');
        if (response.ok) {
          const data = await response.json();
          setPhilosophers(data);
        }
      } catch (err) {
        console.error('Failed to fetch philosophers:', err);
      }
    }
    fetchPhilosophers();
  }, []);

  const performSearch = useCallback(async () => {
    if (isSearchingRef.current) {
      return;
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      return;
    }

    // Skip if search params haven't changed
    if (resultsQuery === searchQuery.trim()) {
      return;
    }

    const wasFocused = document.activeElement === inputRef.current;
    isSearchingRef.current = true;
    setLoading(true);
    setError(null);
    setHasSearched(false);

    try {
      const requestBody: {
        query: string;
        philosopher?: string;
        sourceId?: string;
        limit?: number;
        minScore?: number;
      } = {
        query: searchQuery.trim(),
        limit: 20,
      };

      if (philosopherFilter) requestBody.philosopher = philosopherFilter;
      if (sourceIdFilter.trim()) requestBody.sourceId = sourceIdFilter.trim();
      if (minScoreFilter > 0) requestBody.minScore = minScoreFilter;

      const response = await fetch('/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: RagQueryResponse = await response.json();
      setResults(data.results);
      setElapsed(data.elapsed);
      setResultsQuery(data.query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      isSearchingRef.current = false;
      setHasSearched(true);
      setLoading(false);
      if (wasFocused) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  }, [searchQuery, philosopherFilter, sourceIdFilter, minScoreFilter]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-surface shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all"
              title="Back to chat"
            >
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
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </a>
            <h1 className="text-lg font-semibold text-text">Search Database</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask anything - or search for passages, concepts, or topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-4 py-3 bg-surface-secondary border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-3 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Search"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Advanced Filters
            </button>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-surface-secondary border border-border rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Philosopher
                    </label>
                    <select
                      value={philosopherFilter}
                      onChange={e => setPhilosopherFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">All Philosophers</option>
                      {philosophers?.philosophers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Source ID
                    </label>
                    <input
                      type="text"
                      placeholder="Filter by source ID"
                      value={sourceIdFilter}
                      onChange={e => setSourceIdFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Min Relevance Score: {minScoreFilter.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={minScoreFilter}
                      onChange={e =>
                        setMinScoreFilter(parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {loading && (
            <div className="flex justify-center py-20">
              <LoadingLogo />
            </div>
          )}

          {error && (
            <div className="bg-error-bg border border-error-border text-error-text rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <>
              <div className="text-sm text-text-muted mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
                {resultsQuery && ` for "${resultsQuery.trim()}"`}
                {elapsed !== null && ` in ${elapsed}ms`}
              </div>
              <div className="grid gap-4">
                {results.map(result => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    query={searchQuery}
                  />
                ))}
              </div>
            </>
          )}

          {!loading &&
            !error &&
            hasSearched &&
            results.length === 0 &&
            searchQuery.trim() && (
              <div className="text-center py-12 text-text-muted">
                No results found. Try adjusting your search query or filters.
              </div>
            )}

          {!loading && !error && !hasSearched && (
            <div className="text-center py-12 text-text-muted">
              Enter a search query to explore philosophical texts and wisdom.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
