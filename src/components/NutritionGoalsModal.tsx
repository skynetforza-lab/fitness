import { useState } from "react";
import { X, Save } from "lucide-react";
import type { NutritionGoals } from "@/lib/types";
import { upsertNutritionGoals } from "@/lib/db";

interface Props {
  current: NutritionGoals;
  onClose: () => void;
  onSaved: (goals: NutritionGoals) => void;
}

export default function NutritionGoalsModal({ current, onClose, onSaved }: Props) {
  const [calories, setCalories] = useState(current.calories);
  const [protein, setProtein] = useState(current.protein);
  const [carbs, setCarbs] = useState(current.carbs);
  const [fat, setFat] = useState(current.fat);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await upsertNutritionGoals({
        calories_goal: calories,
        protein_goal: protein,
        carbs_goal: carbs,
        fat_goal: fat,
      });
      onSaved({ calories, protein, carbs, fat });
    } catch {
      setError("Failed to save goals. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Daily Goals</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: "Calories", unit: "kcal", value: calories, set: setCalories, color: "text-brand-600" },
            { label: "Protein", unit: "g", value: protein, set: setProtein, color: "text-emerald-600" },
            { label: "Carbs", unit: "g", value: carbs, set: setCarbs, color: "text-amber-600" },
            { label: "Fat", unit: "g", value: fat, set: setFat, color: "text-violet-600" },
          ].map(({ label, unit, value, set, color }) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <label className={`w-20 text-sm font-medium ${color}`}>{label}</label>
              <div className="flex flex-1 items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99999}
                  value={value}
                  onChange={(e) => set(Math.max(1, Number(e.target.value)))}
                  className="input text-right text-base"
                />
                <span className="shrink-0 text-sm text-slate-500">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-5 w-full"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save goals"}
        </button>
      </div>
    </div>
  );
}
