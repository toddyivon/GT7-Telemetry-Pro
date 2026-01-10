import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new analysis
export const createAnalysis = mutation({
  args: {
    sessionId: v.id("sessions"),
    analysisType: v.union(
      v.literal('racing_line'),
      v.literal('tire_performance'),
      v.literal('lap_comparison'),
      v.literal('sector_analysis'),
      v.literal('fuel_strategy'),
      v.literal('brake_analysis'),
      v.literal('corner_analysis')
    ),
    result: v.any(),
    parameters: v.optional(v.object({
      algorithm: v.string(),
      version: v.string(),
      settings: v.any(),
    })),
    confidence: v.optional(v.number()),
    recommendations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Verify session exists
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if analysis of this type already exists
    const existingAnalysis = await ctx.db
      .query("analysisResults")
      .withIndex("by_session_type", (q) =>
        q.eq("sessionId", args.sessionId).eq("analysisType", args.analysisType))
      .first();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        result: args.result,
        parameters: args.parameters,
        confidence: args.confidence,
        recommendations: args.recommendations,
        createdAt: Date.now(),
      });
      return existingAnalysis._id;
    }

    // Create new analysis
    const analysisId = await ctx.db.insert("analysisResults", {
      sessionId: args.sessionId,
      analysisType: args.analysisType,
      result: args.result,
      createdAt: Date.now(),
      parameters: args.parameters,
      confidence: args.confidence,
      recommendations: args.recommendations,
    });

    return analysisId;
  },
});

// Get analysis by session (all analyses for a session)
export const getAnalysisBySession = query({
  args: {
    sessionId: v.id("sessions"),
    analysisType: v.optional(v.union(
      v.literal('racing_line'),
      v.literal('tire_performance'),
      v.literal('lap_comparison'),
      v.literal('sector_analysis'),
      v.literal('fuel_strategy'),
      v.literal('brake_analysis'),
      v.literal('corner_analysis')
    )),
  },
  handler: async (ctx, args) => {
    if (args.analysisType) {
      // Get specific analysis type
      return await ctx.db
        .query("analysisResults")
        .withIndex("by_session_type", (q) =>
          q.eq("sessionId", args.sessionId).eq("analysisType", args.analysisType))
        .first();
    }

    // Get all analyses for the session
    return await ctx.db
      .query("analysisResults")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

// Get fuel analysis for a session
export const getFuelAnalysis = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get all laps
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    if (laps.length === 0) {
      return null;
    }

    // Get telemetry points for fuel analysis
    const telemetryPoints = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .take(5000);

    // Calculate fuel consumption per lap
    const fuelPerLap = [];
    for (let i = 1; i < laps.length; i++) {
      const fuelUsed = laps[i - 1].fuelRemaining - laps[i].fuelRemaining;
      fuelPerLap.push({
        lapNumber: laps[i].lapNumber,
        fuelUsed,
        fuelRemaining: laps[i].fuelRemaining,
        lapTime: laps[i].lapTime,
      });
    }

    // Calculate average fuel consumption
    const validFuelData = fuelPerLap.filter(f => f.fuelUsed > 0);
    const avgFuelPerLap = validFuelData.length > 0
      ? validFuelData.reduce((sum, f) => sum + f.fuelUsed, 0) / validFuelData.length
      : 0;

    // Estimate remaining laps
    const currentFuel = laps[laps.length - 1]?.fuelRemaining || 0;
    const estimatedLapsRemaining = avgFuelPerLap > 0
      ? Math.floor(currentFuel / avgFuelPerLap)
      : 0;

    // Calculate fuel consumption trend
    const fuelTrend = calculateFuelTrend(fuelPerLap);

    // Calculate fuel vs lap time correlation
    const fuelLapTimeCorrelation = calculateCorrelation(
      fuelPerLap.map(f => f.fuelUsed),
      fuelPerLap.map(f => f.lapTime)
    );

    // Calculate optimal fuel load for race distance
    const raceDistanceEstimates = [10, 15, 20, 25, 30].map(laps => ({
      laps,
      fuelRequired: avgFuelPerLap * laps * 1.05, // 5% safety margin
    }));

    return {
      session: {
        trackName: session.trackName,
        carModel: session.carModel,
        totalLaps: laps.length,
      },
      fuelData: {
        startFuel: laps[0]?.fuelRemaining || 0,
        currentFuel,
        totalFuelUsed: (laps[0]?.fuelRemaining || 0) - currentFuel,
        avgFuelPerLap,
        minFuelPerLap: validFuelData.length > 0 ? Math.min(...validFuelData.map(f => f.fuelUsed)) : 0,
        maxFuelPerLap: validFuelData.length > 0 ? Math.max(...validFuelData.map(f => f.fuelUsed)) : 0,
      },
      predictions: {
        estimatedLapsRemaining,
        fuelTrend,
        fuelLapTimeCorrelation,
      },
      perLapAnalysis: fuelPerLap,
      raceDistanceEstimates,
      recommendations: generateFuelRecommendations(avgFuelPerLap, fuelTrend, estimatedLapsRemaining),
    };
  },
});

