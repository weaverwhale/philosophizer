import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { AdminHeader } from '../components/admin/AdminHeader';
import { SystemPrompts } from '../components/admin/SystemPrompts';
import { DatabaseStats } from '../components/admin/DatabaseStats';
import { RagManagement } from '../components/admin/RagManagement';
import { BackupManagement } from '../components/admin/BackupManagement';
import { RestorePublish } from '../components/admin/RestorePublish';
import { DockerImages } from '../components/admin/DockerImages';
import { OperationLogs } from '../components/admin/OperationLogs';
import { Tabs } from '../components/admin/Tabs';
import type { Tab } from '../components/admin/Tabs';

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

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [dockerImages, setDockerImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operationLogs, setOperationLogs] = useState('');
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [dockerImageName, setDockerImageName] = useState('');
  const [dockerRepo, setDockerRepo] = useState('');
  const [activeTab, setActiveTab] = useState('database-statistics');

  // Check if user is admin
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login', { replace: true });
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
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadBackups();
    loadDockerImages();
  }, []);

  const loadStats = async () => {
    try {
      setRefreshing(true);
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
      setRefreshing(false);
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
    // For file downloads, we need to use a regular link or fetch with blob
    // Using a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = `/admin/backups/${filename}?token=${token}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text">Loading admin panel...</div>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      id: 'database-statistics',
      label: 'Database Statistics',
      icon: '📊',
      content: (
        <>
          <DatabaseStats
            stats={stats}
            refreshing={refreshing}
            loading={loading}
          />
        </>
      ),
    },
    {
      id: 'rag',
      label: 'RAG Management',
      icon: '🧠',
      content: (
        <>
          <RagManagement
            operationInProgress={operationInProgress}
            refreshing={refreshing}
            onReseed={handleReseedRAG}
            onClear={handleClearRAG}
            onRefresh={loadStats}
          />
          {operationLogs && (
            <OperationLogs
              operationLogs={operationLogs}
              operationInProgress={operationInProgress}
            />
          )}
        </>
      ),
    },
    {
      id: 'backups',
      label: 'Backups & Docker',
      icon: '💾',
      content: (
        <>
          <BackupManagement
            backups={backups}
            operationInProgress={operationInProgress}
            onCreateBackup={handleCreateBackup}
            onDownloadBackup={handleDownloadBackup}
          />

          <RestorePublish
            backups={backups}
            selectedBackup={selectedBackup}
            dockerImageName={dockerImageName}
            operationInProgress={operationInProgress}
            onSelectedBackupChange={setSelectedBackup}
            onDockerImageNameChange={setDockerImageName}
            onRestore={handleRestoreBackup}
            onPublish={handlePublishDocker}
          />

          <DockerImages dockerImages={dockerImages} dockerRepo={dockerRepo} />

          {operationLogs && (
            <OperationLogs
              operationLogs={operationLogs}
              operationInProgress={operationInProgress}
            />
          )}
        </>
      ),
    },
    {
      id: 'prompts',
      label: 'System Prompts',
      icon: '📝',
      content: (
        <>
          <SystemPrompts />
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <AdminHeader userEmail={user?.email} />

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
