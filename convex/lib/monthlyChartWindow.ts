/**
 * Monthly adherence chart range (Convex bundle).
 * Keep numeric knobs in sync with `lib/monthly-chart-constants.ts`.
 */
const FUTURE_COLUMNS = 2;
const MAX_BARS = 12;
const MIN_VISIBLE_BARS = 6;

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

function ymFromParts(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function normalizeMonthKeyYm(ym: string): string {
  const { y, m } = ymParts(ym);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return ym;
  }
  return ymFromParts(y, m);
}

export function addCalendarMonthsYm(ym: string, delta: number): string {
  const { y, m } = ymParts(normalizeMonthKeyYm(ym));
  const { y: y2, m: m2 } = subMonthsFrom(y, m, -delta);
  return ymFromParts(y2, m2);
}

export function computeMonthlyChartMonthKeys(
  firstMonthYm: string,
  currentYm: string,
): string[] {
  const first = normalizeMonthKeyYm(firstMonthYm);
  const current = normalizeMonthKeyYm(currentYm);

  let endFromCurrent = current;
  for (let i = 0; i < FUTURE_COLUMNS; i++) {
    endFromCurrent = addCalendarMonthsYm(endFromCurrent, 1);
  }

  let endFromMin = first;
  for (let i = 0; i < MIN_VISIBLE_BARS - 1; i++) {
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

  if (keys.length > MAX_BARS) {
    return keys.slice(keys.length - MAX_BARS);
  }
  return keys;
}
