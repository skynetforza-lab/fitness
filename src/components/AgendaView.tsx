import { useEffect, useMemo, useRef } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isSameDay,
  startOfMonth,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Utensils,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { isBeforeStart, SCHEDULE_START, toISODate } from "@/lib/dates";
import { HABIT_COLORS, HABIT_KEYS } from "@/lib/types";
import type { DailyLog } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  month: Date;
  setMonth: (d: Date) => void;
  logsByDate: Map<string, DailyLog>;
  workoutDates: Set<string>;
  caloriesByDate: Map<string, number>;
  caloriesGoal: number;
  onSelectDate: (d: Date) => void;
  today: Date;
}

function formatPlank(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AgendaView({
  month,
  setMonth,
  logsByDate,
  workoutDates,
  caloriesByDate,
  caloriesGoal,
  onSelectDate,
  today,
}: Props) {
  // Build the list of days for the current month, descending (newest first).
  // Skip days before SCHEDULE_START and after today.
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (isBeforeStart(d)) continue;
      if (isAfter(d, today)) continue;
      out.push(d);
    }
    return out.reverse(); // newest day at top
  }, [month, today]);

  const canGoPrev =
    startOfMonth(addMonths(month, -1)) >= startOfMonth(SCHEDULE_START);
  const canGoNext = !isAfter(startOfMonth(addMonths(month, 1)), today);

  const showJumpToday =
    startOfMonth(month).getTime() !== startOfMonth(today).getTime();

  // Auto-scroll today's row into view on mount / when month changes to today's month
  const todayRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (
      startOfMonth(month).getTime() === startOfMonth(today).getTime() &&
      todayRowRef.current
    ) {
      todayRowRef.current.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, [month, today]);

  return (
    <div className="card overflow-hidden">
      {/* Sticky month header */}
      <div className="sticky top-14 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={!canGoPrev}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold">
          {format(month, "MMMM yyyy")}
        </h2>
        {showJumpToday && (
          <button
            type="button"
            onClick={() => setMonth(today)}
            className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={!canGoNext}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Days list */}
      {days.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-slate-500">
          No days to show this month.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {days.map((d) => {
            const iso = toISODate(d);
            const log = logsByDate.get(iso);
            const isToday = isSameDay(d, today);
            const hasWorkout = workoutDates.has(iso);
            const cals = caloriesByDate.get(iso) ?? 0;
            const plank = log?.plank_seconds ?? 0;

            const hitCount = HABIT_KEYS.filter((k) => log?.[k]).length;
            const hasAnything =
              hitCount > 0 || hasWorkout || cals > 0 || plank > 0;

            return (
              <li
                key={iso}
                ref={isToday ? todayRowRef : undefined}
                className={cn(
                  "transition-colors",
                  isToday && "bg-brand-50/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectDate(d)}
                  className="flex w-full flex-col gap-2 px-3 py-3 text-left active:bg-slate-100"
                >
                  {/* Top row: date + habit dots */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "text-base font-semibold",
                          isToday ? "text-brand-700" : "text-slate-900",
                        )}
                      >
                        {format(d, "EEE")}
                      </span>
                      <span className="text-sm text-slate-500">
                        {format(d, "MMM d")}
                      </span>
                      {isToday && (
                        <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {HABIT_KEYS.map((k) => {
                        const checked = log?.[k] ?? false;
                        return (
                          <span
                            key={k}
                            className={cn(
                              "block h-3 w-3 rounded-full",
                              checked ? "" : "border border-slate-300 bg-white",
                            )}
                            style={
                              checked ? { background: HABIT_COLORS[k] } : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom row: activity summary */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                    {hasWorkout && (
                      <span className="flex items-center gap-1 font-medium text-emerald-700">
                        <Dumbbell className="h-3.5 w-3.5" />
                        Workout
                      </span>
                    )}
                    {cals > 0 && (
                      <span className="flex items-center gap-1 font-medium text-amber-700">
                        <Utensils className="h-3.5 w-3.5" />
                        {Math.round(cals).toLocaleString()}
                        <span className="text-slate-400">
                          /{caloriesGoal.toLocaleString()} kcal
                        </span>
                      </span>
                    )}
                    {plank > 0 && (
                      <span className="flex items-center gap-1 font-medium text-violet-700">
                        <Timer className="h-3.5 w-3.5" />
                        Plank {formatPlank(plank)}
                      </span>
                    )}
                    {!hasAnything && (
                      <span className="italic text-slate-400">
                        Nothing logged
                      </span>
                    )}
                  </div>

                  {/* Today: quick action chips */}
                  {isToday && (
                    <div className="mt-1 flex gap-2">
                      <Link
                        to={`/workout/${iso}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <Dumbbell className="h-3.5 w-3.5" />
                        Log workout
                      </Link>
                      <Link
                        to={`/nutrition/${iso}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        <Utensils className="h-3.5 w-3.5" />
                        Log food
                      </Link>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
