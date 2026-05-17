import { format, parseISO } from "date-fns";

// Schedule starts May 18, 2026.
export const SCHEDULE_START = new Date(2026, 4, 18); // month is 0-indexed (May = 4)
export const SCHEDULE_END_2026 = new Date(2026, 11, 31);

// 228 days: May 18 → Dec 31, 2026 inclusive
// (14 + 30 + 31 + 31 + 30 + 31 + 30 + 31)
export const TARGET_DAYS_2026 = 228;

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function fromISODate(s: string): Date {
  return parseISO(s);
}

export function isBeforeStart(d: Date): boolean {
  return d.getTime() < SCHEDULE_START.getTime();
}
