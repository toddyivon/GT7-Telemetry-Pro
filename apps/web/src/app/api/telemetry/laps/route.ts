// Import mock data instead of connecting to Convex
import { mockLapData } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'sessionId query parameter is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    // Filter laps by sessionId from mock data
    const laps = mockLapData.filter(lap => lap.sessionId === sessionId);
    
    return new Response(
      JSON.stringify(laps),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error fetching laps data:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch laps data' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
