interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
  timestamp: string | null;
}

interface BackupManagementProps {
  backups: BackupFile[];
  operationInProgress: boolean;
  onCreateBackup: () => void;
  onDownloadBackup: (filename: string) => void;
}

export function BackupManagement({
  backups,
  operationInProgress,
  onCreateBackup,
  onDownloadBackup,
}: BackupManagementProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">
        Backup Management
      </h2>
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="mb-4">
          <button
            onClick={onCreateBackup}
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
                  <tr key={backup.filename} className="border-b border-border">
                    <td className="py-2 text-text">{backup.filename}</td>
                    <td className="py-2 text-text">{backup.sizeFormatted}</td>
                    <td className="py-2 text-text">
                      {new Date(backup.created).toLocaleString()}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => onDownloadBackup(backup.filename)}
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
  );
}

