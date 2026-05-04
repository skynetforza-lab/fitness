import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isAfter,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { SCHEDULE_START, isBeforeStart, toISODate } from "@/lib/dates";
import { HABIT_COLORS, HABIT_KEYS } from "@/lib/types";
import type { DailyLog, HabitKey } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  month: Date;
  setMonth: (d: Date) => void;
  logsByDate: Map<string, DailyLog>;
  onSelectDate: (d: Date) => void;
  onToggleHabit: (iso: string, habit: HabitKey, next: boolean) => void;
  today: Date;
}

export default function CalendarView({
  month,
  setMonth,
  logsByDate,
  onSelectDate,
  onToggleHabit,
  today,
}: Props) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [month]);

  const canGoPrev = startOfMonth(addMonths(month, -1)) >= startOfMonth(SCHEDULE_START);

  return (
    <div className="card p-4">
      {/* Month nav */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={!canGoPrev}
          className="btn-ghost p-2 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          className="btn-ghost p-2"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth = isSameMonth(d, month);
          const disabled = isBeforeStart(d) || isAfter(d, today);
          const log = logsByDate.get(iso);
          const isToday = isSameDay(d, today);

          return (
            <div
              key={iso}
              className={cn(
                "relative flex min-h-[60px] flex-col rounded-lg border p-1 text-xs transition",
                inMonth ? "bg-white" : "bg-slate-50 text-slate-400",
                disabled ? "opacity-40" : "",
                isToday && "border-brand-500 ring-2 ring-brand-200",
                !isToday && "border-slate-200",
              )}
            >
              {/* Date number — click opens detail dialog */}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectDate(d)}
                className={cn(
                  "self-end rounded px-0.5 text-[11px] leading-none transition",
                  disabled
                    ? "cursor-not-allowed"
                    : "hover:bg-brand-50 hover:text-brand-700",
                  isToday && "font-semibold text-brand-700",
                )}
                aria-label={`Open ${format(d, "MMMM d")}`}
              >
                {format(d, "d")}
              </button>

              {/* Habit tick rows with labels */}
              {!disabled && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {HABIT_KEYS.map((k) => {
                    const checked = log?.[k] ?? false;
                    const shortLabel =
                      k === "steps_10k"
                        ? "10K Steps"
                        : k === "clean_eating"
                          ? "Clean Eating"
                          : k === "trainer"
                            ? "Trainer"
                            : "Workout";
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleHabit(iso, k, !checked);
                        }}
                        aria-label={`${checked ? "Unmark" : "Mark"} ${shortLabel}`}
                        className="flex items-center gap-1 rounded px-0.5 py-px transition hover:bg-slate-50"
                      >
                        <span
                          className={cn(
                            "block h-2.5 w-2.5 shrink-0 rounded-full border transition",
                            checked
                              ? "border-transparent shadow-sm"
                              : "border-slate-300 bg-white",
                          )}
                          style={checked ? { background: HABIT_COLORS[k] } : undefined}
                        />
                        <span
                          className="truncate text-[9px] leading-none"
                          style={{ color: checked ? HABIT_COLORS[k] : "#94a3b8" }}
                        >
                          {shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
