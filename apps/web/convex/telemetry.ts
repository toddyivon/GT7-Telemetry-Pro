import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get telemetry sessions for a user
export const getUserSessions = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let sessions;

    if (args.userId) {
      const userId = args.userId;
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(50);
    } else {
      // Get recent public sessions if no user specified
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .order("desc")
        .take(20);
    }

    return sessions;
  },
});

// Get recent sessions for dashboard
export const getRecentSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

// Get session details with laps
export const getSessionDetails = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      ...session,
      laps,
    };
  },
});

// Create a new telemetry session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    trackName: v.string(),
    carModel: v.string(),
    sessionType: v.union(v.literal('practice'), v.literal('qualifying'), v.literal('race'), v.literal('time_trial')),
    weatherConditions: v.string(),
    trackCondition: v.union(v.literal('dry'), v.literal('wet'), v.literal('damp')),
    tyreFront: v.string(),
    tyreRear: v.string(),
    isPublic: v.optional(v.boolean()),
    metadata: v.optional(v.object({
      gameVersion: v.string(),
      platform: v.string(),
      recordingDevice: v.string(),
      dataQuality: v.number(),
      packetLoss: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      trackName: args.trackName,
      carModel: args.carModel,
      sessionDate: Date.now(),
      sessionType: args.sessionType,
      lapCount: 0,
      bestLapTime: 0,
      averageLapTime: 0,
      totalSessionTime: 0,
      weatherConditions: args.weatherConditions,
      trackCondition: args.trackCondition,
      tyreFront: args.tyreFront,
      tyreRear: args.tyreRear,
      fuelUsed: 0,
      topSpeed: 0,
      averageSpeed: 0,
      isCompleted: false,
      isPublic: args.isPublic || false,
      metadata: args.metadata,
    });

    return sessionId;
  },
});

// Update session when completed
export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    lapCount: v.number(),
    bestLapTime: v.number(),
    averageLapTime: v.number(),
    totalSessionTime: v.number(),
    fuelUsed: v.number(),
    topSpeed: v.number(),
    averageSpeed: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      lapCount: args.lapCount,
      bestLapTime: args.bestLapTime,
      averageLapTime: args.averageLapTime,
      totalSessionTime: args.totalSessionTime,
      fuelUsed: args.fuelUsed,
      topSpeed: args.topSpeed,
      averageSpeed: args.averageSpeed,
      isCompleted: true,
    });

    return args.sessionId;
  },
});

// Add a lap to a session
export const addLap = mutation({
  args: {
    sessionId: v.id("sessions"),
    lapNumber: v.number(),
    lapTime: v.number(),
    sector1Time: v.number(),
    sector2Time: v.number(),
    sector3Time: v.number(),
    topSpeed: v.number(),
    averageSpeed: v.number(),
    fuelRemaining: v.number(),
    tyreFrontLeft: v.number(),
    tyreFrontRight: v.number(),
    tyreRearLeft: v.number(),
    tyreRearRight: v.number(),
    isValid: v.optional(v.boolean()),
    position: v.optional(v.number()),
    weather: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lapId = await ctx.db.insert("laps", {
      sessionId: args.sessionId,
      lapNumber: args.lapNumber,
      lapTime: args.lapTime,
      sector1Time: args.sector1Time,
      sector2Time: args.sector2Time,
      sector3Time: args.sector3Time,
      topSpeed: args.topSpeed,
      averageSpeed: args.averageSpeed,
      fuelRemaining: args.fuelRemaining,
      tyreFrontLeft: args.tyreFrontLeft,
      tyreFrontRight: args.tyreFrontRight,
      tyreRearLeft: args.tyreRearLeft,
      tyreRearRight: args.tyreRearRight,
      isValid: args.isValid !== false,
      position: args.position || 1,
      weather: args.weather,
    });

    return lapId;
  },
});

