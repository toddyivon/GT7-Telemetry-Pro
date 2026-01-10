// Notifications hook for GT7 Telemetry Pro
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Notification } from '@/types';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => void;
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const queryClient = useQueryClient();
  const convex = useConvex();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        // Try to fetch from Convex
        const result = await convex.query(api.social.getNotifications, {
          userId: userId as any,
          limit: 50
        });
        return result as Notification[];
      } catch {
        // Fallback to mock data if Convex not available
        return getMockNotifications();
      }
    },
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setLocalNotifications(data);
    }
  }, [data]);

  const unreadCount = localNotifications.filter(n => !n.isRead).length;

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        await convex.mutation(api.social.markNotificationRead, {
          notificationId: notificationId as any
        });
      } catch {
        // Update locally if Convex fails
      }
    },
    onMutate: async (notificationId) => {
      setLocalNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await convex.mutation(api.social.markAllNotificationsRead, {
          userId: userId as any
        });
      } catch {
        // Update locally if Convex fails
      }
    },
    onMutate: async () => {
      setLocalNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        await convex.mutation(api.social.deleteNotification, {
          notificationId: notificationId as any
        });
      } catch {
        // Update locally if Convex fails
      }
    },
    onMutate: async (notificationId) => {
      setLocalNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      try {
        await convex.mutation(api.social.clearAllNotifications, {
          userId: userId as any
        });
      } catch {
        // Update locally if Convex fails
      }
    },
    onMutate: async () => {
      setLocalNotifications([]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAsRead = useCallback(async (notificationId: string) => {
    await markAsReadMutation.mutateAsync(notificationId);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationMutation.mutateAsync(notificationId);
  }, [deleteNotificationMutation]);

  const clearAll = useCallback(async () => {
    await clearAllMutation.mutateAsync();
  }, [clearAllMutation]);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    notifications: localNotifications,
    unreadCount,
    isLoading,
    error: error as Error | null,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh,
  };
}

// Mock notifications for development/demo
function getMockNotifications(): Notification[] {
  const now = Date.now();

  return [
    {
      id: 'n1' as any,
      userId: 'user1' as any,
      type: 'achievement',
      content: 'You earned the "Speed Demon" achievement!',
      isRead: false,
      relatedId: 'ach1',
      createdAt: now - 1000 * 60 * 5, // 5 minutes ago
    },
    {
      id: 'n2' as any,
      userId: 'user1' as any,
      type: 'follow',
      content: 'RacingPro42 started following you',
      isRead: false,
      relatedId: 'user2',
      createdAt: now - 1000 * 60 * 30, // 30 minutes ago
    },
    {
      id: 'n3' as any,
      userId: 'user1' as any,
      type: 'like',
      content: 'SpeedKing liked your Nurburgring session',
      isRead: true,
      relatedId: 'session1',
      createdAt: now - 1000 * 60 * 60 * 2, // 2 hours ago
    },
    {
      id: 'n4' as any,
      userId: 'user1' as any,
      type: 'comment',
      content: 'GT7Master commented on your lap: "Great racing line!"',
      isRead: true,
      relatedId: 'session2',
      createdAt: now - 1000 * 60 * 60 * 24, // 1 day ago
    },
    {
      id: 'n5' as any,
      userId: 'user1' as any,
      type: 'system',
      content: 'New feature: Racing line analysis is now available!',
      isRead: true,
      createdAt: now - 1000 * 60 * 60 * 24 * 3, // 3 days ago
    },
  ];
}

// Hook for real-time notifications via WebSocket or polling
export function useRealTimeNotifications(userId?: string) {
  const { notifications, refresh, ...rest } = useNotifications(userId);

  useEffect(() => {
    if (!userId) return;

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      refresh();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refresh]);

  return { notifications, refresh, ...rest };
}
