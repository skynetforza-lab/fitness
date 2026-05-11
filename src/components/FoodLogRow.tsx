import { Trash2 } from "lucide-react";
import type { FoodLog } from "@/lib/types";
import { deleteFoodLog } from "@/lib/db";

interface Props {
  log: FoodLog;
  onDeleted: () => void;
}

export default function FoodLogRow({ log, onDeleted }: Props) {
  async function handleDelete() {
    await deleteFoodLog(log.id);
    onDeleted();
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="break-words text-sm font-medium text-slate-800">
            {log.food_name}
          </span>
          <span className="shrink-0 text-xs text-slate-400">
            {log.quantity}{log.unit}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">
            {Math.round(log.calories)} kcal
          </span>
          <span className="text-emerald-600">P {Math.round(log.protein_g)}g</span>
          <span className="text-amber-600">C {Math.round(log.carbs_g)}g</span>
          <span className="text-violet-600">F {Math.round(log.fat_g)}g</span>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 active:bg-red-100"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
