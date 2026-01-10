'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Session {
  id: string;
  sessionName: string;
  carModel: string;
  track: string;
  date: string;
  bestLapTime: string;
  totalLaps: number;
  fileSize: string;
}

interface TelemetrySessionsTableProps {
  sessions: Session[];
}

export default function TelemetrySessionsTable({ sessions }: TelemetrySessionsTableProps) {
  const [sortField, setSortField] = useState<keyof Session>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Session) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortField === 'bestLapTime') {
      // Parse lap times for proper comparison (assuming format MM:SS.SSS)
      const timeA = a[sortField].split(':').reduce((acc, time) => acc * 60 + parseFloat(time), 0);
      const timeB = b[sortField].split(':').reduce((acc, time) => acc * 60 + parseFloat(time), 0);
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    }
    
    if (sortField === 'totalLaps') {
      return sortDirection === 'asc' 
        ? a[sortField] - b[sortField] 
        : b[sortField] - a[sortField];
    }
    
    const valueA = a[sortField].toString().toLowerCase();
    const valueB = b[sortField].toString().toLowerCase();
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: keyof Session }) => {
    if (field !== sortField) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('sessionName')}
            >
              Session Name
              <SortIcon field="sessionName" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('track')}
            >
              Track
              <SortIcon field="track" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('carModel')}
            >
              Car
              <SortIcon field="carModel" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('date')}
            >
              Date
              <SortIcon field="date" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('bestLapTime')}
            >
              Best Lap
              <SortIcon field="bestLapTime" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort('totalLaps')}
            >
              Laps
              <SortIcon field="totalLaps" />
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Size
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {sortedSessions.map((session) => (
            <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Link 
                  href={`/telemetry/${session.id}`}
                  className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                >
                  {session.sessionName}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {session.track}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {session.carModel}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {session.date}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                {session.bestLapTime}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {session.totalLaps}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {session.fileSize}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-3">
                  <Link
                    href={`/analysis/${session.id}`}
                    className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                  >
                    Analyze
                  </Link>
                  <Link
                    href={`/telemetry/${session.id}`}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    View
                  </Link>
                  <button
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    onClick={() => {
                      // Handle delete functionality here
                      alert(`Delete session ${session.id}`);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
