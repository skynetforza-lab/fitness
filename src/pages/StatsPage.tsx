import { useEffect, useMemo, useState } from "react";
import HabitPieChart from "@/components/HabitPieChart";
import HabitSummaryCards from "@/components/HabitSummaryCards";
import ExerciseProgressChart from "@/components/ExerciseProgressChart";
import { fetchAllDailyLogs } from "@/lib/db";
import { defaultRange, rangeStats } from "@/lib/habitStats";
import { HABIT_KEYS } from "@/lib/types";
import type { DailyLog } from "@/lib/types";

export default function StatsPage() {
  const today = useMemo(() => new Date(), []);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [range, setRange] = useState(() => defaultRange(today));

  useEffect(() => {
    fetchAllDailyLogs().then(setLogs);
  }, []);

  const stats = useMemo(
    () => rangeStats(logs, HABIT_KEYS, range.fromISO, range.toISO),
    [logs, range],
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-4">
      <div className="card p-4">
        <h1 className="text-xl font-semibold">Stats & progress</h1>
        <p className="text-sm text-slate-600">
          Tracking starts 5 May 2026. Cumulative and target counts ignore days
          before that.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Habit summary
        </h2>
        <HabitSummaryCards logs={logs} today={today} />
      </section>

      <section>
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Habit consistency
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <label>From</label>
            <input
              type="date"
              className="input w-auto py-1"
              value={range.fromISO}
              onChange={(e) =>
                setRange((r) => ({ ...r, fromISO: e.target.value }))
              }
            />
            <label>To</label>
            <input
              type="date"
              className="input w-auto py-1"
              value={range.toISO}
              onChange={(e) =>
                setRange((r) => ({ ...r, toISO: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <HabitPieChart
              key={s.habit}
              habit={s.habit}
              hit={s.hit}
              total={s.total}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Strength progression
        </h2>
        <ExerciseProgressChart />
      </section>
    </div>
  );
}
