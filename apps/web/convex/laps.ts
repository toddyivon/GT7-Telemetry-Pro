import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Add a new lap to a session
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
    penalties: v.optional(v.array(v.string())),
    weather: v.optional(v.string()),
    trackPosition: v.optional(v.object({
      sector: v.number(),
      progress: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Verify session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if lap with this number already exists
    const existingLap = await ctx.db
      .query("laps")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", args.sessionId).eq("lapNumber", args.lapNumber))
      .first();

    if (existingLap) {
      throw new Error(`Lap ${args.lapNumber} already exists for this session`);
    }

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
      isValid: args.isValid ?? true,
      position: args.position ?? 1,
      penalties: args.penalties,
      weather: args.weather,
      trackPosition: args.trackPosition,
    });

    // Update session lap count and best lap time
    const currentBestLapTime = session.bestLapTime;
    const newBestLapTime = (args.isValid !== false && args.lapTime > 0)
      ? (currentBestLapTime === 0 ? args.lapTime : Math.min(currentBestLapTime, args.lapTime))
      : currentBestLapTime;

    await ctx.db.patch(args.sessionId, {
      lapCount: session.lapCount + 1,
      bestLapTime: newBestLapTime,
      topSpeed: Math.max(session.topSpeed, args.topSpeed),
    });

    return lapId;
  },
});

// Update an existing lap
export const updateLap = mutation({
  args: {
    lapId: v.id("laps"),
    lapTime: v.optional(v.number()),
    sector1Time: v.optional(v.number()),
    sector2Time: v.optional(v.number()),
    sector3Time: v.optional(v.number()),
    topSpeed: v.optional(v.number()),
    averageSpeed: v.optional(v.number()),
    fuelRemaining: v.optional(v.number()),
    tyreFrontLeft: v.optional(v.number()),
    tyreFrontRight: v.optional(v.number()),
    tyreRearLeft: v.optional(v.number()),
    tyreRearRight: v.optional(v.number()),
    isValid: v.optional(v.boolean()),
    position: v.optional(v.number()),
    penalties: v.optional(v.array(v.string())),
    weather: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { lapId, ...updates } = args;

    const lap = await ctx.db.get(lapId);
    if (!lap) {
      throw new Error("Lap not found");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(lapId, filteredUpdates);
    }

    return await ctx.db.get(lapId);
  },
});

// Delete a lap
export const deleteLap = mutation({
  args: { lapId: v.id("laps") },
  handler: async (ctx, args) => {
    const lap = await ctx.db.get(args.lapId);
    if (!lap) {
      throw new Error("Lap not found");
    }

    // Delete associated telemetry points
    const telemetryPoints = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", lap.sessionId).eq("lapNumber", lap.lapNumber))
      .collect();

    for (const point of telemetryPoints) {
      await ctx.db.delete(point._id);
    }

    // Delete the lap
    await ctx.db.delete(args.lapId);

    // Update session lap count
    const session = await ctx.db.get(lap.sessionId);
    if (session) {
      await ctx.db.patch(lap.sessionId, {
        lapCount: Math.max(0, session.lapCount - 1),
      });
    }

    return { success: true, deletedTelemetryPoints: telemetryPoints.length };
  },
});

// Get laps by session
export const getLapsBySession = query({
  args: {
    sessionId: v.id("sessions"),
    validOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    if (args.validOnly) {
      laps = laps.filter(lap => lap.isValid);
    }

    return laps;
  },
});

// Get best lap for a session
export const getBestLap = query({
  args: {
    sessionId: v.id("sessions"),
    validOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (args.validOnly !== false) {
      laps = laps.filter(lap => lap.isValid);
    }

    if (laps.length === 0) {
      return null;
    }

    // Find the fastest lap
    const bestLap = laps.reduce((best, current) => {
      if (current.lapTime <= 0) return best;
      if (!best || current.lapTime < best.lapTime) return current;
      return best;
    }, null as typeof laps[0] | null);

    return bestLap;
  },
});

