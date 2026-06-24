/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analysis from "../analysis.js";
import type * as invoices from "../invoices.js";
import type * as laps from "../laps.js";
import type * as leaderboard from "../leaderboard.js";
import type * as migrations from "../migrations.js";
import type * as sessions from "../sessions.js";
import type * as social from "../social.js";
import type * as subscriptions from "../subscriptions.js";
import type * as telemetry from "../telemetry.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analysis: typeof analysis;
  invoices: typeof invoices;
  laps: typeof laps;
  leaderboard: typeof leaderboard;
  migrations: typeof migrations;
  sessions: typeof sessions;
  social: typeof social;
  subscriptions: typeof subscriptions;
  telemetry: typeof telemetry;
  usage: typeof usage;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
