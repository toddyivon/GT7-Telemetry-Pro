import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Dashboard filter and state types
export interface DashboardFilters {
  trackFilter: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sessionTypeFilter: 'all' | 'practice' | 'qualifying' | 'race' | 'time_trial';
  carFilter: string | null;
}

export interface SessionSummary {
  _id: string;
  trackName: string;
  carModel: string;
  sessionType: string;
  sessionDate: number;
  bestLapTime: number;
  lapCount: number;
  trackCondition: string;
}

export interface DashboardStats {
  totalSessions: number;
  totalLaps: number;
  totalDistance: number;
  averageLapTime: number;
  bestLapTime: number;
  favoriteTrack: string;
  favoriteTrackCount: number;
  recentImprovement: number;
  consistencyScore: number;
  tracksVisited: number;
  carsUsed: number;
}

export interface LapTimeProgress {
  date: string;
  bestLapTime: number;
  averageLapTime: number;
  trackName: string;
}

export interface TrackDistribution {
  trackName: string;
  count: number;
  percentage: number;
}

export interface ActivityData {
  date: string;
  count: number;
  laps: number;
}

export interface DashboardState {
  // Filter state
  filters: DashboardFilters;

  // Pagination state
  currentPage: number;
  pageSize: number;
  sortBy: 'sessionDate' | 'bestLapTime' | 'lapCount' | 'trackName';
  sortDirection: 'asc' | 'desc';

  // UI state
  isLoading: boolean;
  error: string | null;
  selectedSessionId: string | null;

  // Dashboard view preferences
  dashboardLayout: 'grid' | 'list';
  chartTimeRange: '7d' | '30d' | '90d' | 'all';

  // Cached derived data
  trackDistribution: TrackDistribution[];
  lapTimeProgress: LapTimeProgress[];
  activityData: ActivityData[];

  // Actions
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: DashboardState['sortBy'], direction?: 'asc' | 'desc') => void;
  setSelectedSession: (sessionId: string | null) => void;
  setDashboardLayout: (layout: 'grid' | 'list') => void;
  setChartTimeRange: (range: '7d' | '30d' | '90d' | 'all') => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed data setters
  setTrackDistribution: (data: TrackDistribution[]) => void;
  setLapTimeProgress: (data: LapTimeProgress[]) => void;
  setActivityData: (data: ActivityData[]) => void;
}

const defaultFilters: DashboardFilters = {
  trackFilter: null,
  dateRange: {
    start: null,
    end: null,
  },
  sessionTypeFilter: 'all',
  carFilter: null,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      filters: defaultFilters,
      currentPage: 0,
      pageSize: 10,
      sortBy: 'sessionDate',
      sortDirection: 'desc',
      isLoading: false,
      error: null,
      selectedSessionId: null,
      dashboardLayout: 'grid',
      chartTimeRange: '30d',
      trackDistribution: [],
      lapTimeProgress: [],
      activityData: [],

      // Actions
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 0, // Reset to first page when filters change
        })),

      resetFilters: () =>
        set({
          filters: defaultFilters,
          currentPage: 0,
        }),

      setPage: (page) =>
        set({ currentPage: page }),

      setPageSize: (size) =>
        set({
          pageSize: size,
          currentPage: 0, // Reset to first page when page size changes
        }),

      setSorting: (sortBy, direction) =>
        set((state) => ({
          sortBy,
          sortDirection: direction ?? (state.sortBy === sortBy && state.sortDirection === 'desc' ? 'asc' : 'desc'),
          currentPage: 0, // Reset to first page when sorting changes
        })),

      setSelectedSession: (sessionId) =>
        set({ selectedSessionId: sessionId }),

      setDashboardLayout: (layout) =>
        set({ dashboardLayout: layout }),

      setChartTimeRange: (range) =>
        set({ chartTimeRange: range }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      setTrackDistribution: (data) =>
        set({ trackDistribution: data }),

      setLapTimeProgress: (data) =>
        set({ lapTimeProgress: data }),

      setActivityData: (data) =>
        set({ activityData: data }),
    }),
    {
      name: 'gt7-dashboard-storage',
      partialize: (state) => ({
        filters: state.filters,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        dashboardLayout: state.dashboardLayout,
        chartTimeRange: state.chartTimeRange,
      }),
    }
  )
);

