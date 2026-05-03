import { TARGET_DAYS_2026 } from "@/lib/dates";
import { summarise } from "@/lib/habitStats";
import { HABIT_COLORS, HABIT_KEYS, HABIT_LABELS } from "@/lib/types";
import type { DailyLog } from "@/lib/types";

interface Props {
  logs: DailyLog[];
  today: Date;
}

export default function HabitSummaryCards({ logs, today }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {HABIT_KEYS.map((habit) => {
        const s = summarise(logs, habit, today);
        const pct = Math.min(100, Math.round((s.hitCumulative / TARGET_DAYS_2026) * 100));
        const color = HABIT_COLORS[habit];
        return (
          <div key={habit} className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: color }}
              />
              <h3 className="font-semibold">{HABIT_LABELS[habit]}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <Stat label="This week" value={s.hitWeek} />
              <Stat label="This month" value={s.hitMonth} />
              <Stat label="Total" value={s.hitCumulative} />
              <Stat label="Missed" value={s.missed} muted />
            </div>
            <div className="mt-3">
              <div className="mb-1 flex items-baseline justify-between text-xs text-slate-500">
                <span>2026 target</span>
                <span>
                  {s.hitCumulative} / {s.target} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div>
      <div
        className={
          "text-xl font-semibold " + (muted ? "text-slate-500" : "text-slate-900")
        }
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}
