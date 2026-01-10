import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new session
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
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({
      gameVersion: v.string(),
      platform: v.string(),
      recordingDevice: v.string(),
      dataQuality: v.number(),
      packetLoss: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

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
      isPublic: args.isPublic ?? false,
      tags: args.tags,
      notes: args.notes,
      metadata: args.metadata,
    });

    return sessionId;
  },
});

// Update session details
export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    trackName: v.optional(v.string()),
    carModel: v.optional(v.string()),
    sessionType: v.optional(v.union(v.literal('practice'), v.literal('qualifying'), v.literal('race'), v.literal('time_trial'))),
    weatherConditions: v.optional(v.string()),
    trackCondition: v.optional(v.union(v.literal('dry'), v.literal('wet'), v.literal('damp'))),
    tyreFront: v.optional(v.string()),
    tyreRear: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    lapCount: v.optional(v.number()),
    bestLapTime: v.optional(v.number()),
    averageLapTime: v.optional(v.number()),
    totalSessionTime: v.optional(v.number()),
    fuelUsed: v.optional(v.number()),
    topSpeed: v.optional(v.number()),
    averageSpeed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;

    const session = await ctx.db.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(sessionId, filteredUpdates);
    }

    return await ctx.db.get(sessionId);
  },
});

// Complete a session with final statistics
export const completeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    lapCount: v.optional(v.number()),
    bestLapTime: v.optional(v.number()),
    averageLapTime: v.optional(v.number()),
    totalSessionTime: v.optional(v.number()),
    fuelUsed: v.optional(v.number()),
    topSpeed: v.optional(v.number()),
    averageSpeed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get all laps for this session to calculate stats if not provided
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const validLaps = laps.filter(lap => lap.isValid);
    const lapTimes = validLaps.map(lap => lap.lapTime);

    const calculatedStats = {
      lapCount: args.lapCount ?? laps.length,
      bestLapTime: args.bestLapTime ?? (lapTimes.length > 0 ? Math.min(...lapTimes) : 0),
      averageLapTime: args.averageLapTime ?? (lapTimes.length > 0
        ? lapTimes.reduce((sum, t) => sum + t, 0) / lapTimes.length
        : 0),
      totalSessionTime: args.totalSessionTime ?? lapTimes.reduce((sum, t) => sum + t, 0),
      fuelUsed: args.fuelUsed ?? (laps.length > 0
        ? (laps[0]?.fuelRemaining ?? 0) - (laps[laps.length - 1]?.fuelRemaining ?? 0)
        : 0),
      topSpeed: args.topSpeed ?? (laps.length > 0
        ? Math.max(...laps.map(lap => lap.topSpeed))
        : 0),
      averageSpeed: args.averageSpeed ?? (laps.length > 0
        ? laps.reduce((sum, lap) => sum + lap.averageSpeed, 0) / laps.length
        : 0),
    };

    await ctx.db.patch(args.sessionId, {
      ...calculatedStats,
      isCompleted: true,
    });

    // Update user stats
    const user = await ctx.db.get(session.userId);
    if (user) {
      const currentStats = user.stats || {
        totalSessions: 0,
        totalLaps: 0,
        totalDistance: 0,
      };

      const newBestLapTime = currentStats.bestLapTime
        ? Math.min(currentStats.bestLapTime, calculatedStats.bestLapTime)
        : calculatedStats.bestLapTime;

      await ctx.db.patch(session.userId, {
        stats: {
          totalSessions: currentStats.totalSessions + 1,
          totalLaps: currentStats.totalLaps + calculatedStats.lapCount,
          totalDistance: currentStats.totalDistance + (calculatedStats.lapCount * 5), // Approximate
          bestLapTime: newBestLapTime > 0 ? newBestLapTime : currentStats.bestLapTime,
          favoriteTrack: currentStats.favoriteTrack || session.trackName,
        },
      });
    }

    return await ctx.db.get(args.sessionId);
  },
});

