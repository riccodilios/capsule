import {
  MONTHLY_CHART_FUTURE_COLUMNS,
  MONTHLY_CHART_MAX_BARS,
  MONTHLY_CHART_MIN_VISIBLE_BARS,
} from "./monthly-chart-constants";

/** Subtract delta months from (y, m); m is 1–12. */
function subMonthsFrom(
  y: number,
  m: number,
  delta: number,
): { y: number; m: number } {
  let mm = m - delta;
  let yy = y;
  while (mm <= 0) {
    mm += 12;
    yy -= 1;
  }
  while (mm > 12) {
    mm -= 12;
    yy += 1;
  }
  return { y: yy, m: mm };
}

function ymParts(ym: string): { y: number; m: number } {
  const [y, mo] = ym.split("-").map((x) => parseInt(x, 10));
  return { y, m: mo };
}

export function ymFromParts(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Canonical `yyyy-MM` so string compares and equality are reliable. */
export function normalizeMonthKeyYm(ym: string): string {
  const { y, m } = ymParts(ym);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return ym;
  }
  return ymFromParts(y, m);
}

/** Move `yyyy-MM` forward by `delta` months (negative = backward). */
export function addCalendarMonthsYm(ym: string, delta: number): string {
  const { y, m } = ymParts(normalizeMonthKeyYm(ym));
  const { y: y2, m: m2 } = subMonthsFrom(y, m, -delta);
  return ymFromParts(y2, m2);
}

/**
 * Month keys for the adherence chart: oldest → newest.
 * Spans from account anchor through at least `current + FUTURE` and through
 * `MIN_VISIBLE_BARS` months from the anchor (so new accounts still get several columns).
 */
export function computeMonthlyChartMonthKeys(
  firstMonthYm: string,
  currentYm: string,
): string[] {
  const first = normalizeMonthKeyYm(firstMonthYm);
  const current = normalizeMonthKeyYm(currentYm);

  let endFromCurrent = current;
  for (let i = 0; i < MONTHLY_CHART_FUTURE_COLUMNS; i++) {
    endFromCurrent = addCalendarMonthsYm(endFromCurrent, 1);
  }

  let endFromMin = first;
  for (let i = 0; i < MONTHLY_CHART_MIN_VISIBLE_BARS - 1; i++) {
    endFromMin = addCalendarMonthsYm(endFromMin, 1);
  }

  const endAt =
    endFromCurrent >= endFromMin ? endFromCurrent : endFromMin;

  const keys: string[] = [];
  let cur = first;
  for (let guard = 0; guard < 240; guard++) {
    keys.push(cur);
    if (cur >= endAt) break;
    const next = addCalendarMonthsYm(cur, 1);
    const nextNorm = normalizeMonthKeyYm(next);
    if (nextNorm === cur) break;
    cur = nextNorm;
  }

  if (keys.length > MONTHLY_CHART_MAX_BARS) {
    return keys.slice(keys.length - MONTHLY_CHART_MAX_BARS);
  }
  return keys;
}

export type EmptyMonthlyBar = {
  monthKey: string;
  onTime: number;
  delayed: number;
  skipped: number;
  chartTotal: number;
};

/** Loading fallback: pivot month from `dayISO` as both anchor and “current” (approximate). */
export function emptyDashboardChartBars(dayISO: string): EmptyMonthlyBar[] {
  const y0 = parseInt(dayISO.slice(0, 4), 10);
  const m0 = parseInt(dayISO.slice(5, 7), 10);
  const ym = ymFromParts(y0, m0);
  return computeMonthlyChartMonthKeys(ym, ym).map((monthKey) => ({
    monthKey,
    onTime: 0,
    delayed: 0,
    skipped: 0,
    chartTotal: 0,
  }));
}

/** Align server rows to the canonical month key list (fills gaps, fixes duplicate-key collapse). */
export function mergeMonthlyHistoryWithKeys(
  keys: string[],
  rows: EmptyMonthlyBar[],
): EmptyMonthlyBar[] {
  const byKey = new Map<string, EmptyMonthlyBar>();
  for (const r of rows) {
    byKey.set(normalizeMonthKeyYm(r.monthKey), r);
  }
  return keys.map((k) => {
    const nk = normalizeMonthKeyYm(k);
    const row = byKey.get(nk);
    if (row) {
      return { ...row, monthKey: nk };
    }
    return {
      monthKey: nk,
      onTime: 0,
      delayed: 0,
      skipped: 0,
      chartTotal: 0,
    };
  });
}
