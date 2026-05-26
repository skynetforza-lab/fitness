import { useEffect, useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { TrendingDown, TrendingUp, Check } from "lucide-react";
import { fetchFoodLogsInRange, fetchMyProfile } from "@/lib/db";
import { DEFAULT_GOALS } from "@/lib/types";
import type { FoodLog, NutritionGoals } from "@/lib/types";

type Period = "3d" | "7d" | "this_week" | "last_week";

const PERIODS: { key: Period; label: string }[] = [
  { key: "3d", label: "Last 3 days" },
  { key: "7d", label: "Last 7 days" },
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
];

function getRange(period: Period, today: Date): { from: Date; to: Date } {
  if (period === "3d") return { from: subDays(today, 2), to: today };
  if (period === "7d") return { from: subDays(today, 6), to: today };
  if (period === "this_week")
    return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
  // last_week
  const lastWeekDay = subDays(today, 7);
  return {
    from: startOfWeek(lastWeekDay, { weekStartsOn: 1 }),
    to: endOfWeek(lastWeekDay, { weekStartsOn: 1 }),
  };
}

interface MacroRowProps {
  label: string;
  actual: number;
  target: number;
  avgPerDay: number;
  goalPerDay: number;
  unit: string;
  color: string;
  barColor: string;
}

function MacroRow({
  label,
  actual,
  target,
  avgPerDay,
  goalPerDay,
  unit,
  color,
  barColor,
}: MacroRowProps) {
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const delta = actual - target;
  const onTrack = Math.abs(delta) <= target * 0.05; // within ±5%
  const over = delta > target * 0.05;
  const under = delta < -target * 0.05;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <span className="text-sm tabular-nums text-slate-600">
          {Math.round(actual).toLocaleString()}{" "}
          <span className="text-slate-400">
            / {Math.round(target).toLocaleString()} {unit}
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full transition-all ${
            over ? "bg-red-500" : under ? "bg-amber-500" : barColor
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Avg{" "}
          <span className="font-medium tabular-nums text-slate-700">
            {Math.round(avgPerDay).toLocaleString()}{unit}
          </span>
          /day · target {goalPerDay}{unit}
        </span>
        <span className="flex items-center gap-1 font-medium">
          {onTrack ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span className="text-emerald-700">On track</span>
            </>
          ) : over ? (
            <>
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-red-600">
                +{Math.round(delta).toLocaleString()}{unit}
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3 text-amber-500" />
              <span className="text-amber-600">
                {Math.round(delta).toLocaleString()}{unit}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export default function NutritionSummary() {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>("7d");
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);

  const { from, to } = useMemo(() => getRange(period, today), [period, today]);
  const fromISO = format(from, "yyyy-MM-dd");
  const toISO = format(to, "yyyy-MM-dd");
  const days = differenceInCalendarDays(to, from) + 1;

  useEffect(() => {
    fetchFoodLogsInRange(fromISO, toISO)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [fromISO, toISO]);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p) {
          setGoals({
            calories: p.calories_goal ?? DEFAULT_GOALS.calories,
            protein: p.protein_goal ?? DEFAULT_GOALS.protein,
            carbs: p.carbs_goal ?? DEFAULT_GOALS.carbs,
            fat: p.fat_goal ?? DEFAULT_GOALS.fat,
          });
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  const totals = logs.reduce(
    (a, l) => ({
      calories: a.calories + l.calories,
      protein: a.protein + l.protein_g,
      carbs: a.carbs + l.carbs_g,
      fat: a.fat + l.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const targets = {
    calories: goals.calories * days,
    protein: goals.protein * days,
    carbs: goals.carbs * days,
    fat: goals.fat * days,
  };

  const avg = {
    calories: totals.calories / days,
    protein: totals.protein / days,
    carbs: totals.carbs / days,
    fat: totals.fat / days,
  };

  const daysLogged = new Set(logs.map((l) => l.date)).size;

  return (
    <div className="card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Nutrition summary
          </h2>
          <p className="text-xs text-slate-500">
            {format(from, "MMM d")} – {format(to, "MMM d")} · {days} day
            {days > 1 ? "s" : ""}
            {daysLogged < days && ` · ${daysLogged} logged`}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="input w-auto py-1.5 text-sm"
        >
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <MacroRow
          label="Calories"
          actual={totals.calories}
          target={targets.calories}
          avgPerDay={avg.calories}
          goalPerDay={goals.calories}
          unit=" kcal"
          color="text-brand-700"
          barColor="bg-brand-500"
        />
        <MacroRow
          label="Protein"
          actual={totals.protein}
          target={targets.protein}
          avgPerDay={avg.protein}
          goalPerDay={goals.protein}
          unit="g"
          color="text-emerald-700"
          barColor="bg-emerald-500"
        />
        <MacroRow
          label="Carbs"
          actual={totals.carbs}
          target={targets.carbs}
          avgPerDay={avg.carbs}
          goalPerDay={goals.carbs}
          unit="g"
          color="text-amber-700"
          barColor="bg-amber-500"
        />
        <MacroRow
          label="Fat"
          actual={totals.fat}
          target={targets.fat}
          avgPerDay={avg.fat}
          goalPerDay={goals.fat}
          unit="g"
          color="text-violet-700"
          barColor="bg-violet-500"
        />
      </div>
    </div>
  );
}
