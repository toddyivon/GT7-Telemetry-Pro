// Fallback API structure for development when Convex is not running
export const api = {
  telemetry: {
    getPerformanceMetrics: { _id: 'telemetry:getPerformanceMetrics' },
    getRecentSessions: { _id: 'telemetry:getRecentSessions' },
    getUserSessions: { _id: 'telemetry:getUserSessions' },
    getSessionDetails: { _id: 'telemetry:getSessionDetails' },
    createSession: { _id: 'telemetry:createSession' },
    completeSession: { _id: 'telemetry:completeSession' },
    addLap: { _id: 'telemetry:addLap' },
    addTelemetryPoints: { _id: 'telemetry:addTelemetryPoints' },
    getTelemetryPoints: { _id: 'telemetry:getTelemetryPoints' },
    getLapTimeTrends: { _id: 'telemetry:getLapTimeTrends' },
    getSessions: { _id: 'telemetry:getSessions' },
    getSession: { _id: 'telemetry:getSession' },
    getLaps: { _id: 'telemetry:getLaps' },
  },
  analysis: {
    // Add analysis functions as needed
  },
} as const;