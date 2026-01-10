'use client';

import { useState } from 'react';
import Link from 'next/link';
import TelemetrySessionsTable from '@/components/telemetry/TelemetrySessionsTable';

export default function TelemetryPage() {
  // In a real application, this data would come from Convex database
  const [sessions, setSessions] = useState([
    {
      id: '1',
      sessionName: 'Nurburgring GP - Time Trial',
      carModel: 'Porsche 911 GT3 RS',
      track: 'Nurburgring GP',
      date: '2025-05-24',
      bestLapTime: '1:54.328',
      totalLaps: 12,
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      sessionName: 'Monza - Practice',
      carModel: 'Ferrari 488 GT3',
      track: 'Monza',
      date: '2025-05-22',
      bestLapTime: '1:48.765',
      totalLaps: 8,
      fileSize: '1.8 MB',
    },
    {
      id: '3',
      sessionName: 'Suzuka - Race',
      carModel: 'Honda NSX GT3',
      track: 'Suzuka Circuit',
      date: '2025-05-20',
      bestLapTime: '2:01.432',
      totalLaps: 15,
      fileSize: '3.6 MB',
    },
    {
      id: '4',
      sessionName: 'Laguna Seca - Time Trial',
      carModel: 'Chevrolet Corvette C7.R',
      track: 'Laguna Seca',
      date: '2025-05-18',
      bestLapTime: '1:27.891',
      totalLaps: 10,
      fileSize: '2.1 MB',
    },
    {
      id: '5',
      sessionName: 'Spa-Francorchamps - Race',
      carModel: 'Mercedes-AMG GT3',
      track: 'Spa-Francorchamps',
      date: '2025-05-15',
      bestLapTime: '2:18.543',
      totalLaps: 18,
      fileSize: '4.2 MB',
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Telemetry Sessions</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link
            href="/telemetry/upload"
            className="btn btn-primary text-center"
          >
            Upload Telemetry
          </Link>
          <Link
            href="/telemetry/connect"
            className="btn btn-secondary text-center"
          >
            Connect to PS5
          </Link>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="track-filter" className="form-label">
              Track
            </label>
            <select
              id="track-filter"
              className="form-input"
              defaultValue=""
            >
              <option value="">All Tracks</option>
              <option value="nurburgring">Nurburgring GP</option>
              <option value="monza">Monza</option>
              <option value="suzuka">Suzuka Circuit</option>
              <option value="laguna-seca">Laguna Seca</option>
              <option value="spa">Spa-Francorchamps</option>
            </select>
          </div>
          <div>
            <label htmlFor="car-filter" className="form-label">
              Car
            </label>
            <select
              id="car-filter"
              className="form-input"
              defaultValue=""
            >
              <option value="">All Cars</option>
              <option value="porsche">Porsche 911 GT3 RS</option>
              <option value="ferrari">Ferrari 488 GT3</option>
              <option value="honda">Honda NSX GT3</option>
              <option value="corvette">Chevrolet Corvette C7.R</option>
              <option value="mercedes">Mercedes-AMG GT3</option>
            </select>
          </div>
          <div>
            <label htmlFor="date-filter" className="form-label">
              Date Range
            </label>
            <select
              id="date-filter"
              className="form-input"
              defaultValue="recent"
            >
              <option value="recent">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <TelemetrySessionsTable sessions={sessions} />
      </div>
    </div>
  );
}
