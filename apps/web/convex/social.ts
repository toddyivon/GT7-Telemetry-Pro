import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ===========================================
// FOLLOW SYSTEM
// ===========================================

// Follow a user
export const followUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Cannot follow yourself
    if (args.followerId === args.followingId) {
      throw new Error("You cannot follow yourself");
    }

    // Verify both users exist
    const follower = await ctx.db.get(args.followerId);
    const following = await ctx.db.get(args.followingId);

    if (!follower || !following) {
      throw new Error("User not found");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId))
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    const followId = await ctx.db.insert("follows", {
      followerId: args.followerId,
      followingId: args.followingId,
      timestamp: Date.now(),
    });

    // Create notification for the followed user
    await ctx.db.insert("notifications", {
      userId: args.followingId,
      type: "follow",
      content: `${follower.name} started following you`,
      isRead: false,
      actorId: args.followerId,
      relatedId: args.followerId,
      relatedType: "user",
      timestamp: Date.now(),
    });

    return followId;
  },
});

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId))
      .first();

    if (!existingFollow) {
      throw new Error("Not following this user");
    }

    await ctx.db.delete(existingFollow._id);
    return { success: true };
  },
});

// Get followers of a user
export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .take(limit + 1);

    const hasMore = follows.length > limit;
    const results = follows.slice(0, limit);

    // Enrich with user data
    const followers = await Promise.all(
      results.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        return {
          followId: follow._id,
          followedAt: follow.timestamp,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            stats: user.stats,
          } : null,
        };
      })
    );

    return {
      followers: followers.filter(f => f.user !== null),
      hasMore,
      count: results.length,
    };
  },
});

// Get users that a user is following
export const getFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .take(limit + 1);

    const hasMore = follows.length > limit;
    const results = follows.slice(0, limit);

    // Enrich with user data
    const following = await Promise.all(
      results.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return {
          followId: follow._id,
          followedAt: follow.timestamp,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            stats: user.stats,
          } : null,
        };
      })
    );

    return {
      following: following.filter(f => f.user !== null),
      hasMore,
      count: results.length,
    };
  },
});

// Check if user is following another user
export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) =>
        q.eq("followerId", args.followerId).eq("followingId", args.followingId))
      .first();

    return !!follow;
  },
});

// Get follow counts for a user
export const getFollowCounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return {
      followers: followers.length,
      following: following.length,
    };
  },
});

// ===========================================
// USER FEED
// ===========================================

// Get user feed (sessions from followed users)
export const getUserFeed = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    includeOwnSessions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get users this user is following
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const followingIds = follows.map(f => f.followingId);

    // Include own sessions if requested
    if (args.includeOwnSessions) {
      followingIds.push(args.userId);
    }

    if (followingIds.length === 0) {
      return { sessions: [], hasMore: false };
    }

    // Get public sessions from followed users
    const allSessions = await ctx.db
      .query("sessions")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit * 3);

    // Filter to only sessions from followed users
    const feedSessions = allSessions
      .filter(s => followingIds.includes(s.userId))
      .slice(0, limit);

    // Enrich with user data and engagement metrics
    const enrichedSessions = await Promise.all(
      feedSessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);

        // Get like count
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        // Check if current user liked this session
        const userLike = likes.find(l => l.userId === args.userId);

        // Get comment count
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
          .collect();

        return {
          ...session,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
          engagement: {
            likeCount: likes.length,
            commentCount: comments.length,
            isLiked: !!userLike,
          },
        };
      })
    );

    return {
      sessions: enrichedSessions,
      hasMore: feedSessions.length === limit,
    };
  },
});

// ===========================================
// LIKES SYSTEM
// ===========================================

// Like a session
export const likeSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    // Verify user and session exist
    const user = await ctx.db.get(args.userId);
    const session = await ctx.db.get(args.sessionId);

    if (!user) {
      throw new Error("User not found");
    }
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", args.userId).eq("sessionId", args.sessionId))
      .first();

    if (existingLike) {
      // Unlike - remove the like
      await ctx.db.delete(existingLike._id);
      return { liked: false };
    }

    // Create like
    await ctx.db.insert("likes", {
      userId: args.userId,
      sessionId: args.sessionId,
      timestamp: Date.now(),
    });

    // Create notification for session owner (if not liking own session)
    if (session.userId !== args.userId) {
      await ctx.db.insert("notifications", {
        userId: session.userId,
        type: "like",
        content: `${user.name} liked your session`,
        isRead: false,
        actorId: args.userId,
        relatedId: args.sessionId,
        relatedType: "session",
        timestamp: Date.now(),
        metadata: {
          sessionId: args.sessionId,
          trackName: session.trackName,
        },
      });
    }

    return { liked: true };
  },
});

