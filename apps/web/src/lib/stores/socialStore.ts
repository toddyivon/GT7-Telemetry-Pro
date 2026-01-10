import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for social features
export interface SocialUser {
  id: string;
  name: string;
  pilotName: string;
  avatar?: string;
  isFollowing?: boolean;
  followersCount: number;
  followingCount: number;
  stats: {
    totalSessions: number;
    bestLapTime: string;
    favoriteTrack: string;
    totalLaps: number;
    totalDistance: number;
    podiums: number;
    wins: number;
  };
  bio?: string;
  joinDate: string;
  isVerified?: boolean;
  badges?: string[];
}

export interface SessionWithSocial {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  trackName: string;
  carModel: string;
  sessionDate: number;
  sessionType: 'practice' | 'qualifying' | 'race' | 'time_trial';
  bestLapTime: number;
  lapCount: number;
  isPublic: boolean;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  tags?: string[];
  notes?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  sessionId: string;
  content: string;
  timestamp: number;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  isLiked: boolean;
  isEdited?: boolean;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'comment' | 'reply' | 'mention' | 'session_shared' | 'achievement' | 'leaderboard_update';
  content: string;
  isRead: boolean;
  timestamp: number;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  relatedId?: string;
  relatedType?: 'user' | 'session' | 'comment' | 'achievement';
  metadata?: {
    sessionId?: string;
    trackName?: string;
    lapTime?: number;
    achievementType?: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  trackName: string;
  carModel?: string;
  bestLapTime: number;
  sessionId: string;
  category: 'overall' | 'weekly' | 'monthly' | 'car_class';
  carClass?: string;
  timestamp: number;
  isVerified: boolean;
  delta?: number; // Time difference from first place
  improvement?: number; // Recent improvement in rank
}

interface SocialState {
  // User relationships
  followers: SocialUser[];
  following: SocialUser[];
  suggestedUsers: SocialUser[];

  // Feed
  feedItems: SessionWithSocial[];
  feedLoading: boolean;
  feedPage: number;
  feedHasMore: boolean;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  notificationsLoading: boolean;

  // Leaderboard
  leaderboardEntries: LeaderboardEntry[];
  leaderboardTrack: string | null;
  leaderboardCategory: 'overall' | 'weekly' | 'monthly' | 'car_class';

  // Current profile view
  viewingProfile: SocialUser | null;
  profileSessions: SessionWithSocial[];

  // Comments cache
  sessionComments: Record<string, Comment[]>;

  // Actions - Follow
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  setFollowers: (followers: SocialUser[]) => void;
  setFollowing: (following: SocialUser[]) => void;
  setSuggestedUsers: (users: SocialUser[]) => void;

  // Actions - Feed
  loadFeed: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  setFeedItems: (items: SessionWithSocial[]) => void;
  addFeedItems: (items: SessionWithSocial[]) => void;

  // Actions - Likes
  likeSession: (sessionId: string) => Promise<void>;
  unlikeSession: (sessionId: string) => Promise<void>;

  // Actions - Comments
  loadComments: (sessionId: string) => Promise<void>;
  addComment: (sessionId: string, content: string, parentId?: string) => Promise<void>;
  deleteComment: (sessionId: string, commentId: string) => Promise<void>;
  editComment: (sessionId: string, commentId: string, content: string) => Promise<void>;
  likeComment: (sessionId: string, commentId: string) => Promise<void>;
  setSessionComments: (sessionId: string, comments: Comment[]) => void;

  // Actions - Notifications
  loadNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;

  // Actions - Profile
  loadProfile: (userId: string) => Promise<void>;
  loadProfileSessions: (userId: string) => Promise<void>;
  setViewingProfile: (profile: SocialUser | null) => void;
  setProfileSessions: (sessions: SessionWithSocial[]) => void;

  // Actions - Leaderboard
  loadLeaderboard: (trackName: string, category?: 'overall' | 'weekly' | 'monthly' | 'car_class') => Promise<void>;
  setLeaderboardEntries: (entries: LeaderboardEntry[]) => void;
  setLeaderboardTrack: (track: string | null) => void;
  setLeaderboardCategory: (category: 'overall' | 'weekly' | 'monthly' | 'car_class') => void;

  // Actions - Share
  shareSession: (sessionId: string, platform: string, message?: string) => Promise<void>;

  // Utility
  reset: () => void;
}

const initialState = {
  followers: [],
  following: [],
  suggestedUsers: [],
  feedItems: [],
  feedLoading: false,
  feedPage: 0,
  feedHasMore: true,
  notifications: [],
  unreadNotificationCount: 0,
  notificationsLoading: false,
  leaderboardEntries: [],
  leaderboardTrack: null,
  leaderboardCategory: 'overall' as const,
  viewingProfile: null,
  profileSessions: [],
  sessionComments: {},
};

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Follow Actions
      followUser: async (userId: string) => {
        // Optimistic update
        set((state) => ({
          suggestedUsers: state.suggestedUsers.map((u) =>
            u.id === userId ? { ...u, isFollowing: true, followersCount: u.followersCount + 1 } : u
          ),
          viewingProfile:
            state.viewingProfile?.id === userId
              ? { ...state.viewingProfile, isFollowing: true, followersCount: state.viewingProfile.followersCount + 1 }
              : state.viewingProfile,
        }));

        try {
          // API call would go here
          // await api.followUser(userId);
        } catch (error) {
          // Rollback on error
          set((state) => ({
            suggestedUsers: state.suggestedUsers.map((u) =>
              u.id === userId ? { ...u, isFollowing: false, followersCount: u.followersCount - 1 } : u
            ),
            viewingProfile:
              state.viewingProfile?.id === userId
                ? { ...state.viewingProfile, isFollowing: false, followersCount: state.viewingProfile.followersCount - 1 }
                : state.viewingProfile,
          }));
          throw error;
        }
      },