// Delete an analysis
export const deleteAnalysis = mutation({
  args: { analysisId: v.id("analysisResults") },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis) {
      throw new Error("Analysis not found");
    }

    await ctx.db.delete(args.analysisId);
    return { success: true };
  },
});

// Helper function to calculate fuel consumption trend
function calculateFuelTrend(fuelPerLap: any[]): string {
  if (fuelPerLap.length < 3) return "insufficient_data";

  const firstHalf = fuelPerLap.slice(0, Math.floor(fuelPerLap.length / 2));
  const secondHalf = fuelPerLap.slice(Math.floor(fuelPerLap.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, f) => sum + f.fuelUsed, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, f) => sum + f.fuelUsed, 0) / secondHalf.length;

  const percentageChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

  if (percentageChange > 5) return "increasing";
  if (percentageChange < -5) return "decreasing";
  return "stable";
}

// Helper function to calculate correlation
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// Helper function to generate fuel recommendations
function generateFuelRecommendations(avgFuelPerLap: number, trend: string, lapsRemaining: number): string[] {
  const recommendations: string[] = [];

  if (trend === "increasing") {
    recommendations.push("Fuel consumption is increasing. Consider adjusting driving style or checking tire wear.");
  } else if (trend === "decreasing") {
    recommendations.push("Fuel consumption is decreasing. Good fuel management or lighter load effect.");
  }

  if (lapsRemaining < 3 && lapsRemaining > 0) {
    recommendations.push("Warning: Low fuel. Consider pit stop soon.");
  } else if (lapsRemaining === 0) {
    recommendations.push("Critical: Fuel exhausted or data unavailable.");
  }

  if (avgFuelPerLap > 0) {
    recommendations.push(`Average fuel consumption: ${avgFuelPerLap.toFixed(2)} units per lap.`);
  }

  return recommendations;
}

// Get all analysis results for a specific session
export const getAnalysisResults = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("analysisResults")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    
    return results;
  },
});

// Create a new analysis result
export const createAnalysisResult = mutation({
  args: {
    sessionId: v.id("sessions"),
    analysisType: v.union(
      v.literal('racing_line'),
      v.literal('tire_performance'),
      v.literal('lap_comparison'),
      v.literal('sector_analysis'),
      v.literal('fuel_strategy'),
      v.literal('brake_analysis'),
      v.literal('corner_analysis')
    ),
    result: v.any(),
    parameters: v.optional(v.object({
      algorithm: v.string(),
      version: v.string(),
      settings: v.any(),
    })),
    confidence: v.optional(v.number()),
    recommendations: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const resultId = await ctx.db.insert("analysisResults", {
      ...args,
      createdAt: Date.now(),
    });
    
    return resultId;
  },
});

// Get lap comparison analysis
export const getLapComparison = query({
  args: {
    lapId1: v.id("laps"),
    lapId2: v.id("laps"),
  },
  handler: async (ctx, args) => {
    // Get both laps data
    const lap1 = await ctx.db.get(args.lapId1);
    const lap2 = await ctx.db.get(args.lapId2);
    
    if (!lap1 || !lap2) {
      throw new Error("One or both laps not found");
    }
    
    // Get telemetry points for both laps
    const points1 = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) => q.eq("sessionId", lap1.sessionId).eq("lapNumber", lap1.lapNumber))
      .collect();
    
    const points2 = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) => q.eq("sessionId", lap2.sessionId).eq("lapNumber", lap2.lapNumber))
      .collect();
    
    // Create simplified data for comparison
    // In a real implementation, you would do more sophisticated analysis here
    const comparison = {
      lap1: {
        lapNumber: lap1.lapNumber,
        lapTime: lap1.lapTime,
        avgSpeed: calculateAvgSpeed(points1),
        maxSpeed: calculateMaxSpeed(points1),
        brakingPoints: identifyBrakingPoints(points1),
        accelerationPoints: identifyAccelerationPoints(points1),
      },
      lap2: {
        lapNumber: lap2.lapNumber,
        lapTime: lap2.lapTime,
        avgSpeed: calculateAvgSpeed(points2),
        maxSpeed: calculateMaxSpeed(points2),
        brakingPoints: identifyBrakingPoints(points2),
        accelerationPoints: identifyAccelerationPoints(points2),
      },
      timeDifference: lap2.lapTime - lap1.lapTime,
      recommendations: generateRecommendations(points1, points2),
    };
    
    return comparison;
  },
});

