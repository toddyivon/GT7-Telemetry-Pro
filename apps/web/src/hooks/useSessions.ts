// Sessions hook for GT7 Telemetry Pro
'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Session, Lap, TelemetryPoint, SessionFilterOptions, PaginatedResponse } from '@/types';

interface UseSessionsOptions {
  userId?: string;
  filters?: SessionFilterOptions;
  page?: number;
  pageSize?: number;
}

interface UseSessionsReturn {
  sessions: Session[];
  total: number;
  isLoading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  setPage: (page: number) => void;
  setFilters: (filters: SessionFilterOptions) => void;
  refresh: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
}

export function useSessions(options: UseSessionsOptions = {}): UseSessionsReturn {
  const { userId, filters: initialFilters, page: initialPage = 1, pageSize = 10 } = options;
  const queryClient = useQueryClient();
  const convex = useConvex();

  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<SessionFilterOptions>(initialFilters || {});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sessions', userId, filters, page, pageSize],
    queryFn: async (): Promise<PaginatedResponse<Session>> => {
      try {
        if (userId) {
          const result = await convex.query(api.sessions.getUserSessions, {
            userId: userId as any,
            page,
            pageSize,
            ...filters,
          });
          return result as PaginatedResponse<Session>;
        } else {
          const result = await convex.query(api.sessions.getPublicSessions, {
            page,
            pageSize,
            ...filters,
          });
          return result as PaginatedResponse<Session>;
        }
      } catch {
        // Return mock data if Convex not available
        return getMockSessions(page, pageSize);
      }
    },
    enabled: true,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await convex.mutation(api.sessions.deleteSession, {
        sessionId: sessionId as any
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const deleteSession = useCallback(async (sessionId: string) => {
    await deleteSessionMutation.mutateAsync(sessionId);
  }, [deleteSessionMutation]);

  const updateFilters = useCallback((newFilters: SessionFilterOptions) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  return {
    sessions: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error: error as Error | null,
    page,
    pageSize,
    hasMore: data?.hasMore || false,
    setPage,
    setFilters: updateFilters,
    refresh: refetch,
    deleteSession,
  };
}

// Hook for single session details
interface UseSessionReturn {
  session: Session | null;
  laps: Lap[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSession(sessionId?: string): UseSessionReturn {
  const convex = useConvex();

  const { data: session, isLoading: sessionLoading, error: sessionError, refetch: refetchSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const result = await convex.query(api.sessions.getSessionById, {
          sessionId: sessionId as any
        });
        return result as Session;
      } catch {
        return getMockSession(sessionId);
      }
    },
    enabled: !!sessionId,
  });

  const { data: laps, isLoading: lapsLoading, error: lapsError, refetch: refetchLaps } = useQuery({
    queryKey: ['session-laps', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      try {
        const result = await convex.query(api.laps.getLapsBySession, {
          sessionId: sessionId as any
        });
        return result as Lap[];
      } catch {
        return getMockLaps(sessionId);
      }
    },
    enabled: !!sessionId,
  });

  const refresh = useCallback(() => {
    refetchSession();
    refetchLaps();
  }, [refetchSession, refetchLaps]);

  return {
    session: session || null,
    laps: laps || [],
    isLoading: sessionLoading || lapsLoading,
    error: (sessionError || lapsError) as Error | null,
    refresh,
  };
}

// Hook for session telemetry data
interface UseTelemetryReturn {
  telemetry: TelemetryPoint[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSessionTelemetry(sessionId?: string, lapNumber?: number): UseTelemetryReturn {
  const convex = useConvex();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telemetry', sessionId, lapNumber],
    queryFn: async () => {
      if (!sessionId) return [];
      try {
        if (lapNumber !== undefined) {
          const result = await convex.query(api.telemetry.getTelemetryByLap, {
            sessionId: sessionId as any,
            lapNumber,
          });
          return result as TelemetryPoint[];
        } else {
          const result = await convex.query(api.telemetry.getTelemetryBySession, {
            sessionId: sessionId as any
          });
          return result as TelemetryPoint[];
        }
      } catch {
        return getMockTelemetry(sessionId, lapNumber);
      }
    },
    enabled: !!sessionId,
  });

  return {
    telemetry: data || [],
    isLoading,
    error: error as Error | null,
    refresh: refetch,
  };
}

// Mock data functions
function getMockSessions(page: number, pageSize: number): PaginatedResponse<Session> {
  const mockSessions: Session[] = [
    {
      id: 's1' as any,
      userId: 'u1' as any,
      trackName: 'Nurburgring Nordschleife',
      carModel: 'Porsche 911 GT3 RS',
      sessionDate: Date.now() - 1000 * 60 * 60 * 2,
      sessionType: 'time_trial',
      lapCount: 5,
      bestLapTime: 420000,
      averageLapTime: 435000,
      totalSessionTime: 2175000,
      weatherConditions: 'Clear',
      trackCondition: 'dry',
      tyreFront: 'Racing Hard',
      tyreRear: 'Racing Hard',
      fuelUsed: 15.5,
      topSpeed: 295,
      averageSpeed: 165,
      isCompleted: true,
      isPublic: true,
    },
    {
      id: 's2' as any,
      userId: 'u1' as any,
      trackName: 'Spa-Francorchamps',
      carModel: 'Ferrari 488 GT3',
      sessionDate: Date.now() - 1000 * 60 * 60 * 24,
      sessionType: 'practice',
      lapCount: 8,
      bestLapTime: 140000,
      averageLapTime: 145000,
      totalSessionTime: 1160000,
      weatherConditions: 'Overcast',
      trackCondition: 'dry',
      tyreFront: 'Racing Medium',
      tyreRear: 'Racing Medium',
      fuelUsed: 22.3,
      topSpeed: 310,
      averageSpeed: 180,
      isCompleted: true,
      isPublic: true,
    },
  ];

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = mockSessions.slice(start, end);

  return {
    items,
    total: mockSessions.length,
    page,
    pageSize,
    hasMore: end < mockSessions.length,
  };
}

function getMockSession(sessionId: string): Session {
  return {
    id: sessionId as any,
    userId: 'u1' as any,
    trackName: 'Nurburgring Nordschleife',
    carModel: 'Porsche 911 GT3 RS',
    sessionDate: Date.now() - 1000 * 60 * 60 * 2,
    sessionType: 'time_trial',
    lapCount: 5,
    bestLapTime: 420000,
    averageLapTime: 435000,
    totalSessionTime: 2175000,
    weatherConditions: 'Clear',
    trackCondition: 'dry',
    tyreFront: 'Racing Hard',
    tyreRear: 'Racing Hard',
    fuelUsed: 15.5,
    topSpeed: 295,
    averageSpeed: 165,
    isCompleted: true,
    isPublic: true,
  };
}

function getMockLaps(sessionId: string): Lap[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${sessionId}-lap${i + 1}` as any,
    sessionId: sessionId as any,
    lapNumber: i + 1,
    lapTime: 420000 + Math.random() * 20000,
    sector1Time: 95000 + Math.random() * 5000,
    sector2Time: 180000 + Math.random() * 10000,
    sector3Time: 145000 + Math.random() * 5000,
    topSpeed: 280 + Math.random() * 30,
    averageSpeed: 160 + Math.random() * 20,
    fuelRemaining: 50 - i * 3,
    tyreFrontLeft: 0.1 + i * 0.05,
    tyreFrontRight: 0.12 + i * 0.05,
    tyreRearLeft: 0.15 + i * 0.06,
    tyreRearRight: 0.14 + i * 0.06,
    isValid: true,
    position: 1,
  }));
}

function getMockTelemetry(sessionId: string, lapNumber?: number): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const numPoints = 1000;

  for (let i = 0; i < numPoints; i++) {
    const progress = i / numPoints;
    points.push({
      id: `${sessionId}-t${i}` as any,
      sessionId: sessionId as any,
      lapNumber: lapNumber || 1,
      timestamp: Date.now() - (numPoints - i) * 100,
      gameTimestamp: i * 100,
      position: {
        x: Math.sin(progress * Math.PI * 2) * 1000,
        y: 0,
        z: Math.cos(progress * Math.PI * 2) * 500,
      },
      velocity: {
        x: Math.cos(progress * Math.PI * 2) * 50,
        y: 0,
        z: -Math.sin(progress * Math.PI * 2) * 50,
      },
      rotation: {
        pitch: 0,
        yaw: progress * 360,
        roll: 0,
      },
      speed: 150 + Math.sin(progress * Math.PI * 8) * 100,
      engineRPM: 5000 + Math.sin(progress * Math.PI * 16) * 3000,
      gear: Math.floor(3 + Math.sin(progress * Math.PI * 8) * 2),
      throttle: Math.max(0, Math.sin(progress * Math.PI * 8)),
      brake: Math.max(0, -Math.sin(progress * Math.PI * 8)),
      clutch: 0,
      fuel: 50 - progress * 3,
      tyrePressures: {
        frontLeft: 26 + Math.random() * 2,
        frontRight: 26 + Math.random() * 2,
        rearLeft: 24 + Math.random() * 2,
        rearRight: 24 + Math.random() * 2,
      },
      tyreTemperatures: {
        frontLeft: 85 + Math.random() * 10,
        frontRight: 85 + Math.random() * 10,
        rearLeft: 90 + Math.random() * 10,
        rearRight: 90 + Math.random() * 10,
      },
      tyreWear: {
        frontLeft: 0.1 + progress * 0.05,
        frontRight: 0.1 + progress * 0.05,
        rearLeft: 0.15 + progress * 0.06,
        rearRight: 0.15 + progress * 0.06,
      },
      engineTemperature: 95 + Math.random() * 5,
      oilTemperature: 110 + Math.random() * 10,
      waterTemperature: 85 + Math.random() * 5,
      isOnTrack: true,
      isInPits: false,
    });
  }

  return points;
}
