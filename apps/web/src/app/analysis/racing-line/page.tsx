'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RacingLineAnalysis from '@/components/analysis/RacingLineAnalysis';
import AnalysisNavigation from '@/components/analysis/AnalysisNavigation';
// Using @tanstack/react-query instead of react-query which is deprecated
import { useQuery } from '@tanstack/react-query';

function RacingLinePageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [selectedLap, setSelectedLap] = useState<string | null>(null);
  
  // Fetch laps for the session
  const { data: laps, isLoading: lapsLoading } = useQuery({
    queryKey: ['laps', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const response = await fetch(`/api/telemetry/laps?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch laps');
      }
      return response.json();
    },
    enabled: !!sessionId,
  });
  
  // Set the first lap as selected by default
  useEffect(() => {
    if (laps && laps.length > 0 && !selectedLap) {
      setSelectedLap(laps[0].id);
    }
  }, [laps, selectedLap]);
  
  if (!sessionId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Racing Line Analysis</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">No session selected</p>
          <p>Please select a telemetry session from the dashboard to analyze.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Racing Line Analysis</h1>
      
      {sessionId && <AnalysisNavigation sessionId={sessionId} />}
      
      {lapsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading lap data...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="lap-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Lap
            </label>
            <select
              id="lap-select"
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedLap || ''}
              onChange={(e) => setSelectedLap(e.target.value)}
            >
              <option value="">Select a lap</option>
              {laps?.map((lap: any) => (
                <option key={lap.id} value={lap.id}>
                  Lap {lap.lapNumber} - {(lap.lapTime / 1000).toFixed(3)}s
                </option>
              ))}
            </select>
          </div>
          
          {selectedLap ? (
            <RacingLineAnalysis 
              lapId={selectedLap}
              trackImage="/tracks/track-layout.png" // This would be dynamic in a real implementation
            />
          ) : (
            <div className="bg-gray-100 border border-gray-300 rounded-md p-8 text-center">
              <p className="text-gray-600">Please select a lap to analyze</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RacingLinePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RacingLinePageContent />
    </Suspense>
  );
}

// Force dynamic rendering to prevent prerender issues with useSearchParams
export const dynamic = 'force-dynamic';
