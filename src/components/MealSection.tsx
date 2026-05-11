import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { FoodLog } from "@/lib/types";
import FoodLogRow from "./FoodLogRow";
import FoodSearchModal from "./FoodSearchModal";

interface Props {
  mealType: FoodLog["meal_type"];
  label: string;
  emoji: string;
  items: FoodLog[];
  date: string;
  onRefresh: () => void;
}

export default function MealSection({
  mealType,
  label,
  emoji,
  items,
  date,
  onRefresh,
}: Props) {
  const [open, setOpen] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const mealCalories = Math.round(
    items.reduce((sum, l) => sum + l.calories, 0),
  );

  return (
    <div className="card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-lg p-2 text-left hover:bg-slate-50 active:bg-slate-100"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-xl leading-none">{emoji}</span>
          <span className="font-semibold text-slate-800">{label}</span>
          {mealCalories > 0 && (
            <span className="text-sm text-slate-500 tabular-nums">
              {mealCalories} kcal
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 active:bg-brand-200"
        >
          <Plus className="h-4 w-4" />
          Add food
        </button>
      </div>

      {/* Food entries */}
      {open && (
        <div className="px-4">
          {items.length === 0 ? (
            <p className="pb-3 text-sm text-slate-400 italic">Nothing logged yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((log) => (
                <FoodLogRow key={log.id} log={log} onDeleted={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search modal */}
      {showSearch && (
        <FoodSearchModal
          mealType={mealType}
          date={date}
          onAdded={onRefresh}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