// Get lap by ID
export const getLapById = query({
  args: { lapId: v.id("laps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.lapId);
  },
});

// Compare two laps
export const compareLaps = query({
  args: {
    lapId1: v.id("laps"),
    lapId2: v.id("laps"),
  },
  handler: async (ctx, args) => {
    const lap1 = await ctx.db.get(args.lapId1);
    const lap2 = await ctx.db.get(args.lapId2);

    if (!lap1 || !lap2) {
      throw new Error("One or both laps not found");
    }

    // Get session info for both laps
    const session1 = await ctx.db.get(lap1.sessionId);
    const session2 = await ctx.db.get(lap2.sessionId);

    // Calculate differences
    const timeDiff = lap2.lapTime - lap1.lapTime;
    const sector1Diff = lap2.sector1Time - lap1.sector1Time;
    const sector2Diff = lap2.sector2Time - lap1.sector2Time;
    const sector3Diff = lap2.sector3Time - lap1.sector3Time;
    const topSpeedDiff = lap2.topSpeed - lap1.topSpeed;
    const avgSpeedDiff = lap2.averageSpeed - lap1.averageSpeed;

    // Calculate tire wear differences
    const tireWearDiff = {
      frontLeft: lap2.tyreFrontLeft - lap1.tyreFrontLeft,
      frontRight: lap2.tyreFrontRight - lap1.tyreFrontRight,
      rearLeft: lap2.tyreRearLeft - lap1.tyreRearLeft,
      rearRight: lap2.tyreRearRight - lap1.tyreRearRight,
    };

    // Get telemetry for both laps for detailed comparison
    const telemetry1 = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", lap1.sessionId).eq("lapNumber", lap1.lapNumber))
      .order("asc")
      .collect();

    const telemetry2 = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) =>
        q.eq("sessionId", lap2.sessionId).eq("lapNumber", lap2.lapNumber))
      .order("asc")
      .collect();

    // Calculate braking and acceleration differences
    const brakingAnalysis = analyzeBraking(telemetry1, telemetry2);
    const accelerationAnalysis = analyzeAcceleration(telemetry1, telemetry2);

    return {
      lap1: {
        ...lap1,
        session: session1 ? {
          trackName: session1.trackName,
          carModel: session1.carModel,
          sessionDate: session1.sessionDate,
        } : null,
      },
      lap2: {
        ...lap2,
        session: session2 ? {
          trackName: session2.trackName,
          carModel: session2.carModel,
          sessionDate: session2.sessionDate,
        } : null,
      },
      differences: {
        lapTime: timeDiff,
        sector1Time: sector1Diff,
        sector2Time: sector2Diff,
        sector3Time: sector3Diff,
        topSpeed: topSpeedDiff,
        averageSpeed: avgSpeedDiff,
        tireWear: tireWearDiff,
      },
      analysis: {
        fasterLap: timeDiff < 0 ? "lap2" : timeDiff > 0 ? "lap1" : "equal",
        bestSector1: sector1Diff < 0 ? "lap2" : sector1Diff > 0 ? "lap1" : "equal",
        bestSector2: sector2Diff < 0 ? "lap2" : sector2Diff > 0 ? "lap1" : "equal",
        bestSector3: sector3Diff < 0 ? "lap2" : sector3Diff > 0 ? "lap1" : "equal",
        braking: brakingAnalysis,
        acceleration: accelerationAnalysis,
      },
      recommendations: generateLapComparisonRecommendations(lap1, lap2, timeDiff, sector1Diff, sector2Diff, sector3Diff),
    };
  },
});