// Get likes for a session
export const getSessionLikes = query({
  args: {
    sessionId: v.id("sessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(limit);

    // Enrich with user data
    const enrichedLikes = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        return {
          ...like,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
        };
      })
    );

    return enrichedLikes;
  },
});

// Check if user liked a session
export const hasLikedSession = query({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_session", (q) =>
        q.eq("userId", args.userId).eq("sessionId", args.sessionId))
      .first();

    return !!like;
  },
});

// ===========================================
// COMMENTS SYSTEM
// ===========================================

// Comment on a session
export const commentOnSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    // Validate content
    if (!args.content.trim()) {
      throw new Error("Comment cannot be empty");
    }

    if (args.content.length > 2000) {
      throw new Error("Comment is too long (max 2000 characters)");
    }

    // Verify user and session exist
    const user = await ctx.db.get(args.userId);
    const session = await ctx.db.get(args.sessionId);

    if (!user) {
      throw new Error("User not found");
    }
    if (!session) {
      throw new Error("Session not found");
    }

    // If this is a reply, verify parent comment exists
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }
    }

    // Create comment
    const commentId = await ctx.db.insert("comments", {
      userId: args.userId,
      sessionId: args.sessionId,
      content: args.content.trim(),
      timestamp: Date.now(),
      parentId: args.parentId,
      isEdited: false,
      isDeleted: false,
      likeCount: 0,
    });

    // Create notification
    const notificationType = args.parentId ? "reply" : "comment";
    let notifyUserId = session.userId;

    // If it's a reply, notify the parent comment author instead
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (parentComment) {
        notifyUserId = parentComment.userId;
      }
    }

    // Don't notify if commenting on own session/comment
    if (notifyUserId !== args.userId) {
      await ctx.db.insert("notifications", {
        userId: notifyUserId,
        type: notificationType,
        content: args.parentId
          ? `${user.name} replied to your comment`
          : `${user.name} commented on your session`,
        isRead: false,
        actorId: args.userId,
        relatedId: args.sessionId,
        relatedType: "comment",
        timestamp: Date.now(),
        metadata: {
          sessionId: args.sessionId,
          commentId: commentId,
          trackName: session.trackName,
        },
      });
    }

    return commentId;
  },
});

// Get comments for a session
export const getSessionComments = query({
  args: {
    sessionId: v.id("sessions"),
    limit: v.optional(v.number()),
    includeReplies: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    // Get top-level comments (no parent)
    let comments = await ctx.db
      .query("comments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();

    // Filter to only top-level comments if not including replies directly
    const topLevelComments = comments.filter(c => !c.parentId && !c.isDeleted);

    // Enrich with user data and replies
    const enrichedComments = await Promise.all(
      topLevelComments.slice(0, limit).map(async (comment) => {
        const user = await ctx.db.get(comment.userId);

        // Get replies if requested
        let replies: any[] = [];
        if (args.includeReplies) {
          const commentReplies = await ctx.db
            .query("comments")
            .withIndex("by_parent", (q) => q.eq("parentId", comment._id))
            .order("asc")
            .collect();

          replies = await Promise.all(
            commentReplies
              .filter(r => !r.isDeleted)
              .map(async (reply) => {
                const replyUser = await ctx.db.get(reply.userId);
                return {
                  ...reply,
                  user: replyUser ? {
                    _id: replyUser._id,
                    name: replyUser.name,
                    avatar: replyUser.avatar,
                  } : null,
                };
              })
          );
        }

        return {
          ...comment,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          } : null,
          replies,
          replyCount: replies.length,
        };
      })
    );

    return {
      comments: enrichedComments,
      totalCount: topLevelComments.length,
    };
  },
});

// Edit a comment
export const editComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.userId !== args.userId) {
      throw new Error("Not authorized to edit this comment");
    }

    if (!args.content.trim()) {
      throw new Error("Comment cannot be empty");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content.trim(),
      isEdited: true,
      editedAt: Date.now(),
    });

    return await ctx.db.get(args.commentId);
  },
});

