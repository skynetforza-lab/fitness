import { Trash2, Trophy } from "lucide-react";
import type { ExerciseSet } from "@/lib/types";

interface Props {
  set: ExerciseSet;
  isPR: boolean;
  onDelete: () => void;
}

export default function SetRow({ set, isPR, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="w-8 text-slate-500">#{set.set_number}</span>
      <span className="font-medium">{set.weight_kg} kg</span>
      <span className="text-slate-500">×</span>
      <span className="font-medium">{set.reps} reps</span>
      {isPR && (
        <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
          <Trophy className="h-3 w-3" /> PR!
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className={`${isPR ? "" : "ml-auto"} rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600`}
        aria-label="Delete set"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
