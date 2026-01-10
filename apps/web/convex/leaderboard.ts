import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ==========================================
// CONSTANTS & TYPES
// ==========================================

// Points awarded for different actions
const POINTS = {
  SESSION_COMPLETION: 10,
  PERSONAL_BEST: 50,
  TRACK_RECORD: 100,
  FIRST_LAP: 10,
  HUNDRED_LAPS: 100,
  THOUSAND_LAPS: 500,
  TRACK_MASTER: 250,
  CONSISTENT: 75,
  IMPROVER: 50,
  SOCIAL: 50,
  ANALYST: 150,
} as const;

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 999 },
  silver: { min: 1000, max: 4999 },
  gold: { min: 5000, max: 9999 },
  platinum: { min: 10000, max: 24999 },
  diamond: { min: 25000, max: Infinity },
} as const;

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  {
    achievementId: 'first_lap',
    name: 'First Lap',
    description: 'Complete your first lap',
    category: 'laps' as const,
    icon: 'flag',
    tier: 'bronze' as const,
    points: POINTS.FIRST_LAP,
    requirement: { type: 'laps', target: 1 },
  },
  {
    achievementId: 'hundred_laps',
    name: '100 Laps',
    description: 'Complete 100 laps across all tracks',
    category: 'laps' as const,
    icon: 'repeat',
    tier: 'silver' as const,
    points: POINTS.HUNDRED_LAPS,
    requirement: { type: 'laps', target: 100 },
  },
  {
    achievementId: 'thousand_laps',
    name: '1000 Laps',
    description: 'Complete 1000 laps - you are dedicated!',
    category: 'laps' as const,
    icon: 'star',
    tier: 'gold' as const,
    points: POINTS.THOUSAND_LAPS,
    requirement: { type: 'laps', target: 1000 },
  },
  {
    achievementId: 'track_master',
    name: 'Track Master',
    description: 'Drive on all available tracks',
    category: 'tracks' as const,
    icon: 'map',
    tier: 'gold' as const,
    points: POINTS.TRACK_MASTER,
    requirement: { type: 'unique_tracks', target: 10 },
  },
  {
    achievementId: 'consistent',
    name: 'Consistent',
    description: 'Complete 10 laps within 1% variance of each other',
    category: 'consistency' as const,
    icon: 'timeline',
    tier: 'silver' as const,
    points: POINTS.CONSISTENT,
    requirement: { type: 'consistency', target: 10 },
  },
  {
    achievementId: 'improver',
    name: 'Improver',
    description: 'Beat your personal best lap time',
    category: 'improvement' as const,
    icon: 'trending_up',
    tier: 'bronze' as const,
    points: POINTS.IMPROVER,
    requirement: { type: 'personal_best', target: 1 },
  },
  {
    achievementId: 'social_butterfly',
    name: 'Social',
    description: 'Gain 10 followers',
    category: 'social' as const,
    icon: 'people',
    tier: 'silver' as const,
    points: POINTS.SOCIAL,
    requirement: { type: 'followers', target: 10 },
  },
  {
    achievementId: 'analyst',
    name: 'Analyst',
    description: 'Complete 100 telemetry analysis sessions',
    category: 'analysis' as const,
    icon: 'analytics',
    tier: 'gold' as const,
    points: POINTS.ANALYST,
    requirement: { type: 'analysis', target: 100 },
  },
  {
    achievementId: 'ten_sessions',
    name: 'Getting Started',
    description: 'Complete 10 racing sessions',
    category: 'laps' as const,
    icon: 'play_circle',
    tier: 'bronze' as const,
    points: 25,
    requirement: { type: 'sessions', target: 10 },
  },
  {
    achievementId: 'fifty_sessions',
    name: 'Regular Racer',
    description: 'Complete 50 racing sessions',
    category: 'laps' as const,
    icon: 'local_fire_department',
    tier: 'silver' as const,
    points: 75,
    requirement: { type: 'sessions', target: 50 },
  },
  {
    achievementId: 'speed_demon',
    name: 'Speed Demon',
    description: 'Reach a top speed of 300 km/h',
    category: 'special' as const,
    icon: 'speed',
    tier: 'silver' as const,
    points: 50,
    requirement: { type: 'top_speed', target: 300 },
  },
  {
    achievementId: 'night_owl',
    name: 'Night Owl',
    description: 'Complete 10 sessions after midnight',
    category: 'special' as const,
    icon: 'nightlight',
    tier: 'bronze' as const,
    points: 30,
    requirement: { type: 'night_sessions', target: 10 },
  },
];

