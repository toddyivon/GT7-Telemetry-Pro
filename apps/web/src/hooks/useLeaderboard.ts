// Leaderboard hook for GT7 Telemetry Pro
'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { LeaderboardEntry, UserRanking, Achievement, RankTier } from '@/types';

interface LeaderboardFilters {
  trackName?: string;
  carClass?: string;
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  userRank: number | null;
  isLoading: boolean;
  error: Error | null;
  filters: LeaderboardFilters;
  setFilters: (filters: LeaderboardFilters) => void;
  refresh: () => void;
}

export function useLeaderboard(
  trackName?: string,
  initialFilters?: LeaderboardFilters
): UseLeaderboardReturn {
  const convex = useConvex();
  const [filters, setFilters] = useState<LeaderboardFilters>(initialFilters || {});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', trackName, filters],
    queryFn: async () => {
      try {
        const result = await convex.query(api.leaderboard.getTrackLeaderboard, {
          trackName: trackName || filters.trackName || 'all',
          carClass: filters.carClass,
          timeRange: filters.timeRange || 'all',
          limit: 100,
        });
        return result as { entries: LeaderboardEntry[]; userRank: number | null };
      } catch {
        return getMockLeaderboard(trackName || 'all');
      }
    },
  });

  const updateFilters = useCallback((newFilters: LeaderboardFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    entries: data?.entries || [],
    userRank: data?.userRank || null,
    isLoading,
    error: error as Error | null,
    filters,
    setFilters: updateFilters,
    refresh: refetch,
  };
}

// Hook for user's global ranking
interface UseUserRankingReturn {
  ranking: UserRanking | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useUserRanking(userId?: string): UseUserRankingReturn {
  const convex = useConvex();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-ranking', userId],
    queryFn: async () => {
      if (!userId) return null;
      try {
        const result = await convex.query(api.leaderboard.getUserRank, {
          userId: userId as any
        });
        return result as UserRanking;
      } catch {
        return getMockUserRanking(userId);
      }
    },
    enabled: !!userId,
  });

  return {
    ranking: data || null,
    isLoading,
    error: error as Error | null,
    refresh: refetch,
  };
}

// Hook for user achievements
interface UseAchievementsReturn {
  achievements: Achievement[];
  unlockedCount: number;
  totalPoints: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useAchievements(userId?: string): UseAchievementsReturn {
  const convex = useConvex();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      if (!userId) return getAllAchievements();
      try {
        const result = await convex.query(api.leaderboard.getAchievements, {
          userId: userId as any
        });
        return result as Achievement[];
      } catch {
        return getMockAchievements(userId);
      }
    },
    enabled: true,
  });

  const achievements = data || [];
  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalPoints = achievements
    .filter(a => a.unlockedAt)
    .reduce((sum, a) => sum + a.points, 0);

  return {
    achievements,
    unlockedCount,
    totalPoints,
    isLoading,
    error: error as Error | null,
    refresh: refetch,
  };
}

// Helper function to get tier from points
export function getTierFromPoints(points: number): RankTier {
  if (points >= 25000) return 'Diamond';
  if (points >= 10000) return 'Platinum';
  if (points >= 5000) return 'Gold';
  if (points >= 1000) return 'Silver';
  return 'Bronze';
}

// Get tier color
export function getTierColor(tier: RankTier): string {
  const colors: Record<RankTier, string> = {
    Bronze: '#CD7F32',
    Silver: '#C0C0C0',
    Gold: '#FFD700',
    Platinum: '#E5E4E2',
    Diamond: '#B9F2FF',
  };
  return colors[tier];
}

