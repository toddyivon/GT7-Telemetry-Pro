/* eslint-disable */
/**
 * Generated server types for Convex
 * This is a stub file - run `npx convex dev` to regenerate with actual types
 */

import {
  mutation as baseMutation,
  query as baseQuery,
  internalMutation as baseInternalMutation,
  internalQuery as baseInternalQuery,
  action as baseAction,
  internalAction as baseInternalAction,
  MutationCtx,
  QueryCtx,
  ActionCtx,
} from "convex/server";
import type { DataModel } from "./dataModel";

// Re-export all types with our DataModel
export const mutation = baseMutation as typeof baseMutation;
export const query = baseQuery as typeof baseQuery;
export const internalMutation = baseInternalMutation as typeof baseInternalMutation;
export const internalQuery = baseInternalQuery as typeof baseInternalQuery;
export const action = baseAction as typeof baseAction;
export const internalAction = baseInternalAction as typeof baseInternalAction;

// Export context types
export type { MutationCtx, QueryCtx, ActionCtx };

// Re-export everything else from convex/server
export * from "convex/server";
