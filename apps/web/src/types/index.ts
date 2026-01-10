// Core type definitions for GT7 Telemetry Pro

import { Id } from '../../convex/_generated/dataModel';

// ===========================================
// USER TYPES
// ===========================================

export type UserRole = 'user' | 'admin' | 'premium';
export type SubscriptionPlan = 'free' | 'premium' | 'pro';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired';

export interface UserProfile {
  id: Id<'users'>;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: number;
  lastLogin?: number;
  isActive: boolean;
  subscription?: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    expiresAt?: number;
  };
  preferences?: UserPreferences;
  stats?: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  notifications: boolean;
  privacy: {
    shareData: boolean;
    publicProfile: boolean;
  };
}

export interface UserStats {
  totalSessions: number;
  totalLaps: number;
  totalDistance: number;
  bestLapTime?: number;
  favoriteTrack?: string;
}

// ===========================================
// SESSION TYPES
// ===========================================

export type SessionType = 'practice' | 'qualifying' | 'race' | 'time_trial';
export type TrackCondition = 'dry' | 'wet' | 'damp';

export interface Session {
  id: Id<'sessions'>;
  userId: Id<'users'>;
  trackName: string;
  carModel: string;
  sessionDate: number;
  sessionType: SessionType;
  lapCount: number;
  bestLapTime: number;
  averageLapTime: number;
  totalSessionTime: number;
  weatherConditions: string;
  trackCondition: TrackCondition;
  tyreFront: string;
  tyreRear: string;
  fuelUsed: number;
  topSpeed: number;
  averageSpeed: number;
  isCompleted: boolean;
  isPublic: boolean;
  tags?: string[];
  notes?: string;
  metadata?: SessionMetadata;
}

export interface SessionMetadata {
  gameVersion: string;
  platform: string;
  recordingDevice: string;
  dataQuality: number;
  packetLoss: number;
}

// ===========================================
// LAP TYPES
// ===========================================

export interface Lap {
  id: Id<'laps'>;
  sessionId: Id<'sessions'>;
  lapNumber: number;
  lapTime: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  topSpeed: number;
  averageSpeed: number;
  fuelRemaining: number;
  tyreFrontLeft: number;
  tyreFrontRight: number;
  tyreRearLeft: number;
  tyreRearRight: number;
  isValid: boolean;
  position: number;
  penalties?: string[];
  weather?: string;
  trackPosition?: {
    sector: number;
    progress: number;
  };
}

// ===========================================
// TELEMETRY TYPES
// ===========================================

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface TireData {
  frontLeft: number;
  frontRight: number;
  rearLeft: number;
  rearRight: number;
}

export interface TelemetryPoint {
  id: Id<'telemetryPoints'>;
  sessionId: Id<'sessions'>;
  lapNumber: number;
  timestamp: number;
  gameTimestamp: number;
  position: Vector3D;
  velocity: Vector3D;
  rotation: Rotation3D;
  speed: number;
  engineRPM: number;
  gear: number;
  throttle: number;
  brake: number;
  clutch: number;
  steering?: number;
  fuel: number;
  tyrePressures: TireData;
  tyreTemperatures: TireData;
  tyreWear: TireData;
  engineTemperature: number;
  oilTemperature: number;
  waterTemperature: number;
  flags?: string[];
  isOnTrack: boolean;
  isInPits: boolean;
}

// ===========================================
// ANALYSIS TYPES
// ===========================================

export type AnalysisType =
  | 'racing_line'
  | 'tire_performance'
  | 'lap_comparison'
  | 'sector_analysis'
  | 'fuel_strategy'
  | 'brake_analysis'
  | 'corner_analysis';

export interface AnalysisResult {
  id: Id<'analysisResults'>;
  sessionId: Id<'sessions'>;
  analysisType: AnalysisType;
  result: unknown;
  createdAt: number;
  parameters?: {
    algorithm: string;
    version: string;
    settings: unknown;
  };
  confidence?: number;
  recommendations?: string[];
}

export interface RacingLinePoint {
  x: number;
  y: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  lapProgress: number;
}

export interface CornerAnalysis {
  cornerNumber: number;
  entrySpeed: number;
  apexSpeed: number;
  exitSpeed: number;
  brakingPoint: number;
  turnInPoint: number;
  apexPoint: number;
  exitPoint: number;
  rating: 'excellent' | 'good' | 'average' | 'poor';
  timeLost: number;
  suggestions: string[];
}

// ===========================================
// SOCIAL TYPES
// ===========================================

export interface Follow {
  id: Id<'follows'>;
  followerId: Id<'users'>;
  followingId: Id<'users'>;
  createdAt: number;
}

export interface Like {
  id: Id<'likes'>;
  userId: Id<'users'>;
  sessionId: Id<'sessions'>;
  createdAt: number;
}

export interface Comment {
  id: Id<'comments'>;
  userId: Id<'users'>;
  sessionId: Id<'sessions'>;
  content: string;
  createdAt: number;
  parentId?: Id<'comments'>;
}

export interface Notification {
  id: Id<'notifications'>;
  userId: Id<'users'>;
  type: 'follow' | 'like' | 'comment' | 'achievement' | 'system';
  content: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: number;
}

// ===========================================
// LEADERBOARD TYPES
// ===========================================

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface LeaderboardEntry {
  rank: number;
  userId: Id<'users'>;
  userName: string;
  userAvatar?: string;
  lapTime: number;
  carModel: string;
  sessionDate: number;
  tier: RankTier;
  points: number;
}

export interface UserRanking {
  userId: Id<'users'>;
  globalRank: number;
  totalPoints: number;
  tier: RankTier;
  trackRecords: number;
  personalBests: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===========================================
// FORM TYPES
// ===========================================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SessionFilterOptions {
  trackName?: string;
  carModel?: string;
  sessionType?: SessionType;
  dateFrom?: number;
  dateTo?: number;
  isPublic?: boolean;
}
