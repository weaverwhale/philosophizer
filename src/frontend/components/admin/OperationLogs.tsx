interface OperationLogsProps {
  operationLogs: string;
  operationInProgress: boolean;
}

export function OperationLogs({
  operationLogs,
  operationInProgress,
}: OperationLogsProps) {
  if (!operationLogs) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-text mb-4">Operation Logs</h2>
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
  );
}

