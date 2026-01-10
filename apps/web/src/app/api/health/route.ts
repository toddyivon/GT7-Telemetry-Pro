export async function GET() {
  try {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'gt7-data-analysis',
      version: process.env.npm_package_version || '0.1.0'
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}