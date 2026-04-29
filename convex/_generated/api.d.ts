/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adherence from "../adherence.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as lib_chartAnchor from "../lib/chartAnchor.js";
import type * as lib_monthlyAggregation from "../lib/monthlyAggregation.js";
import type * as lib_monthlyChartWindow from "../lib/monthlyChartWindow.js";
import type * as lib_pastDosesConfirm from "../lib/pastDosesConfirm.js";
import type * as lib_schedule from "../lib/schedule.js";
import type * as lib_status from "../lib/status.js";
import type * as lib_time from "../lib/time.js";
import type * as medications from "../medications.js";
import type * as onboarding from "../onboarding.js";
import type * as push from "../push.js";
import type * as pushSend from "../pushSend.js";
import type * as userSettings from "../userSettings.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adherence: typeof adherence;
  crons: typeof crons;
  dashboard: typeof dashboard;
  "lib/chartAnchor": typeof lib_chartAnchor;
  "lib/monthlyAggregation": typeof lib_monthlyAggregation;
  "lib/monthlyChartWindow": typeof lib_monthlyChartWindow;
  "lib/pastDosesConfirm": typeof lib_pastDosesConfirm;
  "lib/schedule": typeof lib_schedule;
  "lib/status": typeof lib_status;
  "lib/time": typeof lib_time;
  medications: typeof medications;
  onboarding: typeof onboarding;
  push: typeof push;
  pushSend: typeof pushSend;
  userSettings: typeof userSettings;
  validators: typeof validators;
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
