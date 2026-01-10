'use client';

import Link from 'next/link';

interface SessionCardProps {
  session: {
    id: string;
    sessionName: string;
    carModel: string;
    track: string;
    date: string;
    bestLapTime: string;
    totalLaps: number;
  };
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold truncate">{session.sessionName}</h3>
        <span className="text-sm text-gray-500">{session.date}</span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Track:</span>
          <span className="font-medium">{session.track}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Car:</span>
          <span className="font-medium">{session.carModel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Best Lap:</span>
          <span className="font-medium text-green-600">{session.bestLapTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Laps:</span>
          <span className="font-medium">{session.totalLaps}</span>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Link 
          href={`/analysis/${session.id}`} 
          className="flex-1 btn btn-primary text-center text-sm"
        >
          Analyze
        </Link>
        <Link 
          href={`/telemetry/${session.id}`} 
          className="flex-1 btn btn-secondary text-center text-sm"
        >
          View Data
        </Link>
      </div>
    </div>
  );
}
