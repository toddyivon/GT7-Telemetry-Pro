import { internalMutation } from "./_generated/server";

export const clearAllLaps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("laps").collect();
    for (const item of items) await ctx.db.delete(item._id);
    return { deleted: items.length };
  },
});

export const clearAllSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("sessions").collect();
    for (const item of items) await ctx.db.delete(item._id);
    return { deleted: items.length };
  },
});

export const clearTelemetry = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("telemetryPoints").collect();
    for (const item of items) await ctx.db.delete(item._id);
    return { deleted: items.length };
  },
});

export const clearAllUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("users").collect();
    for (const item of items) await ctx.db.delete(item._id);
    return { deleted: items.length };
  },
});

// Nuclear option: clear all tables with potentially stale data
export const clearAllOldData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const results: Record<string, number> = {};
    const tables = [
      "users", "sessions", "laps", "telemetryPoints", "analysisResults",
      "activityLogs", "settings", "follows", "likes", "comments",
      "notifications", "commentLikes", "shares", "leaderboardEntries",
      "leaderboards", "rankings", "achievements", "achievementDefinitions",
      "subscriptions", "subscriptionHistory", "invoices", "usageRecords",
    ] as const;
    for (const table of tables) {
      const items = await ctx.db.query(table).collect();
      for (const item of items) await ctx.db.delete(item._id);
      results[table] = items.length;
    }
    return results;
  },
});