// Get tire performance analysis
export const getTireAnalysis = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    // Get all laps for this session
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    
    // Extract tire wear data and calculate degradation rates
    const tireData = laps.map((lap) => ({
      lapNumber: lap.lapNumber,
      tireWear: {
        frontLeft: lap.tyreFrontLeft,
        frontRight: lap.tyreFrontRight,
        rearLeft: lap.tyreRearLeft,
        rearRight: lap.tyreRearRight,
      },
    }));
    
    // Calculate degradation rates between consecutive laps
    const degradationRates = [];
    for (let i = 1; i < tireData.length; i++) {
      const prevLap = tireData[i - 1];
      const currLap = tireData[i];
      
      degradationRates.push({
        lapNumberStart: prevLap.lapNumber,
        lapNumberEnd: currLap.lapNumber,
        degradation: {
          frontLeft: prevLap.tireWear.frontLeft - currLap.tireWear.frontLeft,
          frontRight: prevLap.tireWear.frontRight - currLap.tireWear.frontRight,
          rearLeft: prevLap.tireWear.rearLeft - currLap.tireWear.rearLeft,
          rearRight: prevLap.tireWear.rearRight - currLap.tireWear.rearRight,
        },
      });
    }
    
    // Calculate overall tire wear pattern
    const overallDegradation = calculateOverallTireDegradation(tireData);
    
    return {
      tireData,
      degradationRates,
      overallDegradation,
      recommendations: generateTireRecommendations(overallDegradation),
    };
  },
});

// Helper functions for analysis
function calculateAvgSpeed(points: any[]): number {
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, point) => acc + point.speed, 0);
  return sum / points.length;
}

function calculateMaxSpeed(points: any[]): number {
  if (points.length === 0) return 0;
  return Math.max(...points.map(point => point.speed));
}

function identifyBrakingPoints(points: any[]): any[] {
  const brakingPoints = [];
  
  for (let i = 1; i < points.length; i++) {
    // Identify significant braking events (brake > 50% and speed decreasing)
    if (points[i].brake > 50 && points[i].speed < points[i-1].speed) {
      brakingPoints.push({
        position: points[i].position,
        timestamp: points[i].timestamp,
        brakePercentage: points[i].brake,
        speed: points[i].speed,
        speedDelta: points[i].speed - points[i-1].speed,
      });
    }
  }
  
  return brakingPoints;
}

function identifyAccelerationPoints(points: any[]): any[] {
  const accelerationPoints = [];
  
  for (let i = 1; i < points.length; i++) {
    // Identify significant acceleration events (throttle > 80% and speed increasing)
    if (points[i].throttle > 80 && points[i].speed > points[i-1].speed) {
      accelerationPoints.push({
        position: points[i].position,
        timestamp: points[i].timestamp,
        throttlePercentage: points[i].throttle,
        speed: points[i].speed,
        speedDelta: points[i].speed - points[i-1].speed,
      });
    }
  }
  
  return accelerationPoints;
}

function generateRecommendations(points1: any[], points2: any[]): string[] {
  // In a real implementation, this would be a sophisticated analysis algorithm
  // This is just a placeholder
  return [
    "Review braking points in sector 2 for potential improvements",
    "Consider earlier acceleration out of turn 4",
    "Maintain more consistent speed through the final chicane"
  ];
}

// Get racing line analysis
export const getRacingLineAnalysis = query({
  args: {
    lapId: v.id("laps"),
  },
  handler: async (ctx, args) => {
    const lap = await ctx.db.get(args.lapId);
    
    if (!lap) {
      throw new Error("Lap not found");
    }
    
    // Get telemetry points for the lap
    const points = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session_lap", (q) => q.eq("sessionId", lap.sessionId).eq("lapNumber", lap.lapNumber))
      .collect();
    
    // Sort points by timestamp to ensure correct order
    points.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate cornering metrics
    const corners = identifyCorners(points);
    const corneringMetrics = calculateCorneringMetrics(corners, points);
    
    // Generate racing line analysis
    const racingLine = {
      lap: {
        lapNumber: lap.lapNumber,
        lapTime: lap.lapTime,
      },
      corners: corneringMetrics,
      entryExitPoints: calculateEntryExitPoints(corners, points),
      idealLine: calculateIdealLine(points),
      recommendations: generateRacingLineRecommendations(corneringMetrics),
    };
    
    return racingLine;
  },
});