// Mock data functions
function getMockLeaderboard(trackName: string): { entries: LeaderboardEntry[]; userRank: number | null } {
  const entries: LeaderboardEntry[] = [
    {
      rank: 1,
      userId: 'u1' as any,
      userName: 'SpeedKing',
      userAvatar: undefined,
      lapTime: 420123,
      carModel: 'Porsche 911 GT3 RS',
      sessionDate: Date.now() - 1000 * 60 * 60 * 24,
      tier: 'Diamond',
      points: 32500,
    },
    {
      rank: 2,
      userId: 'u2' as any,
      userName: 'RacingPro42',
      userAvatar: undefined,
      lapTime: 421456,
      carModel: 'Ferrari 488 GT3',
      sessionDate: Date.now() - 1000 * 60 * 60 * 48,
      tier: 'Platinum',
      points: 18200,
    },
    {
      rank: 3,
      userId: 'u3' as any,
      userName: 'GT7Master',
      userAvatar: undefined,
      lapTime: 422789,
      carModel: 'McLaren 720S GT3',
      sessionDate: Date.now() - 1000 * 60 * 60 * 72,
      tier: 'Platinum',
      points: 15600,
    },
    {
      rank: 4,
      userId: 'u4' as any,
      userName: 'FastLapFred',
      userAvatar: undefined,
      lapTime: 425000,
      carModel: 'BMW M4 GT3',
      sessionDate: Date.now() - 1000 * 60 * 60 * 96,
      tier: 'Gold',
      points: 8900,
    },
    {
      rank: 5,
      userId: 'u5' as any,
      userName: 'TurboTina',
      userAvatar: undefined,
      lapTime: 426234,
      carModel: 'Audi R8 LMS',
      sessionDate: Date.now() - 1000 * 60 * 60 * 120,
      tier: 'Gold',
      points: 7500,
    },
  ];

  // Add more mock entries
  for (let i = 6; i <= 20; i++) {
    entries.push({
      rank: i,
      userId: `u${i}` as any,
      userName: `Racer${i}`,
      userAvatar: undefined,
      lapTime: 420000 + i * 2000 + Math.random() * 1000,
      carModel: ['Porsche 911', 'Ferrari 488', 'McLaren 720S', 'BMW M4'][i % 4],
      sessionDate: Date.now() - 1000 * 60 * 60 * 24 * i,
      tier: getTierFromPoints(10000 - i * 400),
      points: 10000 - i * 400,
    });
  }

  return { entries, userRank: 12 };
}

function getMockUserRanking(userId: string): UserRanking {
  return {
    userId: userId as any,
    globalRank: 156,
    totalPoints: 4520,
    tier: 'Silver',
    trackRecords: 2,
    personalBests: 15,
  };
}

function getAllAchievements(): Achievement[] {
  return [
    {
      id: 'first_lap',
      name: 'First Lap',
      description: 'Complete your first lap',
      icon: 'flag',
      points: 10,
    },
    {
      id: 'lap_100',
      name: 'Century',
      description: 'Complete 100 laps',
      icon: 'medal',
      points: 50,
      progress: 0,
      maxProgress: 100,
    },
    {
      id: 'lap_1000',
      name: 'Thousand Laps',
      description: 'Complete 1000 laps',
      icon: 'trophy',
      points: 200,
      progress: 0,
      maxProgress: 1000,
    },
    {
      id: 'track_master',
      name: 'Track Master',
      description: 'Drive on all available tracks',
      icon: 'map',
      points: 100,
      progress: 0,
      maxProgress: 20,
    },
    {
      id: 'consistent',
      name: 'Consistency King',
      description: 'Complete 10 laps within 1% variance',
      icon: 'timer',
      points: 75,
    },
    {
      id: 'improver',
      name: 'Always Improving',
      description: 'Beat your personal best 10 times',
      icon: 'trending_up',
      points: 50,
      progress: 0,
      maxProgress: 10,
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Get 10 followers',
      icon: 'people',
      points: 30,
      progress: 0,
      maxProgress: 10,
    },
    {
      id: 'analyst',
      name: 'Data Analyst',
      description: 'Complete 100 analysis reports',
      icon: 'analytics',
      points: 100,
      progress: 0,
      maxProgress: 100,
    },
    {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Reach 300 km/h',
      icon: 'speed',
      points: 25,
    },
    {
      id: 'perfect_lap',
      name: 'Perfect Lap',
      description: 'Complete a lap with no penalties',
      icon: 'star',
      points: 20,
    },
    {
      id: 'endurance',
      name: 'Endurance Racer',
      description: 'Complete a 2-hour session',
      icon: 'hourglass',
      points: 150,
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Race between midnight and 5am',
      icon: 'nightlight',
      points: 15,
    },
  ];
}

function getMockAchievements(userId: string): Achievement[] {
  const all = getAllAchievements();

  // Unlock some achievements for demo
  return all.map((achievement, index) => {
    if (index < 4) {
      return {
        ...achievement,
        unlockedAt: Date.now() - 1000 * 60 * 60 * 24 * (index + 1),
        progress: achievement.maxProgress,
      };
    }
    if (achievement.progress !== undefined) {
      return {
        ...achievement,
        progress: Math.floor(Math.random() * (achievement.maxProgress || 1)),
      };
    }
    return achievement;
  });
}