// Add telemetry points for detailed analysis
export const addTelemetryPoints = mutation({
  args: {
    sessionId: v.id("sessions"),
    points: v.array(v.object({
      lapNumber: v.number(),
      timestamp: v.number(),
      gameTimestamp: v.number(),
      position: v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      }),
      velocity: v.object({
        x: v.number(),
        y: v.number(),
        z: v.number(),
      }),
      rotation: v.object({
        pitch: v.number(),
        yaw: v.number(),
        roll: v.number(),
      }),
      speed: v.number(),
      engineRPM: v.number(),
      gear: v.number(),
      throttle: v.number(),
      brake: v.number(),
      clutch: v.number(),
      steering: v.optional(v.number()),
      fuel: v.number(),
      tyrePressures: v.object({
        frontLeft: v.number(),
        frontRight: v.number(),
        rearLeft: v.number(),
        rearRight: v.number(),
      }),
      tyreTemperatures: v.object({
        frontLeft: v.number(),
        frontRight: v.number(),
        rearLeft: v.number(),
        rearRight: v.number(),
      }),
      tyreWear: v.object({
        frontLeft: v.number(),
        frontRight: v.number(),
        rearLeft: v.number(),
        rearRight: v.number(),
      }),
      engineTemperature: v.number(),
      oilTemperature: v.number(),
      waterTemperature: v.number(),
      isOnTrack: v.boolean(),
      isInPits: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // Insert telemetry points in batches for better performance
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < args.points.length; i += batchSize) {
      const batch = args.points.slice(i, i + batchSize);
      const batchPromises = batch.map(point =>
        ctx.db.insert("telemetryPoints", {
          sessionId: args.sessionId,
          ...point,
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  },
});

// Get telemetry points for analysis
export const getTelemetryPoints = query({
  args: {
    sessionId: v.id("sessions"),
    lapNumber: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("telemetryPoints")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId));

    if (args.lapNumber !== undefined) {
      const lapNumber = args.lapNumber;
      query = ctx.db
        .query("telemetryPoints")
        .withIndex("by_session_lap", (q) =>
          q.eq("sessionId", args.sessionId).eq("lapNumber", lapNumber));
    }

    const limit = args.limit || 1000;
    return await query.order("asc").take(limit);
  },
});

export const getTelemetryForLaps = query({
  args: {
    sessionId: v.id("sessions"),
    lapNumbers: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const results = [];
    for (const lapNumber of args.lapNumbers) {
      const points = await ctx.db
        .query("telemetryPoints")
        .withIndex("by_session_lap", (q) =>
          q.eq("sessionId", args.sessionId).eq("lapNumber", lapNumber))
        .order("asc")
        .collect();
      results.push(...points);
    }
    return results;
  },
});

// Get performance metrics for dashboard
export const getPerformanceMetrics = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let sessions;

    if (args.userId) {
      const userId = args.userId;
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    } else {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .collect();
    }

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalLaps: 0,
        totalDistance: 0,
        averageLapTime: 0,
        bestLapTime: 0,
        favoriteTrack: null,
        recentActivity: [],
      };
    }

    const totalSessions = sessions.length;
    const totalLaps = sessions.reduce((sum, s) => sum + s.lapCount, 0);
    const totalDistance = sessions.reduce((sum, s) => sum + (s.lapCount * 5), 0); // Approximate distance
    const validLapTimes = sessions.filter(s => s.bestLapTime > 0).map(s => s.bestLapTime);
    const averageLapTime = validLapTimes.length > 0
      ? validLapTimes.reduce((sum, time) => sum + time, 0) / validLapTimes.length
      : 0;
    const bestLapTime = validLapTimes.length > 0 ? Math.min(...validLapTimes) : 0;

    // Find favorite track
    const trackCounts = sessions.reduce((acc, s) => {
      acc[s.trackName] = (acc[s.trackName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteTrack = Object.entries(trackCounts).reduce((a, b) =>
      trackCounts[a[0]] > trackCounts[b[0]] ? a : b, Object.entries(trackCounts)[0])?.[0] || null;

    return {
      totalSessions,
      totalLaps,
      totalDistance,
      averageLapTime,
      bestLapTime,
      favoriteTrack,
      recentActivity: sessions.slice(0, 5).map(s => ({
        id: s._id,
        type: 'session',
        description: `${s.sessionType} session at ${s.trackName}`,
        timestamp: s.sessionDate,
      })),
    };
  },
});

// Get lap time trends for charts
export const getLapTimeTrends = query({
  args: {
    sessionId: v.optional(v.id("sessions")),
    userId: v.optional(v.id("users")),
    trackName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    if (args.sessionId) {
      // Get lap times for specific session
      const sessionId = args.sessionId;
      const laps = await ctx.db
        .query("laps")
        .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
        .order("asc")
        .take(limit);

      return laps.map(lap => ({
        lapNumber: lap.lapNumber,
        lapTime: lap.lapTime,
        sessionId: lap.sessionId,
      }));
    }

    let sessions;

    if (args.trackName) {
      const trackName = args.trackName;
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_track", (q) => q.eq("trackName", trackName))
        .order("desc")
        .take(limit);
    } else if (args.userId) {
      const userId = args.userId;
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    } else {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .order("desc")
        .take(limit);
    }

    return sessions
      .filter(s => s.bestLapTime > 0)
      .map(s => ({
        sessionDate: s.sessionDate,
        bestLapTime: s.bestLapTime,
        trackName: s.trackName,
        sessionId: s._id,
      }));
  },
});

// Legacy support - for backward compatibility with existing components
export const getSessions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getLaps = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get telemetry by session (all telemetry points for a session)
export const getTelemetryBySession = query({
  args: {
    sessionId: v.id("sessions"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5000;

    const points = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    // Apply offset if provided
    const startIndex = args.offset || 0;
    const paginatedPoints = points.slice(startIndex, startIndex + limit);

    return {
      points: paginatedPoints,
      total: points.length,
      hasMore: startIndex + limit < points.length,
    };
  },
});

// Get telemetry by lap (all telemetry points for a specific lap)
export const getTelemetryByLap = query({
  args: {
    sessionId: v.id("sessions"),
    lapNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", args.sessionId).eq("lapNumber", args.lapNumber))
      .order("asc")
      .collect();

    if (points.length === 0) {
      return null;
    }

    // Calculate summary statistics for this lap
    const speeds = points.map(p => p.speed);
    const throttles = points.map(p => p.throttle);
    const brakes = points.map(p => p.brake);
    const rpms = points.map(p => p.engineRPM);

    return {
      points,
      summary: {
        pointCount: points.length,
        duration: points.length > 0
          ? points[points.length - 1].timestamp - points[0].timestamp
          : 0,
        maxSpeed: Math.max(...speeds),
        minSpeed: Math.min(...speeds.filter(s => s > 0)),
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        maxThrottle: Math.max(...throttles),
        avgThrottle: throttles.reduce((a, b) => a + b, 0) / throttles.length,
        maxBrake: Math.max(...brakes),
        avgBrake: brakes.reduce((a, b) => a + b, 0) / brakes.length,
        maxRPM: Math.max(...rpms),
        avgRPM: rpms.reduce((a, b) => a + b, 0) / rpms.length,
        fuelStart: points[0].fuel,
        fuelEnd: points[points.length - 1].fuel,
        fuelUsed: points[0].fuel - points[points.length - 1].fuel,
      },
    };
  },
});

// Get session summary with aggregated telemetry data
export const getSessionSummary = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    // Get all laps
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    // Get telemetry summary (sample to avoid overloading)
    const telemetryPoints = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .take(10000);

    // Calculate telemetry statistics
    const speeds = telemetryPoints.map(p => p.speed);
    const throttles = telemetryPoints.map(p => p.throttle);
    const brakes = telemetryPoints.map(p => p.brake);
    const rpms = telemetryPoints.map(p => p.engineRPM);
    const gears = telemetryPoints.map(p => p.gear);

    // Calculate tire data
    const tireTemps = telemetryPoints.length > 0 ? {
      frontLeft: {
        min: Math.min(...telemetryPoints.map(p => p.tyreTemperatures.frontLeft)),
        max: Math.max(...telemetryPoints.map(p => p.tyreTemperatures.frontLeft)),
        avg: telemetryPoints.reduce((sum, p) => sum + p.tyreTemperatures.frontLeft, 0) / telemetryPoints.length,
      },
      frontRight: {
        min: Math.min(...telemetryPoints.map(p => p.tyreTemperatures.frontRight)),
        max: Math.max(...telemetryPoints.map(p => p.tyreTemperatures.frontRight)),
        avg: telemetryPoints.reduce((sum, p) => sum + p.tyreTemperatures.frontRight, 0) / telemetryPoints.length,
      },
      rearLeft: {
        min: Math.min(...telemetryPoints.map(p => p.tyreTemperatures.rearLeft)),
        max: Math.max(...telemetryPoints.map(p => p.tyreTemperatures.rearLeft)),
        avg: telemetryPoints.reduce((sum, p) => sum + p.tyreTemperatures.rearLeft, 0) / telemetryPoints.length,
      },
      rearRight: {
        min: Math.min(...telemetryPoints.map(p => p.tyreTemperatures.rearRight)),
        max: Math.max(...telemetryPoints.map(p => p.tyreTemperatures.rearRight)),
        avg: telemetryPoints.reduce((sum, p) => sum + p.tyreTemperatures.rearRight, 0) / telemetryPoints.length,
      },
    } : null;

    // Calculate gear usage distribution
    const gearCounts: Record<number, number> = {};
    gears.forEach(gear => {
      gearCounts[gear] = (gearCounts[gear] || 0) + 1;
    });

    const gearDistribution = Object.entries(gearCounts).map(([gear, count]) => ({
      gear: parseInt(gear),
      count,
      percentage: (count / gears.length) * 100,
    })).sort((a, b) => a.gear - b.gear);

    // Calculate braking zones (where brake > 50%)
    const brakingZones = [];
    let inBrakingZone = false;
    let zoneStart = null;

    for (let i = 0; i < telemetryPoints.length; i++) {
      if (telemetryPoints[i].brake > 50 && !inBrakingZone) {
        inBrakingZone = true;
        zoneStart = i;
      } else if (telemetryPoints[i].brake <= 50 && inBrakingZone && zoneStart !== null) {
        inBrakingZone = false;
        brakingZones.push({
          startPosition: telemetryPoints[zoneStart].position,
          endPosition: telemetryPoints[i].position,
          maxBrake: Math.max(...telemetryPoints.slice(zoneStart, i).map(p => p.brake)),
          speedDelta: telemetryPoints[zoneStart].speed - telemetryPoints[i].speed,
        });
      }
    }

    // Get user info
    const user = await ctx.db.get(session.userId);

    // Calculate valid and invalid laps
    const validLaps = laps.filter(lap => lap.isValid);
    const invalidLaps = laps.filter(lap => !lap.isValid);

    return {
      session: {
        ...session,
        user: user ? {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        } : null,
      },
      lapSummary: {
        totalLaps: laps.length,
        validLaps: validLaps.length,
        invalidLaps: invalidLaps.length,
        bestLapTime: validLaps.length > 0
          ? Math.min(...validLaps.map(l => l.lapTime))
          : 0,
        averageLapTime: validLaps.length > 0
          ? validLaps.reduce((sum, l) => sum + l.lapTime, 0) / validLaps.length
          : 0,
        worstLapTime: validLaps.length > 0
          ? Math.max(...validLaps.map(l => l.lapTime))
          : 0,
        lapTimeVariance: validLaps.length > 1
          ? calculateVariance(validLaps.map(l => l.lapTime))
          : 0,
      },
      telemetrySummary: telemetryPoints.length > 0 ? {
        totalPoints: telemetryPoints.length,
        speed: {
          min: Math.min(...speeds.filter(s => s > 0)),
          max: Math.max(...speeds),
          avg: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        },
        throttle: {
          max: Math.max(...throttles),
          avg: throttles.reduce((a, b) => a + b, 0) / throttles.length,
          fullThrottlePercentage: (throttles.filter(t => t > 95).length / throttles.length) * 100,
        },
        brake: {
          max: Math.max(...brakes),
          avg: brakes.reduce((a, b) => a + b, 0) / brakes.length,
          heavyBrakingPercentage: (brakes.filter(b => b > 80).length / brakes.length) * 100,
        },
        rpm: {
          min: Math.min(...rpms.filter(r => r > 0)),
          max: Math.max(...rpms),
          avg: rpms.reduce((a, b) => a + b, 0) / rpms.length,
        },
        gearDistribution,
        tireTemperatures: tireTemps,
        brakingZonesCount: brakingZones.length,
      } : null,
      fuelAnalysis: telemetryPoints.length > 0 ? {
        startFuel: telemetryPoints[0].fuel,
        endFuel: telemetryPoints[telemetryPoints.length - 1].fuel,
        totalFuelUsed: telemetryPoints[0].fuel - telemetryPoints[telemetryPoints.length - 1].fuel,
        averageFuelPerLap: laps.length > 0
          ? (telemetryPoints[0].fuel - telemetryPoints[telemetryPoints.length - 1].fuel) / laps.length
          : 0,
      } : null,
    };
  },
});

// Helper function to calculate variance
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Get speed trace for a lap
export const getSpeedTrace = query({
  args: {
    sessionId: v.id("sessions"),
    lapNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", args.sessionId).eq("lapNumber", args.lapNumber))
      .order("asc")
      .collect();

    return points.map(p => ({
      timestamp: p.timestamp,
      gameTimestamp: p.gameTimestamp,
      speed: p.speed,
      position: p.position,
      throttle: p.throttle,
      brake: p.brake,
      gear: p.gear,
    }));
  },
});

// Get racing line data for visualization
export const getRacingLineData = query({
  args: {
    sessionId: v.id("sessions"),
    lapNumber: v.number(),
    sampleRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", args.sessionId).eq("lapNumber", args.lapNumber))
      .order("asc")
      .collect();

    // Sample points to reduce data size for visualization
    const sampleRate = args.sampleRate || 5;
    const sampledPoints = points.filter((_, index) => index % sampleRate === 0);

    return sampledPoints.map(p => ({
      position: p.position,
      speed: p.speed,
      throttle: p.throttle,
      brake: p.brake,
      steering: p.steering,
      gear: p.gear,
    }));
  },
});