// Helper function to determine tier from points
function getTierFromPoints(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' {
  if (points >= TIER_THRESHOLDS.diamond.min) return 'diamond';
  if (points >= TIER_THRESHOLDS.platinum.min) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold.min) return 'gold';
  if (points >= TIER_THRESHOLDS.silver.min) return 'silver';
  return 'bronze';
}

// ==========================================
// LEADERBOARD QUERIES
// ==========================================

// Get track leaderboard by track, car class, and time period
export const getTrackLeaderboard = query({
  args: {
    trackId: v.string(),
    carClass: v.optional(v.union(
      v.literal('gr1'),
      v.literal('gr2'),
      v.literal('gr3'),
      v.literal('gr4'),
      v.literal('grb'),
      v.literal('n100'),
      v.literal('n200'),
      v.literal('n300'),
      v.literal('n400'),
      v.literal('n500'),
      v.literal('n600'),
      v.literal('n700'),
      v.literal('n800'),
      v.literal('n1000'),
      v.literal('all')
    )),
    timePeriod: v.optional(v.union(
      v.literal('daily'),
      v.literal('weekly'),
      v.literal('monthly'),
      v.literal('all_time')
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const carClass = args.carClass || 'all';
    const timePeriod = args.timePeriod || 'all_time';

    // Calculate time filter
    const now = Date.now();
    let timeFilter = 0;
    switch (timePeriod) {
      case 'daily':
        timeFilter = now - 24 * 60 * 60 * 1000;
        break;
      case 'weekly':
        timeFilter = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        timeFilter = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeFilter = 0;
    }

    // Get leaderboard for this track and class
    const leaderboard = await ctx.db
      .query("leaderboards")
      .withIndex("by_track_class", (q) =>
        q.eq("trackId", args.trackId).eq("carClass", carClass)
      )
      .first();

    if (!leaderboard) {
      // If no leaderboard exists, try to build one from sessions
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_track", (q) => q.eq("trackName", args.trackId))
        .collect();

      // Filter by time if needed
      const filteredSessions = timeFilter > 0
        ? sessions.filter(s => s.sessionDate >= timeFilter)
        : sessions;

      // Build leaderboard from sessions
      const userBestTimes: Map<string, {
        userId: any;
        lapTime: number;
        carModel: string;
        sessionId: any;
        recordedAt: number;
      }> = new Map();

      for (const session of filteredSessions) {
        if (session.bestLapTime > 0 && session.isCompleted) {
          const userId = session.userId.toString();
          const existing = userBestTimes.get(userId);
          if (!existing || session.bestLapTime < existing.lapTime) {
            userBestTimes.set(userId, {
              userId: session.userId,
              lapTime: session.bestLapTime,
              carModel: session.carModel,
              sessionId: session._id,
              recordedAt: session.sessionDate,
            });
          }
        }
      }

      // Convert to array and sort
      const entries = Array.from(userBestTimes.values());
      entries.sort((a, b) => a.lapTime - b.lapTime);

      // Get user details and build records
      const records = await Promise.all(
        entries.slice(0, limit).map(async (entry, index) => {
          const user = await ctx.db.get(entry.userId);
          const trackRecord = index === 0;
          return {
            rank: index + 1,
            userId: entry.userId,
            userName: user?.name || 'Unknown',
            userAvatar: user?.avatar,
            lapTime: entry.lapTime,
            carModel: entry.carModel,
            sessionId: entry.sessionId,
            recordedAt: entry.recordedAt,
            isPersonalBest: true,
            isTrackRecord: trackRecord,
            delta: index > 0 ? entry.lapTime - entries[0].lapTime : 0,
          };
        })
      );

      return {
        trackId: args.trackId,
        trackName: args.trackId,
        carClass,
        records,
        lastUpdated: now,
        timePeriod,
        totalEntries: records.length,
      };
    }

    // Filter by time if needed
    let records = leaderboard.records;
    if (timeFilter > 0) {
      records = records.filter(r => r.recordedAt >= timeFilter);
    }

    return {
      trackId: leaderboard.trackId,
      trackName: leaderboard.trackName,
      carClass: leaderboard.carClass,
      records: records.slice(0, limit),
      lastUpdated: leaderboard.lastUpdated,
      trackLength: leaderboard.trackLength,
      trackCountry: leaderboard.trackCountry,
      timePeriod,
      totalEntries: records.length,
    };
  },
});

// Get global rankings
export const getGlobalRankings = query({
  args: {
    tier: v.optional(v.union(
      v.literal('bronze'),
      v.literal('silver'),
      v.literal('gold'),
      v.literal('platinum'),
      v.literal('diamond')
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    seasonId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    let rankings;
    if (args.tier) {
      rankings = await ctx.db
        .query("rankings")
        .withIndex("by_tier", (q) => q.eq("tier", args.tier!))
        .collect();
    } else if (args.seasonId) {
      rankings = await ctx.db
        .query("rankings")
        .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
        .collect();
    } else {
      rankings = await ctx.db
        .query("rankings")
        .collect();
    }

    // Sort by rank
    rankings.sort((a, b) => a.rank - b.rank);

    // Apply pagination
    const paginatedRankings = rankings.slice(offset, offset + limit);

    // Calculate rank changes
    const withChanges = paginatedRankings.map(ranking => ({
      ...ranking,
      rankChange: ranking.previousRank
        ? ranking.previousRank - ranking.rank
        : 0,
    }));

    return {
      rankings: withChanges,
      total: rankings.length,
      hasMore: offset + limit < rankings.length,
      tierDistribution: {
        bronze: rankings.filter(r => r.tier === 'bronze').length,
        silver: rankings.filter(r => r.tier === 'silver').length,
        gold: rankings.filter(r => r.tier === 'gold').length,
        platinum: rankings.filter(r => r.tier === 'platinum').length,
        diamond: rankings.filter(r => r.tier === 'diamond').length,
      },
    };
  },
});

// Get user's rank
export const getUserRank = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const ranking = await ctx.db
      .query("rankings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!ranking) {
      // User doesn't have a ranking yet, create a default
      const user = await ctx.db.get(args.userId);
      return {
        userId: args.userId,
        userName: user?.name || 'Unknown',
        userAvatar: user?.avatar,
        rank: 0,
        points: 0,
        tier: 'bronze' as const,
        stats: {
          totalSessions: 0,
          totalLaps: 0,
          totalDistance: 0,
          personalBests: 0,
          trackRecords: 0,
          achievementsUnlocked: 0,
        },
        pointsBreakdown: {
          sessionPoints: 0,
          personalBestPoints: 0,
          trackRecordPoints: 0,
          achievementPoints: 0,
          bonusPoints: 0,
        },
        nextTier: {
          name: 'silver',
          pointsNeeded: TIER_THRESHOLDS.silver.min,
          progress: 0,
        },
        isNewUser: true,
      };
    }

    // Calculate next tier progress
    const currentTier = ranking.tier;
    let nextTier = null;
    if (currentTier !== 'diamond') {
      const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
      const currentIndex = tiers.indexOf(currentTier);
      const nextTierName = tiers[currentIndex + 1];
      const nextThreshold = TIER_THRESHOLDS[nextTierName].min;
      const currentThreshold = TIER_THRESHOLDS[currentTier].min;
      const progress = ((ranking.points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

      nextTier = {
        name: nextTierName,
        pointsNeeded: nextThreshold - ranking.points,
        progress: Math.min(100, Math.max(0, progress)),
      };
    }

    return {
      ...ranking,
      rankChange: ranking.previousRank
        ? ranking.previousRank - ranking.rank
        : 0,
      nextTier,
      isNewUser: false,
    };
  },
});

// Get user achievements
export const getAchievements = query({
  args: {
    userId: v.id("users"),
    category: v.optional(v.union(
      v.literal('laps'),
      v.literal('tracks'),
      v.literal('consistency'),
      v.literal('improvement'),
      v.literal('social'),
      v.literal('analysis'),
      v.literal('special')
    )),
  },
  handler: async (ctx, args) => {
    let achievements;
    if (args.category) {
      achievements = await ctx.db
        .query("achievements")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
      achievements = achievements.filter(a => a.achievementCategory === args.category);
    } else {
      achievements = await ctx.db
        .query("achievements")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();
    }

    // Sort by unlock date (most recent first)
    achievements.sort((a, b) => b.unlockedAt - a.unlockedAt);

    // Get all possible achievements
    const allAchievements = ACHIEVEMENT_DEFINITIONS.map(def => {
      const unlocked = achievements.find(a => a.achievementId === def.achievementId);
      return {
        ...def,
        isUnlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt,
        progress: unlocked?.progress,
      };
    });

    // Calculate stats
    const unlockedCount = achievements.length;
    const totalCount = ACHIEVEMENT_DEFINITIONS.length;
    const totalPoints = achievements.reduce((sum, a) => sum + a.pointsAwarded, 0);

    return {
      achievements: allAchievements,
      unlockedAchievements: achievements,
      stats: {
        unlocked: unlockedCount,
        total: totalCount,
        percentage: Math.round((unlockedCount / totalCount) * 100),
        totalPoints,
      },
      categories: {
        laps: allAchievements.filter(a => a.category === 'laps'),
        tracks: allAchievements.filter(a => a.category === 'tracks'),
        consistency: allAchievements.filter(a => a.category === 'consistency'),
        improvement: allAchievements.filter(a => a.category === 'improvement'),
        social: allAchievements.filter(a => a.category === 'social'),
        analysis: allAchievements.filter(a => a.category === 'analysis'),
        special: allAchievements.filter(a => a.category === 'special'),
      },
    };
  },
});

// Get all available tracks for leaderboard
export const getAvailableTracks = query({
  args: {},
  handler: async (ctx) => {
    // Get unique tracks from sessions
    const sessions = await ctx.db.query("sessions").collect();
    const trackSet = new Map<string, { name: string; sessions: number; bestTime: number }>();

    for (const session of sessions) {
      const existing = trackSet.get(session.trackName);
      if (existing) {
        existing.sessions++;
        if (session.bestLapTime > 0 && (existing.bestTime === 0 || session.bestLapTime < existing.bestTime)) {
          existing.bestTime = session.bestLapTime;
        }
      } else {
        trackSet.set(session.trackName, {
          name: session.trackName,
          sessions: 1,
          bestTime: session.bestLapTime > 0 ? session.bestLapTime : 0,
        });
      }
    }

    return Array.from(trackSet.entries()).map(([id, data]) => ({
      trackId: id,
      trackName: data.name,
      totalSessions: data.sessions,
      trackRecord: data.bestTime,
    })).sort((a, b) => b.totalSessions - a.totalSessions);
  },
});

// ==========================================
// LEADERBOARD MUTATIONS
// ==========================================

// Update leaderboard when a new lap time is recorded
export const updateLeaderboard = mutation({
  args: {
    trackId: v.string(),
    trackName: v.string(),
    carClass: v.union(
      v.literal('gr1'),
      v.literal('gr2'),
      v.literal('gr3'),
      v.literal('gr4'),
      v.literal('grb'),
      v.literal('n100'),
      v.literal('n200'),
      v.literal('n300'),
      v.literal('n400'),
      v.literal('n500'),
      v.literal('n600'),
      v.literal('n700'),
      v.literal('n800'),
      v.literal('n1000'),
      v.literal('all')
    ),
    userId: v.id("users"),
    lapTime: v.number(),
    carModel: v.string(),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Get existing leaderboard
    let leaderboard = await ctx.db
      .query("leaderboards")
      .withIndex("by_track_class", (q) =>
        q.eq("trackId", args.trackId).eq("carClass", args.carClass)
      )
      .first();

    const newRecord = {
      rank: 0,
      userId: args.userId,
      userName: user.name,
      userAvatar: user.avatar,
      lapTime: args.lapTime,
      carModel: args.carModel,
      sessionId: args.sessionId,
      recordedAt: now,
      isPersonalBest: false,
      isTrackRecord: false,
    };

    let isPersonalBest = false;
    let isTrackRecord = false;
    let pointsEarned = POINTS.SESSION_COMPLETION;

    if (leaderboard) {
      // Check if this is a personal best for the user
      const userRecords = leaderboard.records.filter(r => r.userId === args.userId);
      const previousBest = userRecords.length > 0
        ? Math.min(...userRecords.map(r => r.lapTime))
        : Infinity;

      isPersonalBest = args.lapTime < previousBest;

      // Check if this is a track record
      const currentRecord = leaderboard.records.length > 0
        ? Math.min(...leaderboard.records.map(r => r.lapTime))
        : Infinity;

      isTrackRecord = args.lapTime < currentRecord;

      // Update record flags
      newRecord.isPersonalBest = isPersonalBest;
      newRecord.isTrackRecord = isTrackRecord;

      // Calculate points
      if (isPersonalBest) pointsEarned += POINTS.PERSONAL_BEST;
      if (isTrackRecord) pointsEarned += POINTS.TRACK_RECORD;

      // Remove old records from this user if this is a personal best
      let updatedRecords = isPersonalBest
        ? leaderboard.records.filter(r => r.userId !== args.userId)
        : leaderboard.records;

      // Add new record
      updatedRecords.push(newRecord);

      // Sort by lap time
      updatedRecords.sort((a, b) => a.lapTime - b.lapTime);

      // Update ranks and track record flags
      updatedRecords = updatedRecords.map((record, index) => ({
        ...record,
        rank: index + 1,
        isTrackRecord: index === 0,
        delta: index > 0 ? record.lapTime - updatedRecords[0].lapTime : 0,
      }));

      // Update leaderboard
      await ctx.db.patch(leaderboard._id, {
        records: updatedRecords,
        lastUpdated: now,
      });
    } else {
      // Create new leaderboard
      newRecord.rank = 1;
      newRecord.isPersonalBest = true;
      newRecord.isTrackRecord = true;
      isPersonalBest = true;
      isTrackRecord = true;
      pointsEarned += POINTS.PERSONAL_BEST + POINTS.TRACK_RECORD;

      await ctx.db.insert("leaderboards", {
        trackId: args.trackId,
        trackName: args.trackName,
        carClass: args.carClass,
        records: [newRecord],
        lastUpdated: now,
      });
    }

    // Update user ranking points
    await updateUserPoints(ctx, args.userId, pointsEarned, {
      sessionPoints: POINTS.SESSION_COMPLETION,
      personalBestPoints: isPersonalBest ? POINTS.PERSONAL_BEST : 0,
      trackRecordPoints: isTrackRecord ? POINTS.TRACK_RECORD : 0,
    });

    return {
      isPersonalBest,
      isTrackRecord,
      pointsEarned,
      newRank: newRecord.rank,
    };
  },
});

// Helper function to update user points
async function updateUserPoints(
  ctx: any,
  userId: any,
  pointsToAdd: number,
  breakdown: {
    sessionPoints?: number;
    personalBestPoints?: number;
    trackRecordPoints?: number;
    achievementPoints?: number;
    bonusPoints?: number;
  }
) {
  const now = Date.now();
  const user = await ctx.db.get(userId);

  if (!user) return;

  // Get existing ranking
  let ranking = await ctx.db
    .query("rankings")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (ranking) {
    const newPoints = ranking.points + pointsToAdd;
    const newTier = getTierFromPoints(newPoints);

    await ctx.db.patch(ranking._id, {
      points: newPoints,
      tier: newTier,
      previousRank: ranking.rank,
      pointsBreakdown: {
        sessionPoints: ranking.pointsBreakdown.sessionPoints + (breakdown.sessionPoints || 0),
        personalBestPoints: ranking.pointsBreakdown.personalBestPoints + (breakdown.personalBestPoints || 0),
        trackRecordPoints: ranking.pointsBreakdown.trackRecordPoints + (breakdown.trackRecordPoints || 0),
        achievementPoints: ranking.pointsBreakdown.achievementPoints + (breakdown.achievementPoints || 0),
        bonusPoints: ranking.pointsBreakdown.bonusPoints + (breakdown.bonusPoints || 0),
      },
      lastUpdated: now,
    });
  } else {
    // Create new ranking
    await ctx.db.insert("rankings", {
      userId,
      userName: user.name,
      userAvatar: user.avatar,
      rank: 0, // Will be calculated in recalculate
      points: pointsToAdd,
      tier: getTierFromPoints(pointsToAdd),
      stats: {
        totalSessions: 1,
        totalLaps: 0,
        totalDistance: 0,
        personalBests: breakdown.personalBestPoints ? 1 : 0,
        trackRecords: breakdown.trackRecordPoints ? 1 : 0,
        achievementsUnlocked: 0,
      },
      pointsBreakdown: {
        sessionPoints: breakdown.sessionPoints || 0,
        personalBestPoints: breakdown.personalBestPoints || 0,
        trackRecordPoints: breakdown.trackRecordPoints || 0,
        achievementPoints: breakdown.achievementPoints || 0,
        bonusPoints: breakdown.bonusPoints || 0,
      },
      lastUpdated: now,
      createdAt: now,
    });
  }

  // Recalculate all ranks
  await recalculateRanks(ctx);
}

// Recalculate all user ranks
async function recalculateRanks(ctx: any) {
  const rankings = await ctx.db.query("rankings").collect();

  // Sort by points (descending)
  rankings.sort((a: any, b: any) => b.points - a.points);

  // Update ranks
  for (let i = 0; i < rankings.length; i++) {
    if (rankings[i].rank !== i + 1) {
      await ctx.db.patch(rankings[i]._id, {
        previousRank: rankings[i].rank,
        rank: i + 1,
      });
    }
  }
}

// Unlock achievement for user
export const unlockAchievement = internalMutation({
  args: {
    userId: v.id("users"),
    achievementId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if already unlocked
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_user_achievement", (q) =>
        q.eq("userId", args.userId).eq("achievementId", args.achievementId)
      )
      .first();

    if (existing) {
      return { alreadyUnlocked: true, achievement: existing };
    }

    // Find achievement definition
    const definition = ACHIEVEMENT_DEFINITIONS.find(a => a.achievementId === args.achievementId);

    if (!definition) {
      throw new Error("Achievement not found");
    }

    // Create achievement record
    const achievementId = await ctx.db.insert("achievements", {
      userId: args.userId,
      achievementId: args.achievementId,
      achievementName: definition.name,
      achievementDescription: definition.description,
      achievementCategory: definition.category,
      achievementIcon: definition.icon,
      achievementTier: definition.tier,
      pointsAwarded: definition.points,
      unlockedAt: now,
      metadata: args.metadata,
    });

    const achievement = await ctx.db.get(achievementId);

    // Update user points
    await updateUserPoints(ctx, args.userId, definition.points, {
      achievementPoints: definition.points,
    });

    // Update ranking stats
    const ranking = await ctx.db
      .query("rankings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (ranking) {
      await ctx.db.patch(ranking._id, {
        stats: {
          ...ranking.stats,
          achievementsUnlocked: ranking.stats.achievementsUnlocked + 1,
        },
      });
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "achievement",
      content: `You unlocked the "${definition.name}" achievement!`,
      isRead: false,
      relatedId: args.achievementId,
      relatedType: "achievement",
      timestamp: now,
      metadata: {
        achievementType: args.achievementId,
      },
    });

    return {
      alreadyUnlocked: false,
      achievement,
      pointsAwarded: definition.points,
    };
  },
});

// Check and unlock achievements based on user stats
export const checkAchievements = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { unlocked: [] };

    // Get user stats from sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const totalLaps = sessions.reduce((sum, s) => sum + s.lapCount, 0);
    const totalSessions = sessions.length;
    const uniqueTracks = new Set(sessions.map(s => s.trackName)).size;
    const topSpeed = Math.max(...sessions.map(s => s.topSpeed), 0);

    // Get analysis count
    const analyses = await ctx.db
      .query("analysisResults")
      .collect();
    const userAnalyses = analyses.filter(a => {
      const session = sessions.find(s => s._id === a.sessionId);
      return session !== undefined;
    }).length;

    // Get follower count
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    // Check each achievement
    const unlockedAchievements: string[] = [];

    // Lap achievements
    if (totalLaps >= 1) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'first_lap',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('first_lap');
    }

    if (totalLaps >= 100) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'hundred_laps',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('hundred_laps');
    }

    if (totalLaps >= 1000) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'thousand_laps',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('thousand_laps');
    }

    // Session achievements
    if (totalSessions >= 10) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'ten_sessions',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('ten_sessions');
    }

    if (totalSessions >= 50) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'fifty_sessions',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('fifty_sessions');
    }

    // Track Master
    if (uniqueTracks >= 10) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'track_master',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('track_master');
    }

    // Speed Demon
    if (topSpeed >= 300) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'speed_demon',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('speed_demon');
    }

    // Social
    if (followers.length >= 10) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'social_butterfly',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('social_butterfly');
    }

    // Analyst
    if (userAnalyses >= 100) {
      const result = await ctx.runMutation(internal.leaderboard.unlockAchievement, {
        userId: args.userId,
        achievementId: 'analyst',
      });
      if (!result.alreadyUnlocked) unlockedAchievements.push('analyst');
    }

    return { unlocked: unlockedAchievements };
  },
});

