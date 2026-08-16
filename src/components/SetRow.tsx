import { useEffect, useState } from "react";
import { Check, Loader2, Trash2, TrendingDown, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ExerciseSet } from "@/lib/types";

interface Props {
  set: ExerciseSet;
  isPR: boolean;
  onDelete: () => void;
  onUpdate: (patch: { weightKg?: number; reps?: number }) => Promise<void>;
  onToggleDone: () => void;
}

export default function SetRow({
  set,
  isPR,
  onDelete,
  onUpdate,
  onToggleDone,
}: Props) {
  const [weight, setWeight] = useState(String(set.weight_kg));
  const [reps, setReps] = useState(String(set.reps));
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  // Keep local state in sync if parent prop updates (e.g. after schedule load)
  useEffect(() => setWeight(String(set.weight_kg)), [set.weight_kg]);
  useEffect(() => setReps(String(set.reps)), [set.reps]);

  async function commitWeight() {
    const n = parseFloat(weight);
    if (Number.isNaN(n) || n < 0 || n === set.weight_kg) {
      setWeight(String(set.weight_kg));
      return;
    }
    setSaving(true);
    try {
      await onUpdate({ weightKg: n });
      flashSaved();
    } finally {
      setSaving(false);
    }
  }

  async function commitReps() {
    const n = parseInt(reps, 10);
    if (Number.isNaN(n) || n < 0 || n === set.reps) {
      setReps(String(set.reps));
      return;
    }
    setSaving(true);
    try {
      await onUpdate({ reps: n });
      flashSaved();
    } finally {
      setSaving(false);
    }
  }

  function flashSaved() {
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1200);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
        set.is_done
          ? "border-emerald-200 bg-emerald-50/60"
          : set.is_drop_set
            ? "border-orange-200 bg-orange-50/60"
            : "border-slate-200 bg-white",
      )}
    >
      {/* Done tick — starts the rest timer */}
      <button
        type="button"
        onClick={onToggleDone}
        aria-label={set.is_done ? "Mark set not done" : "Mark set done"}
        aria-pressed={set.is_done}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
          set.is_done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 bg-white text-transparent hover:border-emerald-400 hover:text-emerald-300",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </button>

      <span className="w-7 shrink-0 text-slate-500">
        {set.is_drop_set ? (
          <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
        ) : (
          `#${set.set_number}`
        )}
      </span>

      {/* Weight input */}
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commitWeight}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-16 rounded border border-slate-200 bg-white px-2 py-1 text-right font-medium tabular-nums focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
      />
      <span className="text-xs text-slate-500">kg</span>

      <span className="text-slate-300">×</span>

      {/* Reps input */}
      <input
        type="number"
        inputMode="numeric"
        step="1"
        min="0"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commitReps}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-12 rounded border border-slate-200 bg-white px-2 py-1 text-right font-medium tabular-nums focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-200"
      />
      <span className="text-xs text-slate-500">reps</span>

      {/* Saving / saved indicator */}
      <div className="ml-auto flex items-center gap-2">
        {set.is_drop_set && (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
            Drop
          </span>
        )}
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {savedTick && !saving && (
          <span className="text-xs text-emerald-600">✓ Saved</span>
        )}
        {isPR && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            <Trophy className="h-3 w-3" /> PR!
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
          aria-label="Delete set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