      unfollowUser: async (userId: string) => {
        set((state) => ({
          following: state.following.filter((u) => u.id !== userId),
          suggestedUsers: state.suggestedUsers.map((u) =>
            u.id === userId ? { ...u, isFollowing: false, followersCount: u.followersCount - 1 } : u
          ),
          viewingProfile:
            state.viewingProfile?.id === userId
              ? { ...state.viewingProfile, isFollowing: false, followersCount: state.viewingProfile.followersCount - 1 }
              : state.viewingProfile,
        }));

        try {
          // API call would go here
          // await api.unfollowUser(userId);
        } catch (error) {
          // Rollback would go here
          throw error;
        }
      },

      setFollowers: (followers) => set({ followers }),
      setFollowing: (following) => set({ following }),
      setSuggestedUsers: (suggestedUsers) => set({ suggestedUsers }),

      // Feed Actions
      loadFeed: async () => {
        set({ feedLoading: true, feedPage: 0 });
        try {
          // API call would go here
          // const items = await api.getFeed(0);
          // set({ feedItems: items, feedLoading: false, feedHasMore: items.length === 20 });
          set({ feedLoading: false });
        } catch (error) {
          set({ feedLoading: false });
          throw error;
        }
      },

      loadMoreFeed: async () => {
        const { feedPage, feedHasMore, feedLoading } = get();
        if (!feedHasMore || feedLoading) return;

        set({ feedLoading: true });
        try {
          // API call would go here
          // const items = await api.getFeed(feedPage + 1);
          // set((state) => ({
          //   feedItems: [...state.feedItems, ...items],
          //   feedPage: feedPage + 1,
          //   feedLoading: false,
          //   feedHasMore: items.length === 20,
          // }));
          set({ feedLoading: false });
        } catch (error) {
          set({ feedLoading: false });
          throw error;
        }
      },

      refreshFeed: async () => {
        await get().loadFeed();
      },

      setFeedItems: (feedItems) => set({ feedItems }),
      addFeedItems: (items) =>
        set((state) => ({ feedItems: [...state.feedItems, ...items] })),

      // Like Actions
      likeSession: async (sessionId: string) => {
        set((state) => ({
          feedItems: state.feedItems.map((item) =>
            item.id === sessionId
              ? { ...item, isLiked: true, likeCount: item.likeCount + 1 }
              : item
          ),
          profileSessions: state.profileSessions.map((item) =>
            item.id === sessionId
              ? { ...item, isLiked: true, likeCount: item.likeCount + 1 }
              : item
          ),
        }));

        try {
          // API call would go here
          // await api.likeSession(sessionId);
        } catch (error) {
          // Rollback on error
          set((state) => ({
            feedItems: state.feedItems.map((item) =>
              item.id === sessionId
                ? { ...item, isLiked: false, likeCount: item.likeCount - 1 }
                : item
            ),
            profileSessions: state.profileSessions.map((item) =>
              item.id === sessionId
                ? { ...item, isLiked: false, likeCount: item.likeCount - 1 }
                : item
            ),
          }));
          throw error;
        }
      },

      unlikeSession: async (sessionId: string) => {
        set((state) => ({
          feedItems: state.feedItems.map((item) =>
            item.id === sessionId
              ? { ...item, isLiked: false, likeCount: item.likeCount - 1 }
              : item
          ),
          profileSessions: state.profileSessions.map((item) =>
            item.id === sessionId
              ? { ...item, isLiked: false, likeCount: item.likeCount - 1 }
              : item
          ),
        }));

        try {
          // API call would go here
          // await api.unlikeSession(sessionId);
        } catch (error) {
          throw error;
        }
      },

      // Comment Actions
      loadComments: async (sessionId: string) => {
        try {
          // API call would go here
          // const comments = await api.getComments(sessionId);
          // set((state) => ({
          //   sessionComments: { ...state.sessionComments, [sessionId]: comments },
          // }));
        } catch (error) {
          throw error;
        }
      },

      addComment: async (sessionId: string, content: string, parentId?: string) => {
        try {
          // API call would go here
          // const newComment = await api.addComment(sessionId, content, parentId);
          // set((state) => ({
          //   sessionComments: {
          //     ...state.sessionComments,
          //     [sessionId]: [...(state.sessionComments[sessionId] || []), newComment],
          //   },
          //   feedItems: state.feedItems.map((item) =>
          //     item.id === sessionId
          //       ? { ...item, commentCount: item.commentCount + 1 }
          //       : item
          //   ),
          // }));
        } catch (error) {
          throw error;
        }
      },

