import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, Dumbbell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import HabitToggles from "./HabitToggles";
import { toISODate } from "@/lib/dates";
import type { DailyLog, HabitKey } from "@/lib/types";

interface Props {
  date: Date | null;
  log: DailyLog | null;
  onClose: () => void;
  onToggle: (habit: HabitKey, next: boolean) => void;
  onSavePlank: (seconds: number | null) => Promise<void>;
}

export default function DayDetailDialog({
  date,
  log,
  onClose,
  onToggle,
  onSavePlank,
}: Props) {
  const navigate = useNavigate();
  const [mins, setMins] = useState("0");
  const [secs, setSecs] = useState("0");
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  // Reset/seed the plank inputs when the selected day changes
  useEffect(() => {
    const total = log?.plank_seconds ?? 0;
    setMins(String(Math.floor(total / 60)));
    setSecs(String(total % 60));
    setSavedTick(false);
  }, [log?.plank_seconds, date]);

  if (!date) return null;
  const iso = toISODate(date);

  async function handleSavePlank() {
    const m = Math.max(0, parseInt(mins, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(secs, 10) || 0));
    const total = m * 60 + s;
    setSaving(true);
    try {
      await onSavePlank(total > 0 ? total : null);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!date} onClose={onClose} title={format(date, "EEEE, MMM d, yyyy")}>
      <p className="mb-3 text-sm text-slate-600">
        Tap a habit to mark it for this day.
      </p>
      <HabitToggles log={log} onToggle={onToggle} />

      {/* Plank time */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Plank time</span>
          {savedTick && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={120}
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              className="input w-16 text-center text-base"
            />
            <span className="text-sm text-slate-500">min</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={secs}
              onChange={(e) => setSecs(e.target.value)}
              className="input w-16 text-center text-base"
            />
            <span className="text-sm text-slate-500">sec</span>
          </div>
          <button
            type="button"
            onClick={handleSavePlank}
            disabled={saving}
            className="btn-secondary ml-auto"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/workout/${iso}`)}
        className="btn-primary mt-4 w-full"
      >
        <Dumbbell className="h-4 w-4" />
        Log workout for this day
      </button>
    </Modal>
  );
}
