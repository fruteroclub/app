/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as applications from "../applications.js";
import type * as auth from "../auth.js";
import type * as bootcamp from "../bootcamp.js";
import type * as bounties from "../bounties.js";
import type * as cleanup from "../cleanup.js";
import type * as clubApp from "../clubApp.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as invitations from "../invitations.js";
import type * as leaderboard from "../leaderboard.js";
import type * as luma_sync from "../luma/sync.js";
import type * as luma_syncAction from "../luma/syncAction.js";
import type * as profiles from "../profiles.js";
import type * as programs from "../programs.js";
import type * as projects from "../projects.js";
import type * as sessions from "../sessions.js";
import type * as skills from "../skills.js";
import type * as studio from "../studio.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  applications: typeof applications;
  auth: typeof auth;
  bootcamp: typeof bootcamp;
  bounties: typeof bounties;
  cleanup: typeof cleanup;
  clubApp: typeof clubApp;
  crons: typeof crons;
  events: typeof events;
  invitations: typeof invitations;
  leaderboard: typeof leaderboard;
  "luma/sync": typeof luma_sync;
  "luma/syncAction": typeof luma_syncAction;
  profiles: typeof profiles;
  programs: typeof programs;
  projects: typeof projects;
  sessions: typeof sessions;
  skills: typeof skills;
  studio: typeof studio;
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