// Get sector times breakdown
export const getSectorAnalysis = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (laps.length === 0) {
      return null;
    }

    const validLaps = laps.filter(lap => lap.isValid);

    // Find best sectors
    const bestSector1 = Math.min(...validLaps.map(lap => lap.sector1Time));
    const bestSector2 = Math.min(...validLaps.map(lap => lap.sector2Time));
    const bestSector3 = Math.min(...validLaps.map(lap => lap.sector3Time));
    const theoreticalBest = bestSector1 + bestSector2 + bestSector3;

    // Calculate average sectors
    const avgSector1 = validLaps.reduce((sum, lap) => sum + lap.sector1Time, 0) / validLaps.length;
    const avgSector2 = validLaps.reduce((sum, lap) => sum + lap.sector2Time, 0) / validLaps.length;
    const avgSector3 = validLaps.reduce((sum, lap) => sum + lap.sector3Time, 0) / validLaps.length;

    // Find which laps had the best sectors
    const bestSector1Lap = validLaps.find(lap => lap.sector1Time === bestSector1);
    const bestSector2Lap = validLaps.find(lap => lap.sector2Time === bestSector2);
    const bestSector3Lap = validLaps.find(lap => lap.sector3Time === bestSector3);

    return {
      bestSectors: {
        sector1: { time: bestSector1, lapNumber: bestSector1Lap?.lapNumber },
        sector2: { time: bestSector2, lapNumber: bestSector2Lap?.lapNumber },
        sector3: { time: bestSector3, lapNumber: bestSector3Lap?.lapNumber },
      },
      averageSectors: {
        sector1: avgSector1,
        sector2: avgSector2,
        sector3: avgSector3,
      },
      theoreticalBestLap: theoreticalBest,
      actualBestLap: Math.min(...validLaps.map(lap => lap.lapTime)),
      potentialImprovement: Math.min(...validLaps.map(lap => lap.lapTime)) - theoreticalBest,
      lapByLapSectors: validLaps.map(lap => ({
        lapNumber: lap.lapNumber,
        sector1: lap.sector1Time,
        sector2: lap.sector2Time,
        sector3: lap.sector3Time,
        totalTime: lap.lapTime,
        sector1Delta: lap.sector1Time - bestSector1,
        sector2Delta: lap.sector2Time - bestSector2,
        sector3Delta: lap.sector3Time - bestSector3,
      })),
    };
  },
});

// Get tire wear progression
export const getTireWearProgression = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    if (laps.length === 0) {
      return null;
    }

    const progression = laps.map(lap => ({
      lapNumber: lap.lapNumber,
      frontLeft: lap.tyreFrontLeft,
      frontRight: lap.tyreFrontRight,
      rearLeft: lap.tyreRearLeft,
      rearRight: lap.tyreRearRight,
      averageFront: (lap.tyreFrontLeft + lap.tyreFrontRight) / 2,
      averageRear: (lap.tyreRearLeft + lap.tyreRearRight) / 2,
    }));

    // Calculate wear rates
    const wearRates = {
      frontLeft: laps.length > 1
        ? (laps[0].tyreFrontLeft - laps[laps.length - 1].tyreFrontLeft) / (laps.length - 1)
        : 0,
      frontRight: laps.length > 1
        ? (laps[0].tyreFrontRight - laps[laps.length - 1].tyreFrontRight) / (laps.length - 1)
        : 0,
      rearLeft: laps.length > 1
        ? (laps[0].tyreRearLeft - laps[laps.length - 1].tyreRearLeft) / (laps.length - 1)
        : 0,
      rearRight: laps.length > 1
        ? (laps[0].tyreRearRight - laps[laps.length - 1].tyreRearRight) / (laps.length - 1)
        : 0,
    };

    return {
      progression,
      wearRates,
      initialWear: {
        frontLeft: laps[0].tyreFrontLeft,
        frontRight: laps[0].tyreFrontRight,
        rearLeft: laps[0].tyreRearLeft,
        rearRight: laps[0].tyreRearRight,
      },
      finalWear: {
        frontLeft: laps[laps.length - 1].tyreFrontLeft,
        frontRight: laps[laps.length - 1].tyreFrontRight,
        rearLeft: laps[laps.length - 1].tyreRearLeft,
        rearRight: laps[laps.length - 1].tyreRearRight,
      },
    };
  },
});

