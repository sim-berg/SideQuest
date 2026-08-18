/**
 * Day keys are the unit streaks are counted in.
 *
 * They are plain 'YYYY-MM-DD' strings in the *user's* local day, not UTC
 * instants: a cigarette avoided at 23:50 belongs to that evening, and a run at
 * 00:10 belongs to the new day. Comparing strings is enough because the format
 * sorts lexicographically.
 */
export function toDayKey(date: Date, tzOffsetMinutes = 0): string {
  const shifted = new Date(date.getTime() - tzOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/** The day key before the given one. */
export function previousDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Whole days between two day keys (b - a). Negative when b precedes a. */
export function daysBetween(a: string, b: string): number {
  const ms =
    new Date(`${b}T00:00:00.000Z`).getTime() -
    new Date(`${a}T00:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000);
}

/** True for Saturday and Sunday. */
export function isWeekend(dayKey: string): boolean {
  const day = new Date(`${dayKey}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}
