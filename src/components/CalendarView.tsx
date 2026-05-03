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
import type { DailyLog } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  month: Date;
  setMonth: (d: Date) => void;
  logsByDate: Map<string, DailyLog>;
  onSelectDate: (d: Date) => void;
  today: Date;
}

export default function CalendarView({
  month,
  setMonth,
  logsByDate,
  onSelectDate,
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

      <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth = isSameMonth(d, month);
          const disabled = isBeforeStart(d) || isAfter(d, today);
          const log = logsByDate.get(iso);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(d)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-start rounded-lg border p-1 text-xs transition",
                inMonth ? "bg-white" : "bg-slate-50 text-slate-400",
                disabled
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-brand-400 hover:bg-brand-50",
                isToday && "border-brand-500 ring-2 ring-brand-200",
                !isToday && "border-slate-200",
              )}
            >
              <span
                className={cn(
                  "self-end text-[11px]",
                  isToday && "font-semibold text-brand-700",
                )}
              >
                {format(d, "d")}
              </span>
              {log && (
                <div className="mt-auto flex flex-wrap justify-center gap-0.5">
                  {HABIT_KEYS.map((k) =>
                    log[k] ? (
                      <span
                        key={k}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: HABIT_COLORS[k] }}
                        title={k}
                      />
                    ) : null,
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {HABIT_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: HABIT_COLORS[k] }}
            />
            <span className="capitalize">
              {k === "steps_10k"
                ? "10K steps"
                : k === "clean_eating"
                  ? "Clean eating"
                  : k}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
