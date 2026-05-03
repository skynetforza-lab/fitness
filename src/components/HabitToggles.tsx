import { HABIT_COLORS, HABIT_KEYS, HABIT_LABELS } from "@/lib/types";
import type { DailyLog, HabitKey } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  log: Pick<DailyLog, HabitKey> | null;
  onToggle: (habit: HabitKey, next: boolean) => void;
  disabled?: boolean;
}

export default function HabitToggles({ log, onToggle, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {HABIT_KEYS.map((key) => {
        const checked = log?.[key] ?? false;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key, !checked)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
              checked
                ? "border-transparent text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            style={checked ? { background: HABIT_COLORS[key] } : undefined}
          >
            <span
              className={cn(
                "h-3 w-3 rounded-full border",
                checked ? "border-white bg-white" : "border-slate-300",
              )}
            />
            <span className="font-medium">{HABIT_LABELS[key]}</span>
          </button>
        );
      })}
    </div>
  );
}