// Delete a comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.userId !== args.userId) {
      throw new Error("Not authorized to delete this comment");
    }

    // Soft delete - mark as deleted but keep for referential integrity
    await ctx.db.patch(args.commentId, {
      isDeleted: true,
      content: "[This comment has been deleted]",
    });

    return { success: true };
  },
});

// Like a comment
export const likeComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const comment = await ctx.db.get(args.commentId);

    if (!user) {
      throw new Error("User not found");
    }
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if already liked
    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_user_comment", (q) =>
        q.eq("userId", args.userId).eq("commentId", args.commentId))
      .first();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
      return { liked: false };
    }

    // Create like
    await ctx.db.insert("commentLikes", {
      userId: args.userId,
      commentId: args.commentId,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.commentId, {
      likeCount: (comment.likeCount || 0) + 1,
    });

    return { liked: true };
  },
});

// ===========================================
// NOTIFICATIONS
// ===========================================

// Get user notifications
export const getNotifications = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let notifications;

    if (args.unreadOnly) {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_read", (q) =>
          q.eq("userId", args.userId).eq("isRead", false))
        .order("desc")
        .take(limit);
    } else {
      notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(limit);
    }

    // Enrich with actor data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let actor = null;
        if (notification.actorId) {
          const actorUser = await ctx.db.get(notification.actorId);
          if (actorUser) {
            actor = {
              _id: actorUser._id,
              name: actorUser.name,
              avatar: actorUser.avatar,
            };
          }
        }

        return {
          ...notification,
          actor,
        };
      })
    );

    return enrichedNotifications;
  },
});

// Mark notification as read
export const markNotificationRead = mutation({
  args: {
    notificationId: v.id("notifications"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== args.userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });

    return { success: true };
  },
});

// Mark all notifications as read
export const markAllNotificationsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }

    return { success: true, count: unreadNotifications.length };
  },
});

// Get unread notification count
export const getUnreadNotificationCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", args.userId).eq("isRead", false))
      .collect();

    return unreadNotifications.length;
  },
});

// ===========================================
// SHARES
// ===========================================

// Share a session
export const shareSession = mutation({
  args: {
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
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const session = await ctx.db.get(args.sessionId);

    if (!user) {
      throw new Error("User not found");
    }
    if (!session) {
      throw new Error("Session not found");
    }

    const shareId = await ctx.db.insert("shares", {
      userId: args.userId,
      sessionId: args.sessionId,
      platform: args.platform,
      timestamp: Date.now(),
      message: args.message,
    });

    // Notify session owner if internal share
    if (args.platform === "internal" && session.userId !== args.userId) {
      await ctx.db.insert("notifications", {
        userId: session.userId,
        type: "session_shared",
        content: `${user.name} shared your session`,
        isRead: false,
        actorId: args.userId,
        relatedId: args.sessionId,
        relatedType: "session",
        timestamp: Date.now(),
        metadata: {
          sessionId: args.sessionId,
          trackName: session.trackName,
        },
      });
    }

    return shareId;
  },
});

// Get share count for a session
export const getSessionShareCount = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("shares")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return shares.length;
  },
});

// ===========================================
// SOCIAL PROFILE
// ===========================================

// Get social profile for a user
export const getSocialProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get follow counts
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    // Get public sessions count
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const publicSessions = sessions.filter(s => s.isPublic);

    // Get total likes received
    let totalLikes = 0;
    for (const session of publicSessions) {
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      totalLikes += likes.length;
    }

    return {
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        stats: user.stats,
      },
      social: {
        followersCount: followers.length,
        followingCount: following.length,
        publicSessionsCount: publicSessions.length,
        totalLikesReceived: totalLikes,
      },
      recentSessions: publicSessions.slice(0, 5).map(s => ({
        _id: s._id,
        trackName: s.trackName,
        carModel: s.carModel,
        bestLapTime: s.bestLapTime,
        sessionDate: s.sessionDate,
      })),
    };
  },
});

// Get session engagement metrics
export const getSessionEngagement = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return null;
    }

    const likes = await ctx.db
      .query("likes")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    const shares = await ctx.db
      .query("shares")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return {
      likeCount: likes.length,
      commentCount: comments.filter(c => !c.isDeleted).length,
      shareCount: shares.length,
      recentLikers: await Promise.all(
        likes.slice(0, 5).map(async (like) => {
          const user = await ctx.db.get(like.userId);
          return user ? { _id: user._id, name: user.name, avatar: user.avatar } : null;
        })
      ),
    };
  },
});