// Helper function to analyze braking differences
function analyzeBraking(telemetry1: any[], telemetry2: any[]): any {
  const getBrakingPoints = (points: any[]) => {
    const brakingPoints = [];
    for (let i = 1; i < points.length; i++) {
      if (points[i].brake > 50) {
        brakingPoints.push({
          timestamp: points[i].timestamp,
          position: points[i].position,
          brake: points[i].brake,
          speed: points[i].speed,
        });
      }
    }
    return brakingPoints;
  };

  const braking1 = getBrakingPoints(telemetry1);
  const braking2 = getBrakingPoints(telemetry2);

  return {
    lap1BrakingPoints: braking1.length,
    lap2BrakingPoints: braking2.length,
    averageBrakeForce1: braking1.length > 0
      ? braking1.reduce((sum, p) => sum + p.brake, 0) / braking1.length
      : 0,
    averageBrakeForce2: braking2.length > 0
      ? braking2.reduce((sum, p) => sum + p.brake, 0) / braking2.length
      : 0,
  };
}

// Helper function to analyze acceleration differences
function analyzeAcceleration(telemetry1: any[], telemetry2: any[]): any {
  const getAccelerationPoints = (points: any[]) => {
    const accelerationPoints = [];
    for (let i = 1; i < points.length; i++) {
      if (points[i].throttle > 80 && points[i].speed > points[i - 1].speed) {
        accelerationPoints.push({
          timestamp: points[i].timestamp,
          position: points[i].position,
          throttle: points[i].throttle,
          speed: points[i].speed,
          speedDelta: points[i].speed - points[i - 1].speed,
        });
      }
    }
    return accelerationPoints;
  };

  const accel1 = getAccelerationPoints(telemetry1);
  const accel2 = getAccelerationPoints(telemetry2);

  return {
    lap1AccelerationPoints: accel1.length,
    lap2AccelerationPoints: accel2.length,
    averageThrottle1: accel1.length > 0
      ? accel1.reduce((sum, p) => sum + p.throttle, 0) / accel1.length
      : 0,
    averageThrottle2: accel2.length > 0
      ? accel2.reduce((sum, p) => sum + p.throttle, 0) / accel2.length
      : 0,
  };
}

// Helper function to generate recommendations
function generateLapComparisonRecommendations(
  lap1: any,
  lap2: any,
  timeDiff: number,
  sector1Diff: number,
  sector2Diff: number,
  sector3Diff: number
): string[] {
  const recommendations: string[] = [];

  const fasterLap = timeDiff < 0 ? "Lap 2" : "Lap 1";
  const slowerLap = timeDiff < 0 ? "Lap 1" : "Lap 2";

  if (Math.abs(timeDiff) > 0.5) {
    recommendations.push(`${fasterLap} is ${Math.abs(timeDiff).toFixed(3)}s faster overall.`);
  }

  // Sector-specific recommendations
  if (Math.abs(sector1Diff) > 0.2) {
    const fasterInS1 = sector1Diff < 0 ? "Lap 2" : "Lap 1";
    recommendations.push(`${fasterInS1} has a better Sector 1 by ${Math.abs(sector1Diff).toFixed(3)}s. Review braking points into Turn 1.`);
  }

  if (Math.abs(sector2Diff) > 0.2) {
    const fasterInS2 = sector2Diff < 0 ? "Lap 2" : "Lap 1";
    recommendations.push(`${fasterInS2} has a better Sector 2 by ${Math.abs(sector2Diff).toFixed(3)}s. Analyze mid-corner speeds.`);
  }

  if (Math.abs(sector3Diff) > 0.2) {
    const fasterInS3 = sector3Diff < 0 ? "Lap 2" : "Lap 1";
    recommendations.push(`${fasterInS3} has a better Sector 3 by ${Math.abs(sector3Diff).toFixed(3)}s. Focus on exit speeds and final corner technique.`);
  }

  // Top speed analysis
  if (Math.abs(lap2.topSpeed - lap1.topSpeed) > 5) {
    const higherTopSpeed = lap2.topSpeed > lap1.topSpeed ? "Lap 2" : "Lap 1";
    recommendations.push(`${higherTopSpeed} achieved higher top speed (${Math.max(lap1.topSpeed, lap2.topSpeed).toFixed(1)} km/h).`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Both laps are very similar. Focus on consistency and small improvements in every corner.");
  }

  return recommendations;
}
