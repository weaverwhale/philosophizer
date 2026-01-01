import { useState, useEffect } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

interface AdminStats {
  rag: {
    totalChunks: number;
    byPhilosopher: Record<string, number>;
    bySource: Record<string, number>;
  };
  database: {
    users: number;
    conversations: number;
    sizes: {
      total_size: string;
      chunks_table_size: string;
      conversations_table_size: string;
      users_table_size: string;
    };
  };
  timestamp: string;
}

interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  timestamp: string | null;
}

interface DockerImage {
  tag: string;
  lastUpdated: string;
  size: number;
  sizeFormatted: string;
  architectures: string[];
  url: string;
}

export const AdminButton = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) return null;

  return (
    <a
      href="/admin"
      className="flex items-center justify-center w-9 h-9 bg-surface border border-red-600 text-red-600  rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
      title="Admin Panel"
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
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </a>
  );
};

export function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [dockerImages, setDockerImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationLogs, setOperationLogs] = useState('');
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [dockerImageName, setDockerImageName] = useState('');
  const [dockerRepo, setDockerRepo] = useState('');

  // Check if user is admin
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetch('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (!data.user?.isAdmin) {
          alert('Access denied: Admin privileges required');
          window.location.href = '/';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadBackups();
    loadDockerImages();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/admin/backups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const loadDockerImages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/admin/docker/images', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDockerImages(data.images || []);
      setDockerRepo(data.repository || '');
    } catch (error) {
      console.error('Failed to load Docker images:', error);
    }
  };

  const handleOperation = async (
    url: string,
    method: string,
    body?: any,
    onSuccess?: () => void
  ) => {
    setOperationInProgress(true);
    setOperationLogs('Starting operation...\n');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();

      if (data.success) {
        setOperationLogs(prev => prev + '\n' + (data.logs || data.message));
        if (onSuccess) onSuccess();
      } else {
        setOperationLogs(
          prev =>
            prev + '\n❌ Error: ' + (data.logs || data.message || data.error)
        );
      }
    } catch (error) {
      setOperationLogs(
        prev =>
          prev +
          '\n❌ Error: ' +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleClearRAG = () => {
    if (
      !confirm(
        'Are you sure you want to clear ALL RAG data? This cannot be undone.'
      )
    ) {
      return;
    }
    handleOperation('/admin/rag/clear', 'POST', undefined, () => {
      loadStats();
    });
  };

  const handleReseedRAG = () => {
    if (
      !confirm(
        'Re-seeding will take hours, potentially days. ARE YOU SURE YOU WANT TO CONTINUE?'
      )
    ) {
      return;
    }
    handleOperation('/admin/rag/reseed', 'POST', undefined, () => {
      loadStats();
    });
  };

  const handleCreateBackup = () => {
    handleOperation('/admin/backup', 'POST', undefined, () => {
      loadBackups();
    });
  };

  const handleRestoreBackup = () => {
    if (!selectedBackup) {
      alert('Please select a backup file');
      return;
    }
    if (
      !confirm(
        `Restore from ${selectedBackup}? This will replace all current RAG data. ARE YOU SURE YOU WANT TO CONTINUE?`
      )
    ) {
      return;
    }
    handleOperation(
      '/admin/restore',
      'POST',
      { filename: selectedBackup },
      () => {
        loadStats();
      }
    );
  };

  const handlePublishDocker = () => {
    if (!dockerImageName) {
      alert('Please enter a Docker image name');
      return;
    }
    if (!confirm(`Publish Docker image as ${dockerImageName}?`)) {
      return;
    }
    handleOperation(
      '/admin/publish',
      'POST',
      { imageName: dockerImageName },
      () => {
        loadDockerImages();
      }
    );
  };

  const handleDownloadBackup = (filename: string) => {
    const token = localStorage.getItem('auth_token');
    window.location.href = `/admin/backups/${filename}?token=${token}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-surface sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              title="Back to chat"
            >
              ←
            </a>
            <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{user?.email}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Database Statistics Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">
              Database Statistics
            </h2>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="text-text-muted text-sm">
                    Total RAG Chunks
                  </div>
                  <div className="text-3xl font-bold text-text mt-1">
                    {stats.rag.totalChunks.toLocaleString()}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="text-text-muted text-sm">Philosophers</div>
                  <div className="text-3xl font-bold text-text mt-1">
                    {Object.keys(stats.rag.byPhilosopher).length}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="text-text-muted text-sm">Users</div>
                  <div className="text-3xl font-bold text-text mt-1">
                    {stats.database.users}
                  </div>
                </div>
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="text-text-muted text-sm">Conversations</div>
                  <div className="text-3xl font-bold text-text mt-1">
                    {stats.database.conversations}
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="mt-4 bg-surface border border-border rounded-lg p-4">
                <h3 className="text-md font-semibold text-text mb-3">
                  Database Sizes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-text-muted">Total Database</div>
                    <div className="text-text font-medium">
                      {stats.database.sizes.total_size}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted">RAG Chunks Table</div>
                    <div className="text-text font-medium">
                      {stats.database.sizes.chunks_table_size}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted">Conversations Table</div>
                    <div className="text-text font-medium">
                      {stats.database.sizes.conversations_table_size}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-muted">Users Table</div>
                    <div className="text-text font-medium">
                      {stats.database.sizes.users_table_size}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stats && Object.keys(stats.rag.byPhilosopher).length > 0 && (
              <div className="mt-4 bg-surface border border-border rounded-lg p-4">
                <h3 className="text-md font-semibold text-text mb-3">
                  Chunks by Philosopher
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                  {Object.entries(stats.rag.byPhilosopher)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, count]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-text-muted">{name}</span>
                        <span className="text-text font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* RAG Management Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">
              RAG Management
            </h2>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleReseedRAG}
                  disabled={true}
                  //disabled={operationInProgress}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Re-seed Database
                </button>
                <button
                  onClick={handleClearRAG}
                  disabled={true}
                  //disabled={operationInProgress}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Clear RAG Data
                </button>
                <button
                  onClick={loadStats}
                  disabled={operationInProgress}
                  className="px-4 py-2 bg-surface border border-border text-text rounded-md hover:bg-surface-hover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Refresh Stats
                </button>
              </div>
              <div className="text-xs text-text-muted">
                <p>
                  <strong>Re-seed:</strong> Clear and re-index all philosopher
                  texts. Takes 5-10 minutes.
                </p>
                <p className="mt-1">
                  <strong>Clear:</strong> Remove all RAG data from the database.
                  Use before restoring a backup.
                </p>
              </div>
            </div>
          </section>

          {/* Backup Management Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">
              Backup Management
            </h2>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="mb-4">
                <button
                  onClick={handleCreateBackup}
                  disabled={operationInProgress}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Create New Backup
                </button>
              </div>

              {backups.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-text-muted font-medium">
                          Filename
                        </th>
                        <th className="text-left py-2 text-text-muted font-medium">
                          Size
                        </th>
                        <th className="text-left py-2 text-text-muted font-medium">
                          Created
                        </th>
                        <th className="text-right py-2 text-text-muted font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map(backup => (
                        <tr
                          key={backup.filename}
                          className="border-b border-border"
                        >
                          <td className="py-2 text-text">{backup.filename}</td>
                          <td className="py-2 text-text">
                            {backup.sizeFormatted}
                          </td>
                          <td className="py-2 text-text">
                            {new Date(backup.created).toLocaleString()}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() =>
                                handleDownloadBackup(backup.filename)
                              }
                              className="text-primary hover:text-primary/80 text-sm transition-colors"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-text-muted text-sm">
                  No backup files found. Create a backup to get started.
                </div>
              )}
            </div>
          </section>

          {/* Restore & Publish Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">
              Restore & Publish
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Restore */}
              <div className="bg-surface border border-border rounded-lg p-4">
                <h3 className="text-md font-semibold text-text mb-3">
                  Restore from Backup
                </h3>
                <select
                  value={selectedBackup}
                  onChange={e => setSelectedBackup(e.target.value)}
                  className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-md text-text"
                  disabled={operationInProgress || backups.length === 0}
                >
                  <option value="">Select a backup file...</option>
                  {backups.map(backup => (
                    <option key={backup.filename} value={backup.filename}>
                      {backup.filename} ({backup.sizeFormatted})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRestoreBackup}
                  disabled={operationInProgress || !selectedBackup}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Restore Backup
                </button>
              </div>

              {/* Publish to Docker Hub */}
              <div className="bg-surface border border-border rounded-lg p-4">
                <h3 className="text-md font-semibold text-text mb-3">
                  Publish to Docker Hub
                </h3>
                <input
                  type="text"
                  value={dockerImageName}
                  onChange={e => setDockerImageName(e.target.value)}
                  placeholder="username/philosophizer-pgvector:latest"
                  className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-md text-text"
                  disabled={operationInProgress}
                />
                <button
                  onClick={handlePublishDocker}
                  disabled={operationInProgress || !dockerImageName}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  Publish Docker Image
                </button>
              </div>
            </div>
          </section>

          {/* Docker Hub Images Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text mb-4">
              Published Docker Images
            </h2>
            <div className="bg-surface border border-border rounded-lg p-4">
              {dockerRepo && (
                <div className="mb-4">
                  <span className="text-sm text-text-muted">Repository: </span>
                  <a
                    href={dockerImages[0]?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    {dockerRepo}
                  </a>
                </div>
              )}

              {dockerImages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-text-muted font-medium">
                          Tag
                        </th>
                        <th className="text-left py-2 text-text-muted font-medium">
                          Size
                        </th>
                        <th className="text-left py-2 text-text-muted font-medium">
                          Architectures
                        </th>
                        <th className="text-left py-2 text-text-muted font-medium">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dockerImages.map(image => (
                        <tr key={image.tag} className="border-b border-border">
                          <td className="py-2 text-text font-medium">
                            {image.tag}
                          </td>
                          <td className="py-2 text-text">
                            {image.sizeFormatted}
                          </td>
                          <td className="py-2 text-text text-xs">
                            {image.architectures.join(', ')}
                          </td>
                          <td className="py-2 text-text">
                            {new Date(image.lastUpdated).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-text-muted text-sm">
                  No Docker images found. Configure DOCKER_HUB_USERNAME and
                  DOCKER_HUB_REPO environment variables to view published
                  images.
                </div>
              )}
            </div>
          </section>

          {/* Operation Logs Section */}
          {operationLogs && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-text mb-4">
                Operation Logs
              </h2>
              <div className="bg-gray-900 border border-border rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {operationLogs}
                </pre>
                {operationInProgress && (
                  <div className="mt-2 text-yellow-400 text-xs">
                    Operation in progress...
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
