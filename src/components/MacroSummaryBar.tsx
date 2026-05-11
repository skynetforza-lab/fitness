import type { NutritionGoals } from "@/lib/types";

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  totals: MacroTotals;
  goals: NutritionGoals;
}

interface BarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

function MacroBar({ label, value, goal, unit, color }: BarProps) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100);
  const isOver = value > goal * 1.1;
  const isNear = value > goal * 0.9;
  const fill = isOver ? "bg-red-500" : isNear ? "bg-amber-500" : color;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="tabular-nums text-slate-500">
          {Math.round(value)}{unit}{" "}
          <span className="text-slate-400">/ {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroSummaryBar({ totals, goals }: Props) {
  const kcal = Math.round(totals.calories);
  const remaining = Math.max(goals.calories - kcal, 0);

  return (
    <div className="card space-y-4 p-4">
      <div className="text-center">
        <div className="text-4xl font-bold tabular-nums text-slate-900">
          {kcal.toLocaleString()}
        </div>
        <div className="mt-0.5 text-sm text-slate-500">
          of {goals.calories.toLocaleString()} kcal &middot;{" "}
          <span className="font-medium text-brand-600">
            {remaining.toLocaleString()} remaining
          </span>
        </div>
      </div>
      <div className="space-y-3">
        <MacroBar
          label="Calories"
          value={totals.calories}
          goal={goals.calories}
          unit=" kcal"
          color="bg-brand-500"
        />
        <MacroBar
          label="Protein"
          value={totals.protein}
          goal={goals.protein}
          unit="g"
          color="bg-emerald-500"
        />
        <MacroBar
          label="Carbs"
          value={totals.carbs}
          goal={goals.carbs}
          unit="g"
          color="bg-amber-500"
        />
        <MacroBar
          label="Fat"
          value={totals.fat}
          goal={goals.fat}
          unit="g"
          color="bg-violet-500"
        />
      </div>
    </div>
  );
}
