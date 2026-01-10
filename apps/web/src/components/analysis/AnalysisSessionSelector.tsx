'use client';

interface Session {
  id: string;
  sessionName: string;
  carModel: string;
  track: string;
  date: string;
  bestLapTime: string;
  totalLaps: number;
}

interface AnalysisSessionSelectorProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export default function AnalysisSessionSelector({
  sessions,
  selectedSessionId,
  onSelectSession,
}: AnalysisSessionSelectorProps) {
  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">No sessions available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload telemetry data to get started
          </p>
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className={`p-3 rounded-md border cursor-pointer transition-colors ${
              selectedSessionId === session.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {session.sessionName}
              </h3>
              <span className="text-xs text-gray-500">{session.date}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Track:</span>
                <span className="font-medium">{session.track}</span>
              </div>
              <div className="flex justify-between">
                <span>Car:</span>
                <span className="font-medium">{session.carModel}</span>
              </div>
              <div className="flex justify-between">
                <span>Best Lap:</span>
                <span className="font-medium text-green-600">{session.bestLapTime}</span>
              </div>
              <div className="flex justify-between">
                <span>Laps:</span>
                <span className="font-medium">{session.totalLaps}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
