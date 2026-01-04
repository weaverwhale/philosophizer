interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  timestamp: string | null;
}

interface RestorePublishProps {
  backups: BackupFile[];
  selectedBackup: string;
  dockerImageName: string;
  operationInProgress: boolean;
  onSelectedBackupChange: (filename: string) => void;
  onDockerImageNameChange: (name: string) => void;
  onRestore: () => void;
  onPublish: () => void;
}

export function RestorePublish({
  backups,
  selectedBackup,
  dockerImageName,
  operationInProgress,
  onSelectedBackupChange,
  onDockerImageNameChange,
  onRestore,
  onPublish,
}: RestorePublishProps) {
  return (
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
            onChange={e => onSelectedBackupChange(e.target.value)}
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
            onClick={onRestore}
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
            onChange={e => onDockerImageNameChange(e.target.value)}
            placeholder="username/philosophizer-pgvector:latest"
            className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-md text-text"
            disabled={operationInProgress}
          />
          <button
            onClick={onPublish}
            disabled={operationInProgress || !dockerImageName}
            className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            Publish Docker Image
          </button>
        </div>
      </div>
    </section>
  );
}