// Helper functions for racing line analysis
function identifyCorners(points: any[]): any[] {
  const corners = [];
  const cornerThreshold = 30; // Threshold for significant steering angle change in degrees
  
  let inCorner = false;
  let cornerStart = null;
  let cornerEnd = null;
  
  for (let i = 1; i < points.length; i++) {
    const steeringAngle = Math.abs(points[i].steering || 0);
    
    if (!inCorner && steeringAngle > cornerThreshold) {
      // Corner entry
      inCorner = true;
      cornerStart = i;
    } else if (inCorner && steeringAngle < cornerThreshold) {
      // Corner exit
      inCorner = false;
      cornerEnd = i;
      
      if (cornerStart !== null && cornerEnd !== null) {
        corners.push({
          entryIndex: cornerStart,
          exitIndex: cornerEnd,
          entryPoint: points[cornerStart],
          exitPoint: points[cornerEnd],
          apexIndex: findApexIndex(points, cornerStart, cornerEnd),
        });
      }
      
      cornerStart = null;
      cornerEnd = null;
    }
  }
  
  // Handle case where we're still in a corner at the end of the lap
  if (inCorner && cornerStart !== null) {
    cornerEnd = points.length - 1;
    corners.push({
      entryIndex: cornerStart,
      exitIndex: cornerEnd,
      entryPoint: points[cornerStart],
      exitPoint: points[cornerEnd],
      apexIndex: findApexIndex(points, cornerStart, cornerEnd),
    });
  }
  
  return corners;
}

function findApexIndex(points: any[], startIndex: number, endIndex: number): number {
  let minRadius = Infinity;
  let apexIndex = startIndex;
  
  for (let i = startIndex; i <= endIndex; i++) {
    // In a real implementation, calculate the radius of curvature or use steering angle as proxy
    const steeringAngle = Math.abs(points[i].steering || 0);
    if (steeringAngle < minRadius) {
      minRadius = steeringAngle;
      apexIndex = i;
    }
  }
  
  return apexIndex;
}

function calculateCorneringMetrics(corners: any[], points: any[]): any[] {
  return corners.map((corner, index) => {
    const entrySpeed = points[corner.entryIndex].speed;
    const apexSpeed = points[corner.apexIndex].speed;
    const exitSpeed = points[corner.exitIndex].speed;
    
    const entryBrake = points[corner.entryIndex].brake;
    const entryThrottle = points[corner.entryIndex].throttle;
    const apexThrottle = points[corner.apexIndex].throttle;
    const exitThrottle = points[corner.exitIndex].throttle;
    
    // Calculate the minimum speed during the corner
    let minSpeed = apexSpeed;
    for (let i = corner.entryIndex; i <= corner.exitIndex; i++) {
      if (points[i].speed < minSpeed) {
        minSpeed = points[i].speed;
      }
    }
    
    // Calculate corner analysis metrics
    return {
      cornerNumber: index + 1,
      entrySpeed,
      apexSpeed,
      exitSpeed,
      minSpeed,
      speedDelta: exitSpeed - entrySpeed,
      brakePointDistance: calculateDistanceBetweenPoints(
        points[findBrakePointIndex(points, corner.entryIndex)].position,
        points[corner.entryIndex].position
      ),
      entryBrake,
      entryThrottle,
      apexThrottle,
      exitThrottle,
      turnInPoint: {
        x: points[corner.entryIndex].position.x,
        y: points[corner.entryIndex].position.y,
        z: points[corner.entryIndex].position.z,
      },
      apexPoint: {
        x: points[corner.apexIndex].position.x,
        y: points[corner.apexIndex].position.y,
        z: points[corner.apexIndex].position.z,
      },
      exitPoint: {
        x: points[corner.exitIndex].position.x,
        y: points[corner.exitIndex].position.y,
        z: points[corner.exitIndex].position.z,
      },
    };
  });
}

