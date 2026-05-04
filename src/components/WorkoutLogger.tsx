import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2, Plus, X } from "lucide-react";
import ExerciseCombobox from "./ExerciseCombobox";
import SetRow from "./SetRow";
import {
  addSet,
  deleteSet,
  fetchExercises,
  fetchSchedules,
  fetchScheduleExercises,
  fetchLastWorkoutSets,
  fetchSetsForDate,
  fetchSetsForExercise,
  getOrCreateSession,
} from "@/lib/db";
import type {
  Exercise,
  ExerciseSetWithExercise,
  WorkoutSchedule,
} from "@/lib/types";
import { computePRs } from "@/lib/pr";

interface Props {
  dateISO: string;
}

// ─── Schedule picker modal ───────────────────────────────────────────────────

function SchedulePickerModal({
  onPick,
  onClose,
}: {
  onPick: (s: WorkoutSchedule) => void;
  onClose: () => void;
}) {
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules()
      .then(setSchedules)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Load a schedule</h3>
          <button type="button" onClick={onClose} className="btn-ghost p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : schedules.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No schedules yet. Create one in the Exercises → Schedules tab.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {schedules.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onPick(s)}
                  className="w-full rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-brand-50 hover:text-brand-700 transition"
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Main logger ─────────────────────────────────────────────────────────────

export default function WorkoutLogger({ dateISO }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sets, setSets] = useState<ExerciseSetWithExercise[]>([]);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [exs, session, todaySets] = await Promise.all([
          fetchExercises(),
          getOrCreateSession(dateISO),
          fetchSetsForDate(dateISO),
        ]);
        if (cancelled) return;
        setExercises(exs);
        setSessionId(session.id);
        setSets(todaySets);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateISO]);

  const grouped = useMemo(() => {
    const byExercise = new Map<string, ExerciseSetWithExercise[]>();
    for (const s of sets) {
      const list = byExercise.get(s.exercise_id) ?? [];
      list.push(s);
      byExercise.set(s.exercise_id, list);
    }
    return Array.from(byExercise.entries());
  }, [sets]);

  const nextSetNumber = useMemo(() => {
    if (!selectedId) return 1;
    const existing = sets.filter((s) => s.exercise_id === selectedId);
    return existing.length + 1;
  }, [sets, selectedId]);

  async function checkPR(exerciseId: string, newSetId: string) {
    const allSets = await fetchSetsForExercise(exerciseId);
    const justAdded = allSets.find((s) => s.id === newSetId);
    if (!justAdded) return;
    const others = allSets.filter((s) => s.id !== newSetId);
    const prev = computePRs(others);
    const isPR =
      justAdded.weight_kg > prev.maxWeight ||
      justAdded.reps > prev.maxReps;
    if (isPR) {
      setPrSetIds((s) => new Set(s).add(newSetId));
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !sessionId) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (Number.isNaN(w) || Number.isNaN(r) || r <= 0 || w < 0) {
      setError("Enter a valid weight and reps.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await addSet({
        sessionId,
        exerciseId: selectedId,
        setNumber: nextSetNumber,
        weightKg: w,
        reps: r,
      });
      const ex = exercises.find((e) => e.id === selectedId);
      if (ex) {
        setSets((prev) => [
          ...prev,
          {
            ...created,
            exercise: { id: ex.id, name: ex.name, muscle_group: ex.muscle_group },
          } as ExerciseSetWithExercise,
        ]);
      }
      setWeight("");
      setReps("");
      void checkPR(selectedId, created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteSet(id);
    setSets((prev) => prev.filter((s) => s.id !== id));
    setPrSetIds((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  async function handleLoadSchedule(schedule: WorkoutSchedule) {
    if (!sessionId) return;
    setShowPicker(false);
    setLoadingSchedule(true);
    setError(null);
    try {
      const scheduleExercises = await fetchScheduleExercises(schedule.id);

      for (const item of scheduleExercises) {
        const lastSets = await fetchLastWorkoutSets(item.exercise_id);
        const ex = exercises.find((e) => e.id === item.exercise_id);

        for (let i = 0; i < item.set_count; i++) {
          const prev = lastSets[i];
          const w = prev?.weight_kg ?? 0;
          const r = prev?.reps ?? item.default_reps;
          const created = await addSet({
            sessionId,
            exerciseId: item.exercise_id,
            setNumber: i + 1,
            weightKg: w,
            reps: r,
          });
          if (ex) {
            setSets((prev) => [
              ...prev,
              {
                ...created,
                exercise: { id: ex.id, name: ex.name, muscle_group: ex.muscle_group },
              } as ExerciseSetWithExercise,
            ]);
          }
        }
      }
    } catch (e) {
      setError(`Failed to load schedule: ${(e as Error).message}`);
    } finally {
      setLoadingSchedule(false);
    }
  }

  return (
    <div className="space-y-4">
      {showPicker && (
        <SchedulePickerModal
          onPick={handleLoadSchedule}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Log a set</h3>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            disabled={loadingSchedule}
            className="btn-ghost flex items-center gap-1.5 text-xs"
          >
            {loadingSchedule ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5" />
            )}
            {loadingSchedule ? "Loading…" : "Load schedule"}
          </button>
        </div>

        <div className="space-y-3">
          <ExerciseCombobox
            exercises={exercises}
            selectedId={selectedId}
            onSelect={(ex) => setSelectedId(ex.id)}
            onCreated={(ex) => setExercises((prev) => [...prev, ex])}
          />
          <form onSubmit={handleAdd} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <div>
              <label className="label">Weight (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                className="input"
                placeholder="60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Reps</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                className="input"
                placeholder="8"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={busy || !selectedId}
              className="btn-primary self-end"
            >
              <Plus className="h-4 w-4" /> Add set #{nextSetNumber}
            </button>
          </form>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-500">
          No sets logged yet for this day. Pick an exercise above, or load a
          schedule to auto-fill your usual weights.
        </div>
      ) : (
        grouped.map(([exerciseId, list]) => {
          const ex = list[0].exercise;
          return (
            <div key={exerciseId} className="card p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h4 className="font-semibold">{ex.name}</h4>
                <span className="text-xs text-slate-500">{ex.muscle_group}</span>
              </div>
              <div className="space-y-2">
                {list
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => (
                    <SetRow
                      key={s.id}
                      set={s}
                      isPR={prSetIds.has(s.id)}
                      onDelete={() => handleDelete(s.id)}
                    />
                  ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
