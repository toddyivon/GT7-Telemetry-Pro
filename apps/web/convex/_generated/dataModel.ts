/* eslint-disable */
/**
 * Generated data model types for Convex
 * This is a stub file - run `npx convex dev` to regenerate with actual types
 */

import { GenericId } from "convex/values";

// Generic ID type - exported for use in API routes
export type Id<TableName extends string> = GenericId<TableName>;

// Document types (stubs)
export type Doc<TableName extends string> = TableName extends "users"
  ? {
      _id: Id<"users">;
      _creationTime: number;
      email: string;
      name: string;
      passwordHash?: string;
      refreshTokenHash?: string;
      avatar?: string;
      role: "user" | "admin" | "premium";
      createdAt: number;
      lastLogin?: number;
      isActive: boolean;
      emailVerified?: boolean;
      failedLoginAttempts?: number;
      lockoutUntil?: number;
      subscription?: {
        plan: "free" | "premium" | "pro";
        status: "active" | "canceled" | "expired";
        expiresAt?: number;
      };
      preferences?: {
        theme: "light" | "dark";
        units: "metric" | "imperial";
        notifications: boolean;
        privacy: {
          shareData: boolean;
          publicProfile: boolean;
        };
      };
      stats?: {
        totalSessions: number;
        totalLaps: number;
        totalDistance: number;
        bestLapTime?: number;
        favoriteTrack?: string;
      };
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    }
  : TableName extends "sessions"
  ? {
      _id: Id<"sessions">;
      _creationTime: number;
      userId: Id<"users">;
      trackName: string;
      carModel: string;
      sessionDate: number;
      sessionType: "practice" | "qualifying" | "race" | "time_trial";
      lapCount: number;
      bestLapTime: number;
      averageLapTime: number;
      totalSessionTime: number;
      weatherConditions: string;
      trackCondition: "dry" | "wet" | "damp";
      tyreFront: string;
      tyreRear: string;
      fuelUsed: number;
      topSpeed: number;
      averageSpeed: number;
      isCompleted: boolean;
      isPublic: boolean;
      tags?: string[];
      notes?: string;
    }
  : Record<string, unknown>;

// Data model interface
export interface DataModel {
  users: {
    document: Doc<"users">;
    fieldPaths: keyof Doc<"users">;
    indexes: {};
    searchIndexes: {};
    vectorIndexes: {};
  };
  sessions: {
    document: Doc<"sessions">;
    fieldPaths: keyof Doc<"sessions">;
    indexes: {};
    searchIndexes: {};
    vectorIndexes: {};
  };
}