// Utility functions for data processing
export function calculateDashboardStats(sessions: SessionSummary[]): DashboardStats {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      totalLaps: 0,
      totalDistance: 0,
      averageLapTime: 0,
      bestLapTime: 0,
      favoriteTrack: 'N/A',
      favoriteTrackCount: 0,
      recentImprovement: 0,
      consistencyScore: 0,
      tracksVisited: 0,
      carsUsed: 0,
    };
  }

  const totalSessions = sessions.length;
  const totalLaps = sessions.reduce((sum, s) => sum + (s.lapCount || 0), 0);

  // Estimate distance based on average track length (4km) * laps
  const totalDistance = totalLaps * 4;

  // Filter valid lap times
  const validLapTimes = sessions
    .map(s => s.bestLapTime)
    .filter(t => t && t > 0);

  const averageLapTime = validLapTimes.length > 0
    ? validLapTimes.reduce((sum, t) => sum + t, 0) / validLapTimes.length
    : 0;

  const bestLapTime = validLapTimes.length > 0
    ? Math.min(...validLapTimes)
    : 0;

  // Find favorite track
  const trackCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.trackName) {
      trackCounts[s.trackName] = (trackCounts[s.trackName] || 0) + 1;
    }
  });

  const favoriteTrackEntry = Object.entries(trackCounts)
    .sort(([, a], [, b]) => b - a)[0];

  const favoriteTrack = favoriteTrackEntry?.[0] || 'N/A';
  const favoriteTrackCount = favoriteTrackEntry?.[1] || 0;

  // Calculate recent improvement (compare last 5 vs previous 5 sessions)
  const sortedByDate = [...sessions].sort((a, b) => b.sessionDate - a.sessionDate);
  const recent = sortedByDate.slice(0, 5);
  const previous = sortedByDate.slice(5, 10);

  const recentAvg = recent.length > 0
    ? recent.reduce((sum, s) => sum + (s.bestLapTime || 0), 0) / recent.length
    : 0;
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, s) => sum + (s.bestLapTime || 0), 0) / previous.length
    : 0;

  const recentImprovement = previousAvg > 0
    ? ((previousAvg - recentAvg) / previousAvg) * 100
    : 0;

  // Calculate consistency score (lower is better - based on lap time variance)
  const consistencyScore = validLapTimes.length > 1
    ? calculateConsistencyScore(validLapTimes)
    : 100;

  // Count unique tracks and cars
  const tracksVisited = new Set(sessions.map(s => s.trackName).filter(Boolean)).size;
  const carsUsed = new Set(sessions.map(s => s.carModel).filter(Boolean)).size;

  return {
    totalSessions,
    totalLaps,
    totalDistance,
    averageLapTime,
    bestLapTime,
    favoriteTrack,
    favoriteTrackCount,
    recentImprovement,
    consistencyScore,
    tracksVisited,
    carsUsed,
  };
}

function calculateConsistencyScore(lapTimes: number[]): number {
  if (lapTimes.length < 2) return 100;

  const mean = lapTimes.reduce((sum, t) => sum + t, 0) / lapTimes.length;
  const variance = lapTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / lapTimes.length;
  const stdDev = Math.sqrt(variance);

  // Convert to a 0-100 score (lower variance = higher score)
  // Coefficient of variation as percentage
  const cv = (stdDev / mean) * 100;

  // Invert and cap at 100
  return Math.max(0, Math.min(100, 100 - cv));
}

export function calculateTrackDistribution(sessions: SessionSummary[]): TrackDistribution[] {
  if (!sessions || sessions.length === 0) return [];

  const trackCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.trackName) {
      trackCounts[s.trackName] = (trackCounts[s.trackName] || 0) + 1;
    }
  });

  const total = sessions.length;

  return Object.entries(trackCounts)
    .map(([trackName, count]) => ({
      trackName,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

export function calculateLapTimeProgress(sessions: SessionSummary[]): LapTimeProgress[] {
  if (!sessions || sessions.length === 0) return [];

  // Sort by date ascending
  const sorted = [...sessions]
    .filter(s => s.bestLapTime && s.bestLapTime > 0)
    .sort((a, b) => a.sessionDate - b.sessionDate);

  return sorted.map(s => ({
    date: new Date(s.sessionDate).toISOString().split('T')[0],
    bestLapTime: s.bestLapTime,
    averageLapTime: s.bestLapTime, // We'd need more data for true average
    trackName: s.trackName,
  }));
}

export function calculateActivityData(sessions: SessionSummary[]): ActivityData[] {
  if (!sessions || sessions.length === 0) return [];

  const activityByDate: Record<string, { count: number; laps: number }> = {};

  sessions.forEach(s => {
    const dateKey = new Date(s.sessionDate).toISOString().split('T')[0];
    if (!activityByDate[dateKey]) {
      activityByDate[dateKey] = { count: 0, laps: 0 };
    }
    activityByDate[dateKey].count += 1;
    activityByDate[dateKey].laps += s.lapCount || 0;
  });

  return Object.entries(activityByDate)
    .map(([date, data]) => ({
      date,
      count: data.count,
      laps: data.laps,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Time range filter helper
export function getDateRangeForTimeRange(range: '7d' | '30d' | '90d' | 'all'): { start: Date | null; end: Date | null } {
  const now = new Date();
  const end = now;

  switch (range) {
    case '7d':
      return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end };
    case '30d':
      return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end };
    case '90d':
      return { start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), end };
    case 'all':
    default:
      return { start: null, end: null };
  }
}