// Delete a session and all associated data
export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Delete all laps for this session
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const lap of laps) {
      await ctx.db.delete(lap._id);
    }

    // Delete all telemetry points for this session
    const telemetryPoints = await ctx.db
      .query("telemetryPoints")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const point of telemetryPoints) {
      await ctx.db.delete(point._id);
    }

    // Delete all analysis results for this session
    const analysisResults = await ctx.db
      .query("analysisResults")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const result of analysisResults) {
      await ctx.db.delete(result._id);
    }

    // Delete the session itself
    await ctx.db.delete(args.sessionId);

    return { success: true, deletedLaps: laps.length, deletedTelemetryPoints: telemetryPoints.length };
  },
});

// Get session by ID
export const getSessionById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    // Get user info
    const user = await ctx.db.get(session.userId);

    // Get lap count and summary
    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return {
      ...session,
      user: user ? {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      } : null,
      lapsCount: laps.length,
    };
  },
});

// Get user sessions with pagination
export const getUserSessions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    sessionType: v.optional(v.union(v.literal('practice'), v.literal('qualifying'), v.literal('race'), v.literal('time_trial'))),
    trackName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let query = ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    const sessions = await query.take(limit + 1);

    // Filter by session type if specified
    let filteredSessions = sessions;
    if (args.sessionType) {
      filteredSessions = sessions.filter(s => s.sessionType === args.sessionType);
    }
    if (args.trackName) {
      filteredSessions = filteredSessions.filter(s => s.trackName === args.trackName);
    }

    const hasMore = filteredSessions.length > limit;
    const results = filteredSessions.slice(0, limit);

    return {
      sessions: results,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]?._id : null,
    };
  },
});

// Get public sessions for social feed
export const getPublicSessions = query({
  args: {
    limit: v.optional(v.number()),
    trackName: v.optional(v.string()),
    sessionType: v.optional(v.union(v.literal('practice'), v.literal('qualifying'), v.literal('race'), v.literal('time_trial'))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit * 2); // Fetch more to account for filtering

    // Apply filters
    if (args.trackName) {
      sessions = sessions.filter(s => s.trackName === args.trackName);
    }
    if (args.sessionType) {
      sessions = sessions.filter(s => s.sessionType === args.sessionType);
    }

    sessions = sessions.slice(0, limit);

    // Enrich with user info
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
        };
      })
    );

    return enrichedSessions;
  },
});

// Get sessions by track
export const getSessionsByTrack = query({
  args: {
    trackName: v.string(),
    limit: v.optional(v.number()),
    includePrivate: v.optional(v.boolean()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let sessions = await ctx.db
      .query("sessions")
      .withIndex("by_track", (q) => q.eq("trackName", args.trackName))
      .order("desc")
      .take(limit * 2);

    // Filter by privacy
    if (!args.includePrivate) {
      sessions = sessions.filter(s => s.isPublic || (args.userId && s.userId === args.userId));
    }

    sessions = sessions.slice(0, limit);

    // Enrich with user info and calculate rankings
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          ...session,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
        };
      })
    );

    // Sort by best lap time for leaderboard-style results
    enrichedSessions.sort((a, b) => {
      if (a.bestLapTime === 0) return 1;
      if (b.bestLapTime === 0) return -1;
      return a.bestLapTime - b.bestLapTime;
    });

    return enrichedSessions.map((session, index) => ({
      ...session,
      rank: index + 1,
    }));
  },
});

// Get recent sessions
export const getRecentSessions = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    includePrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    let sessions;

    if (args.userId) {
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);
    } else {
      // Get public sessions
      sessions = await ctx.db
        .query("sessions")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .order("desc")
        .take(limit);
    }

    // Enrich with user info
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        const lapCount = (await ctx.db
          .query("laps")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect()).length;

        return {
          ...session,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
          actualLapCount: lapCount,
        };
      })
    );

    return enrichedSessions;
  },
});

// Get session with full details including laps
export const getSessionWithLaps = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    const user = await ctx.db.get(session.userId);

    const laps = await ctx.db
      .query("laps")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    const analysisResults = await ctx.db
      .query("analysisResults")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return {
      ...session,
      user: user ? {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      } : null,
      laps,
      analysisResults,
    };
  },
});

// Get unique track names
export const getTrackNames = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .collect();

    const trackNames = [...new Set(sessions.map(s => s.trackName))];
    return trackNames.sort();
  },
});

// Get unique car models
export const getCarModels = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("sessions")
      .collect();

    const carModels = [...new Set(sessions.map(s => s.carModel))];
    return carModels.sort();
  },
});
