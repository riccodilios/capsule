/** Empty month columns after the real calendar month (from `now`). */
/** @see `convex/lib/monthlyChartWindow.ts` — Convex must use the same numbers (bundled separately). */
export const MONTHLY_CHART_FUTURE_COLUMNS = 2;

/** Cap when many months have passed since account creation (trailing window). */
export const MONTHLY_CHART_MAX_BARS = 12;

/** Always show at least this many month columns (anchor month + placeholders ahead). */
export const MONTHLY_CHART_MIN_VISIBLE_BARS = 6;

/** Upper bound for layout hints. */
export const MONTHLY_CHART_BAR_COUNT = MONTHLY_CHART_MAX_BARS;
