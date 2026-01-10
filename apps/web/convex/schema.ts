import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for authentication and profiles
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.optional(v.string()), // bcrypt hashed password
    refreshTokenHash: v.optional(v.string()), // hashed refresh token for validation
    avatar: v.optional(v.string()),
    role: v.union(v.literal('user'), v.literal('admin'), v.literal('premium')),
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
    isActive: v.boolean(),
    emailVerified: v.optional(v.boolean()),
    failedLoginAttempts: v.optional(v.number()),
    lockoutUntil: v.optional(v.number()),
    subscription: v.optional(v.object({
      plan: v.union(v.literal('free'), v.literal('premium'), v.literal('pro')),
      status: v.union(v.literal('active'), v.literal('canceled'), v.literal('expired')),
      expiresAt: v.optional(v.number()),
    })),
    preferences: v.optional(v.object({
      theme: v.union(v.literal('light'), v.literal('dark')),
      units: v.union(v.literal('metric'), v.literal('imperial')),
      notifications: v.boolean(),
      privacy: v.object({
        shareData: v.boolean(),
        publicProfile: v.boolean(),
      }),
    })),
    stats: v.optional(v.object({
      totalSessions: v.number(),
      totalLaps: v.number(),
      totalDistance: v.number(),
      bestLapTime: v.optional(v.number()),
      favoriteTrack: v.optional(v.string()),
    })),
  // Stripe integration fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  }).index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_created", ["createdAt"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // Telemetry sessions
  sessions: defineTable({
    userId: v.id("users"),
    trackName: v.string(),
    carModel: v.string(),
    sessionDate: v.number(),
    sessionType: v.union(v.literal('practice'), v.literal('qualifying'), v.literal('race'), v.literal('time_trial')),
    lapCount: v.number(),
    bestLapTime: v.number(),
    averageLapTime: v.number(),
    totalSessionTime: v.number(),
    weatherConditions: v.string(),
    trackCondition: v.union(v.literal('dry'), v.literal('wet'), v.literal('damp')),
    tyreFront: v.string(),
    tyreRear: v.string(),
    fuelUsed: v.number(),
    topSpeed: v.number(),
    averageSpeed: v.number(),
    isCompleted: v.boolean(),
    isPublic: v.boolean(),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({
      gameVersion: v.string(),
      platform: v.string(),
      recordingDevice: v.string(),
      dataQuality: v.number(),
      packetLoss: v.number(),
    })),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "sessionDate"])
    .index("by_track", ["trackName"])
    .index("by_public", ["isPublic"])
    .index("by_type", ["sessionType"]),

  // Individual laps within a session
  laps: defineTable({
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
    isValid: v.boolean(),
    position: v.number(),
    penalties: v.optional(v.array(v.string())),
    weather: v.optional(v.string()),
    trackPosition: v.optional(v.object({
      sector: v.number(),
      progress: v.number(),
    })),
  }).index("by_session", ["sessionId"])
    .index("by_session_lap", ["sessionId", "lapNumber"])
    .index("by_valid", ["isValid"]),

  // Detailed telemetry points
  telemetryPoints: defineTable({
    sessionId: v.id("sessions"),
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
    flags: v.optional(v.array(v.string())),
    isOnTrack: v.boolean(),
    isInPits: v.boolean(),
  }).index("by_session", ["sessionId"])
    .index("by_session_lap", ["sessionId", "lapNumber"])
    .index("by_timestamp", ["timestamp"])
    .index("by_game_timestamp", ["gameTimestamp"]),

  // Analysis results
  analysisResults: defineTable({
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
    result: v.any(), // Flexible JSON data
    createdAt: v.number(),
    parameters: v.optional(v.object({
      algorithm: v.string(),
      version: v.string(),
      settings: v.any(),
    })),
    confidence: v.optional(v.number()),
    recommendations: v.optional(v.array(v.string())),
  }).index("by_session", ["sessionId"])
    .index("by_type", ["analysisType"])
    .index("by_session_type", ["sessionId", "analysisType"])
    .index("by_created", ["createdAt"]),

  // User activity logs
  activityLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resource: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // System settings
  settings: defineTable({
    key: v.string(),
    value: v.any(),
    category: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"])
    .index("by_category", ["category"]),

  // ==========================================
  // SOCIAL NETWORK TABLES
  // ==========================================

  // Follows - track follower/following relationships
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    timestamp: v.number(),
  }).index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"])
    .index("by_timestamp", ["timestamp"]),

  // Likes - track session likes
  likes: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"])
    .index("by_timestamp", ["timestamp"]),

  // Comments - comments and replies on sessions
  comments: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    content: v.string(),
    timestamp: v.number(),
    parentId: v.optional(v.id("comments")),
    isEdited: v.optional(v.boolean()),
    editedAt: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    likeCount: v.optional(v.number()),
  }).index("by_session", ["sessionId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .index("by_session_timestamp", ["sessionId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  // Notifications - user notifications for social activities
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("follow"),
      v.literal("like"),
      v.literal("comment"),
      v.literal("reply"),
      v.literal("mention"),
      v.literal("session_shared"),
      v.literal("achievement"),
      v.literal("leaderboard_update")
    ),
    content: v.string(),
    isRead: v.boolean(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.union(
      v.literal("user"),
      v.literal("session"),
      v.literal("comment"),
      v.literal("achievement")
    )),
    actorId: v.optional(v.id("users")),
    timestamp: v.number(),
    metadata: v.optional(v.object({
      sessionId: v.optional(v.id("sessions")),
      commentId: v.optional(v.id("comments")),
      achievementType: v.optional(v.string()),
      lapTime: v.optional(v.number()),
      trackName: v.optional(v.string()),
    })),
  }).index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  // Comment likes - track likes on comments
  commentLikes: defineTable({
    userId: v.id("users"),
    commentId: v.id("comments"),
    timestamp: v.number(),
  }).index("by_user", ["userId"])
    .index("by_comment", ["commentId"])
    .index("by_user_comment", ["userId", "commentId"]),

  // Shares - track session shares
  shares: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    platform: v.union(
      v.literal("internal"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("reddit"),
      v.literal("discord"),
      v.literal("link")
    ),
    timestamp: v.number(),
    message: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_platform", ["platform"])
    .index("by_timestamp", ["timestamp"]),

  // Leaderboard entries - cached leaderboard data
  leaderboardEntries: defineTable({
    userId: v.id("users"),
    trackName: v.string(),
    carModel: v.optional(v.string()),
    bestLapTime: v.number(),
    sessionId: v.id("sessions"),
    rank: v.number(),
    category: v.union(
      v.literal("overall"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("car_class")
    ),
    carClass: v.optional(v.string()),
    timestamp: v.number(),
    verified: v.boolean(),
  }).index("by_track", ["trackName"])
    .index("by_track_category", ["trackName", "category"])
    .index("by_user", ["userId"])
    .index("by_rank", ["rank"])
    .index("by_track_rank", ["trackName", "rank"])
    .index("by_timestamp", ["timestamp"]),

  // ==========================================
  // LEADERBOARD & RANKING SYSTEM TABLES
  // ==========================================

  // Track leaderboards with records
  leaderboards: defineTable({
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
    records: v.array(v.object({
      rank: v.number(),
      userId: v.id("users"),
      userName: v.string(),
      userAvatar: v.optional(v.string()),
      lapTime: v.number(),
      carModel: v.string(),
      sessionId: v.id("sessions"),
      recordedAt: v.number(),
      isPersonalBest: v.boolean(),
      isTrackRecord: v.boolean(),
      delta: v.optional(v.number()),
    })),
    lastUpdated: v.number(),
    trackLength: v.optional(v.number()),
    trackCountry: v.optional(v.string()),
    trackCategory: v.optional(v.string()),
  }).index("by_track", ["trackId"])
    .index("by_track_class", ["trackId", "carClass"])
    .index("by_updated", ["lastUpdated"]),

  // Global user rankings with points system
  rankings: defineTable({
    userId: v.id("users"),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    rank: v.number(),
    previousRank: v.optional(v.number()),
    points: v.number(),
    tier: v.union(
      v.literal('bronze'),
      v.literal('silver'),
      v.literal('gold'),
      v.literal('platinum'),
      v.literal('diamond')
    ),
    seasonId: v.optional(v.string()),
    stats: v.object({
      totalSessions: v.number(),
      totalLaps: v.number(),
      totalDistance: v.number(),
      personalBests: v.number(),
      trackRecords: v.number(),
      achievementsUnlocked: v.number(),
      averageLapTime: v.optional(v.number()),
      consistency: v.optional(v.number()),
      winRate: v.optional(v.number()),
      topTenFinishes: v.optional(v.number()),
    }),
    pointsBreakdown: v.object({
      sessionPoints: v.number(),
      personalBestPoints: v.number(),
      trackRecordPoints: v.number(),
      achievementPoints: v.number(),
      bonusPoints: v.number(),
    }),
    streak: v.optional(v.object({
      current: v.number(),
      best: v.number(),
      lastActive: v.number(),
    })),
    lastUpdated: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_rank", ["rank"])
    .index("by_tier", ["tier"])
    .index("by_points", ["points"])
    .index("by_season", ["seasonId"]),

  // User achievements
  achievements: defineTable({
    userId: v.id("users"),
    achievementId: v.string(),
    achievementName: v.string(),
    achievementDescription: v.string(),
    achievementCategory: v.union(
      v.literal('laps'),
      v.literal('tracks'),
      v.literal('consistency'),
      v.literal('improvement'),
      v.literal('social'),
      v.literal('analysis'),
      v.literal('special')
    ),
    achievementIcon: v.string(),
    achievementTier: v.union(
      v.literal('bronze'),
      v.literal('silver'),
      v.literal('gold'),
      v.literal('platinum')
    ),
    pointsAwarded: v.number(),
    unlockedAt: v.number(),
    progress: v.optional(v.object({
      current: v.number(),
      target: v.number(),
    })),
    metadata: v.optional(v.any()),
  }).index("by_user", ["userId"])
    .index("by_achievement", ["achievementId"])
    .index("by_user_achievement", ["userId", "achievementId"])
    .index("by_category", ["achievementCategory"])
    .index("by_unlocked", ["unlockedAt"]),

  // Achievement definitions (master list)
  achievementDefinitions: defineTable({
    achievementId: v.string(),
    name: v.string(),
    description: v.string(),
    category: v.union(
      v.literal('laps'),
      v.literal('tracks'),
      v.literal('consistency'),
      v.literal('improvement'),
      v.literal('social'),
      v.literal('analysis'),
      v.literal('special')
    ),
    icon: v.string(),
    tier: v.union(
      v.literal('bronze'),
      v.literal('silver'),
      v.literal('gold'),
      v.literal('platinum')
    ),
    points: v.number(),
    requirement: v.object({
      type: v.string(),
      target: v.number(),
      conditions: v.optional(v.any()),
    }),
    isSecret: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_achievement_id", ["achievementId"])
    .index("by_category", ["category"])
    .index("by_tier", ["tier"])
    .index("by_active", ["isActive"]),

  // ==========================================
  // SUBSCRIPTION & BILLING TABLES
  // ==========================================

  // Subscriptions - Stripe subscription records
  subscriptions: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.string(),
    stripeCustomerId: v.string(),
    planId: v.union(v.literal('free'), v.literal('premium'), v.literal('pro')),
    priceId: v.string(),
    status: v.union(
      v.literal('active'),
      v.literal('canceled'),
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      v.literal('past_due'),
      v.literal('trialing'),
      v.literal('unpaid')
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_status", ["status"]),

  // Subscription history - track subscription changes
  subscriptionHistory: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    event: v.union(
      v.literal('created'),
      v.literal('updated'),
      v.literal('canceled'),
      v.literal('renewed'),
      v.literal('upgraded'),
      v.literal('downgraded'),
      v.literal('payment_failed'),
      v.literal('payment_succeeded'),
      v.literal('trial_started'),
      v.literal('trial_ended')
    ),
    fromPlan: v.optional(v.union(v.literal('free'), v.literal('premium'), v.literal('pro'))),
    toPlan: v.optional(v.union(v.literal('free'), v.literal('premium'), v.literal('pro'))),
    stripeEventId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_event", ["event"])
    .index("by_created", ["createdAt"]),

  // Invoices - Stripe invoice records for billing history
  invoices: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    stripeInvoiceId: v.string(),
    stripeCustomerId: v.string(),
    amountPaid: v.number(),
    amountDue: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('open'),
      v.literal('paid'),
      v.literal('uncollectible'),
      v.literal('void')
    ),
    hostedInvoiceUrl: v.optional(v.string()),
    invoicePdf: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_stripe_invoice", ["stripeInvoiceId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_status", ["status"]),

  // Usage records - track subscription usage limits
  usageRecords: defineTable({
    userId: v.id("users"),
    billingPeriod: v.string(), // YYYY-MM format
    sessionsRecorded: v.number(),
    sessionsAnalyzed: v.number(),
    storageUsedBytes: v.number(),
    apiCallsCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_period", ["userId", "billingPeriod"])
    .index("by_user", ["userId"]),
});
