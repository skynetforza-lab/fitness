import {
  differenceInCalendarDays,
  isAfter,
  isBefore,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { SCHEDULE_START, TARGET_DAYS_2026, toISODate } from "./dates";
import type { DailyLog, HabitKey } from "./types";

export interface HabitSummary {
  hitWeek: number;
  hitMonth: number;
  hitCumulative: number;
  missed: number;
  target: number;
  elapsed: number; // days from May 4 through today (inclusive)
}

function dateInRange(d: Date, from: Date, to: Date): boolean {
  return !isBefore(d, from) && !isAfter(d, to);
}

export function summarise(
  logs: DailyLog[],
  habit: HabitKey,
  today: Date = new Date(),
): HabitSummary {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(today);

  // Days elapsed since May 4, capped at 0 for pre-start dates.
  const rawElapsed = differenceInCalendarDays(today, SCHEDULE_START) + 1;
  const elapsed = Math.max(0, rawElapsed);

  let hitWeek = 0;
  let hitMonth = 0;
  let hitCumulative = 0;

  for (const log of logs) {
    if (!log[habit]) continue;
    const d = new Date(log.date + "T00:00:00");
    if (isBefore(d, SCHEDULE_START) || isAfter(d, today)) continue;
    hitCumulative++;
    if (dateInRange(d, monthStart, today)) hitMonth++;
    if (dateInRange(d, weekStart, today)) hitWeek++;
  }

  return {
    hitWeek,
    hitMonth,
    hitCumulative,
    missed: Math.max(0, elapsed - hitCumulative),
    target: TARGET_DAYS_2026,
    elapsed,
  };
}

// Range "% days hit" over the last N days, clipped to schedule start.
export interface HabitRangeStat {
  habit: HabitKey;
  hit: number;
  total: number;
}

export function rangeStats(
  logs: DailyLog[],
  habits: HabitKey[],
  fromISO: string,
  toISO: string,
): HabitRangeStat[] {
  const from = new Date(fromISO + "T00:00:00");
  const to = new Date(toISO + "T00:00:00");
  const scheduleFrom = isBefore(from, SCHEDULE_START) ? SCHEDULE_START : from;
  const totalDays =
    Math.max(0, differenceInCalendarDays(to, scheduleFrom)) + 1;

  const hitMap = new Map<HabitKey, number>(habits.map((h) => [h, 0]));
  for (const log of logs) {
    const d = new Date(log.date + "T00:00:00");
    if (isBefore(d, scheduleFrom) || isAfter(d, to)) continue;
    for (const h of habits) if (log[h]) hitMap.set(h, (hitMap.get(h) ?? 0) + 1);
  }

  return habits.map((habit) => ({
    habit,
    hit: hitMap.get(habit) ?? 0,
    total: totalDays,
  }));
}

export function defaultRange(today: Date = new Date()): {
  fromISO: string;
  toISO: string;
} {
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  return { fromISO: toISODate(from), toISO: toISODate(today) };
}