function calculateEntryExitPoints(corners: any[], points: any[]): any[] {
  return corners.map((corner, index) => {
    return {
      cornerNumber: index + 1,
      entry: points[corner.entryIndex].position,
      apex: points[corner.apexIndex].position,
      exit: points[corner.exitIndex].position,
    };
  });
}

function findBrakePointIndex(points: any[], cornerEntryIndex: number): number {
  // Look back from corner entry to find where braking started
  let brakePointIndex = cornerEntryIndex;
  
  for (let i = cornerEntryIndex; i >= Math.max(0, cornerEntryIndex - 20); i--) {
    if (points[i].brake > 50) {
      brakePointIndex = i;
    } else if (i < cornerEntryIndex && points[i].brake < 10) {
      // Found where braking hadn't started yet
      break;
    }
  }
  
  return brakePointIndex;
}

function calculateDistanceBetweenPoints(point1: any, point2: any): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function calculateIdealLine(points: any[]): any[] {
  // In a real implementation, this would use a sophisticated algorithm to determine the ideal racing line
  // This is a simplified version that just returns key points of the actual line
  
  // Sample every 10th point to reduce data size
  return points
    .filter((_, index) => index % 10 === 0)
    .map((point) => ({
      position: point.position,
      speed: point.speed,
    }));
}

function generateRacingLineRecommendations(corneringMetrics: any[]): string[] {
  // Generate recommendations based on cornering metrics
  const recommendations: string[] = [];
  
  corneringMetrics.forEach((corner) => {
    // Example recommendation logic
    if (corner.entrySpeed > corner.apexSpeed * 1.5) {
      recommendations.push(
        `Corner ${corner.cornerNumber}: Entry speed too high, consider braking earlier`
      );
    }
    
    if (corner.apexThrottle < 20 && corner.exitThrottle > 80) {
      recommendations.push(
        `Corner ${corner.cornerNumber}: Consider smoother throttle application through the apex`
      );
    }
    
    if (corner.exitSpeed < corner.entrySpeed) {
      recommendations.push(
        `Corner ${corner.cornerNumber}: Focus on better exit speed, possibly by adjusting apex point`
      );
    }
  });
  
  return recommendations;
}

function calculateOverallTireDegradation(tireData: any): any {
  // Calculate average degradation per lap for each tire
  // This is a simplified implementation
  if (tireData.length <= 1) {
    return {
      frontLeft: 0,
      frontRight: 0,
      rearLeft: 0,
      rearRight: 0,
    };
  }
  
  const firstLap = tireData[0];
  const lastLap = tireData[tireData.length - 1];
  const lapCount = lastLap.lapNumber - firstLap.lapNumber;
  
  if (lapCount <= 0) return {
    frontLeft: 0,
    frontRight: 0,
    rearLeft: 0,
    rearRight: 0,
  };
  
  return {
    frontLeft: (firstLap.tireWear.frontLeft - lastLap.tireWear.frontLeft) / lapCount,
    frontRight: (firstLap.tireWear.frontRight - lastLap.tireWear.frontRight) / lapCount,
    rearLeft: (firstLap.tireWear.rearLeft - lastLap.tireWear.rearLeft) / lapCount,
    rearRight: (firstLap.tireWear.rearRight - lastLap.tireWear.rearRight) / lapCount,
  };
}

function generateTireRecommendations(degradation: any): string[] {
  // Analyze tire degradation patterns and generate recommendations
  // This is a simplified implementation
  const recommendations: string[] = [];
  
  const maxDegradation = Math.max(
    degradation.frontLeft,
    degradation.frontRight,
    degradation.rearLeft,
    degradation.rearRight
  );
  
  if (degradation.frontLeft === maxDegradation) {
    recommendations.push("Front left tire showing highest wear. Consider adjusting camber or toe settings.");
  }
  
  if (degradation.frontRight === maxDegradation) {
    recommendations.push("Front right tire showing highest wear. Check suspension settings and driving style through right turns.");
  }
  
  if (degradation.rearLeft === maxDegradation) {
    recommendations.push("Rear left tire showing highest wear. Consider reducing power application on corner exits.");
  }
  
  if (degradation.rearRight === maxDegradation) {
    recommendations.push("Rear right tire showing highest wear. Evaluate driving line through left turns.");
  }
  
  if (
    Math.abs(degradation.frontLeft - degradation.frontRight) > 0.05 ||
    Math.abs(degradation.rearLeft - degradation.rearRight) > 0.05
  ) {
    recommendations.push("Uneven tire wear detected. Consider alignment adjustments.");
  }
  
  return recommendations;
}
