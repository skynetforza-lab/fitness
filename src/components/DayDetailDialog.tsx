import { format } from "date-fns";
import { Dumbbell } from "lucide-react";
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
}

export default function DayDetailDialog({
  date,
  log,
  onClose,
  onToggle,
}: Props) {
  const navigate = useNavigate();
  if (!date) return null;
  const iso = toISODate(date);
  return (
    <Modal open={!!date} onClose={onClose} title={format(date, "EEEE, MMM d, yyyy")}>
      <p className="mb-3 text-sm text-slate-600">
        Tap a habit to mark it for this day.
      </p>
      <HabitToggles log={log} onToggle={onToggle} />
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
