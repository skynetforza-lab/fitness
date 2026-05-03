import { format, parseISO } from "date-fns";

// Schedule starts May 4, 2026.
export const SCHEDULE_START = new Date(2026, 4, 4); // month is 0-indexed (April=3, May=4)
export const SCHEDULE_END_2026 = new Date(2026, 11, 31);

// 242 days inclusive: May 4 → Dec 31, 2026.
export const TARGET_DAYS_2026 = 242;

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function fromISODate(s: string): Date {
  return parseISO(s);
}

export function isBeforeStart(d: Date): boolean {
  return d.getTime() < SCHEDULE_START.getTime();
}