// Initialize rankings for all existing users
export const initializeRankings = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    for (const user of users) {
      // Check if ranking exists
      const existing = await ctx.db
        .query("rankings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .first();

      if (!existing) {
        // Get user stats
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const totalLaps = sessions.reduce((sum, s) => sum + s.lapCount, 0);
        const points = sessions.length * POINTS.SESSION_COMPLETION;

        await ctx.db.insert("rankings", {
          userId: user._id,
          userName: user.name,
          userAvatar: user.avatar,
          rank: 0,
          points,
          tier: getTierFromPoints(points),
          stats: {
            totalSessions: sessions.length,
            totalLaps,
            totalDistance: totalLaps * 5,
            personalBests: 0,
            trackRecords: 0,
            achievementsUnlocked: 0,
          },
          pointsBreakdown: {
            sessionPoints: points,
            personalBestPoints: 0,
            trackRecordPoints: 0,
            achievementPoints: 0,
            bonusPoints: 0,
          },
          lastUpdated: now,
          createdAt: now,
        });
      }
    }

    // Recalculate ranks
    await recalculateRanks(ctx);

    return { initialized: true };
  },
});

// Get tier information
export const getTierInfo = query({
  args: {},
  handler: async () => {
    return {
      tiers: [
        { name: 'Bronze', id: 'bronze', minPoints: 0, maxPoints: 999, color: '#CD7F32', icon: 'shield' },
        { name: 'Silver', id: 'silver', minPoints: 1000, maxPoints: 4999, color: '#C0C0C0', icon: 'shield' },
        { name: 'Gold', id: 'gold', minPoints: 5000, maxPoints: 9999, color: '#FFD700', icon: 'shield' },
        { name: 'Platinum', id: 'platinum', minPoints: 10000, maxPoints: 24999, color: '#E5E4E2', icon: 'star' },
        { name: 'Diamond', id: 'diamond', minPoints: 25000, maxPoints: Infinity, color: '#B9F2FF', icon: 'diamond' },
      ],
      pointsSystem: {
        sessionCompletion: POINTS.SESSION_COMPLETION,
        personalBest: POINTS.PERSONAL_BEST,
        trackRecord: POINTS.TRACK_RECORD,
      },
    };
  },
});

// Get recent activity for leaderboard
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get recent achievements
    const recentAchievements = await ctx.db
      .query("achievements")
      .withIndex("by_unlocked")
      .order("desc")
      .take(limit);

    // Get recent track records
    const leaderboards = await ctx.db.query("leaderboards").collect();
    const recentRecords: any[] = [];

    for (const lb of leaderboards) {
      const trackRecords = lb.records.filter(r => r.isTrackRecord);
      for (const record of trackRecords) {
        recentRecords.push({
          type: 'track_record',
          trackName: lb.trackName,
          trackId: lb.trackId,
          ...record,
        });
      }
    }

    recentRecords.sort((a, b) => b.recordedAt - a.recordedAt);

    return {
      achievements: recentAchievements.map(a => ({
        type: 'achievement',
        userId: a.userId,
        achievementName: a.achievementName,
        achievementIcon: a.achievementIcon,
        achievementTier: a.achievementTier,
        timestamp: a.unlockedAt,
      })),
      trackRecords: recentRecords.slice(0, limit),
    };
  },
});