      deleteComment: async (sessionId: string, commentId: string) => {
        try {
          // API call would go here
          // await api.deleteComment(commentId);
          set((state) => ({
            sessionComments: {
              ...state.sessionComments,
              [sessionId]: (state.sessionComments[sessionId] || []).filter(
                (c) => c.id !== commentId
              ),
            },
            feedItems: state.feedItems.map((item) =>
              item.id === sessionId
                ? { ...item, commentCount: Math.max(0, item.commentCount - 1) }
                : item
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      editComment: async (sessionId: string, commentId: string, content: string) => {
        try {
          // API call would go here
          // await api.editComment(commentId, content);
          set((state) => ({
            sessionComments: {
              ...state.sessionComments,
              [sessionId]: (state.sessionComments[sessionId] || []).map((c) =>
                c.id === commentId ? { ...c, content, isEdited: true } : c
              ),
            },
          }));
        } catch (error) {
          throw error;
        }
      },

      likeComment: async (sessionId: string, commentId: string) => {
        set((state) => ({
          sessionComments: {
            ...state.sessionComments,
            [sessionId]: (state.sessionComments[sessionId] || []).map((c) =>
              c.id === commentId
                ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
                : c
            ),
          },
        }));

        try {
          // API call would go here
          // await api.toggleCommentLike(commentId);
        } catch (error) {
          throw error;
        }
      },

      setSessionComments: (sessionId, comments) =>
        set((state) => ({
          sessionComments: { ...state.sessionComments, [sessionId]: comments },
        })),

      // Notification Actions
      loadNotifications: async () => {
        set({ notificationsLoading: true });
        try {
          // API call would go here
          // const notifications = await api.getNotifications();
          // const unreadCount = notifications.filter(n => !n.isRead).length;
          // set({ notifications, unreadNotificationCount: unreadCount, notificationsLoading: false });
          set({ notificationsLoading: false });
        } catch (error) {
          set({ notificationsLoading: false });
          throw error;
        }
      },

      markNotificationRead: async (notificationId: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1),
        }));

        try {
          // API call would go here
          // await api.markNotificationRead(notificationId);
        } catch (error) {
          throw error;
        }
      },

      markAllNotificationsRead: async () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadNotificationCount: 0,
        }));

        try {
          // API call would go here
          // await api.markAllNotificationsRead();
        } catch (error) {
          throw error;
        }
      },

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadNotificationCount: unreadCount });
      },

      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationCount: notification.isRead
            ? state.unreadNotificationCount
            : state.unreadNotificationCount + 1,
        })),

      // Profile Actions
      loadProfile: async (userId: string) => {
        try {
          // API call would go here
          // const profile = await api.getProfile(userId);
          // set({ viewingProfile: profile });
        } catch (error) {
          throw error;
        }
      },

      loadProfileSessions: async (userId: string) => {
        try {
          // API call would go here
          // const sessions = await api.getUserSessions(userId);
          // set({ profileSessions: sessions });
        } catch (error) {
          throw error;
        }
      },

      setViewingProfile: (viewingProfile) => set({ viewingProfile }),
      setProfileSessions: (profileSessions) => set({ profileSessions }),

      // Leaderboard Actions
      loadLeaderboard: async (trackName: string, category = 'overall' as const) => {
        try {
          // API call would go here
          // const entries = await api.getLeaderboard(trackName, category);
          // set({ leaderboardEntries: entries, leaderboardTrack: trackName, leaderboardCategory: category });
          set({ leaderboardTrack: trackName, leaderboardCategory: category });
        } catch (error) {
          throw error;
        }
      },

      setLeaderboardEntries: (leaderboardEntries) => set({ leaderboardEntries }),
      setLeaderboardTrack: (leaderboardTrack) => set({ leaderboardTrack }),
      setLeaderboardCategory: (leaderboardCategory) => set({ leaderboardCategory }),

      // Share Actions
      shareSession: async (sessionId: string, platform: string, message?: string) => {
        try {
          // API call would go here
          // await api.shareSession(sessionId, platform, message);

          // Update share count optimistically
          set((state) => ({
            feedItems: state.feedItems.map((item) =>
              item.id === sessionId
                ? { ...item, shareCount: item.shareCount + 1 }
                : item
            ),
            profileSessions: state.profileSessions.map((item) =>
              item.id === sessionId
                ? { ...item, shareCount: item.shareCount + 1 }
                : item
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'gt7-social-storage',
      partialize: (state) => ({
        // Only persist essential data
        unreadNotificationCount: state.unreadNotificationCount,
      }),
    }
  )
);

// Helper functions for formatting
export const formatLapTime = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const formatSessionType = (type: string): string => {
  const types: Record<string, string> = {
    practice: 'Practice',
    qualifying: 'Qualifying',
    race: 'Race',
    time_trial: 'Time Trial',
  };
  return types[type] || type;
};
