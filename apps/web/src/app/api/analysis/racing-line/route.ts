// Import mock data instead of trying to connect to Convex
import { mockAnalysisResults, mockLapData } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lapId = searchParams.get('lapId');
  
  if (!lapId) {
    return new Response(
      JSON.stringify({ error: 'lapId query parameter is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    // Find the lap data
    const lap = mockLapData.find(l => l._id === lapId);
    if (!lap) {
      return new Response(
        JSON.stringify({ error: 'Lap not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Find the racing line analysis for this lap's session
    const analysis = mockAnalysisResults.find(
      a => a.sessionId === lap.sessionId && a.analysisType === 'racing_line'
    );

    // Create mock racing line data structure
    const racingLineData = {
      lap: {
        lapNumber: lap.lapNumber,
        lapTime: lap.lapTime
      },
      corners: [
        {
          cornerNumber: 1,
          entrySpeed: 180.5,
          apexSpeed: 95.2,
          exitSpeed: 165.8,
          minSpeed: 92.1,
          speedDelta: 2.8,
          brakePointDistance: 85.4,
          entryBrake: 0.85,
          entryThrottle: 0.0,
          apexThrottle: 0.15,
          exitThrottle: 0.92,
          turnInPoint: { x: 100, y: 200, z: 0 },
          apexPoint: { x: 120, y: 180, z: 0 },
          exitPoint: { x: 140, y: 200, z: 0 }
        },
        {
          cornerNumber: 2,
          entrySpeed: 165.3,
          apexSpeed: 110.7,
          exitSpeed: 142.1,
          minSpeed: 108.2,
          speedDelta: -1.5,
          brakePointDistance: 72.1,
          entryBrake: 0.75,
          entryThrottle: 0.0,
          apexThrottle: 0.25,
          exitThrottle: 0.88,
          turnInPoint: { x: 300, y: 150, z: 0 },
          apexPoint: { x: 320, y: 130, z: 0 },
          exitPoint: { x: 340, y: 150, z: 0 }
        }
      ],
      entryExitPoints: [
        {
          cornerNumber: 1,
          entry: { x: 100, y: 200, z: 0 },
          apex: { x: 120, y: 180, z: 0 },
          exit: { x: 140, y: 200, z: 0 }
        },
        {
          cornerNumber: 2,
          entry: { x: 300, y: 150, z: 0 },
          apex: { x: 320, y: 130, z: 0 },
          exit: { x: 340, y: 150, z: 0 }
        }
      ],
      idealLine: analysis?.result?.optimalLine || [
        { position: { x: 50, y: 250, z: 0 }, speed: 120 },
        { position: { x: 100, y: 200, z: 0 }, speed: 180 },
        { position: { x: 120, y: 180, z: 0 }, speed: 95 },
        { position: { x: 140, y: 200, z: 0 }, speed: 165 },
        { position: { x: 200, y: 220, z: 0 }, speed: 200 },
        { position: { x: 300, y: 150, z: 0 }, speed: 165 },
        { position: { x: 320, y: 130, z: 0 }, speed: 110 },
        { position: { x: 340, y: 150, z: 0 }, speed: 142 },
        { position: { x: 400, y: 180, z: 0 }, speed: 190 }
      ],
      recommendations: [
        'Brake later into turn 1 to gain 0.3 seconds',
        'Carry more speed through turn 2 apex',
        'Earlier throttle application on exit of turn 2',
        'Use more track width on turn 1 entry'
      ]
    };
    
    return new Response(
      JSON.stringify(racingLineData),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error fetching racing line data:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch racing line data' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
