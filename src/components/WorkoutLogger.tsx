import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Trophy,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import ExerciseCombobox from "./ExerciseCombobox";
import SetRow from "./SetRow";
import {
  addSet,
  createScheduleFromDate,
  deleteSet,
  fetchExercisePRSession,
  fetchExercises,
  fetchSchedules,
  fetchScheduleExercises,
  fetchLastWorkoutSets,
  fetchSetsForDate,
  fetchSetsForExercise,
  getOrCreateSession,
  markWorkoutDone,
  updateSet,
} from "@/lib/db";
import type {
  Exercise,
  ExerciseSetWithExercise,
  PRSession,
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

  // PR session for the currently selected exercise
  const [prSession, setPrSession] = useState<PRSession | null>(null);
  const [loadingPR, setLoadingPR] = useState(false);
  const [loadingPRSets, setLoadingPRSets] = useState(false);

  // Save-as-schedule modal state
  const [showSaveSchedule, setShowSaveSchedule] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSavedMessage, setScheduleSavedMessage] = useState<string | null>(null);

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

  // Whether today already has any sets for the selected exercise
  const hasTodaySetsForSelected = useMemo(() => {
    if (!selectedId) return false;
    return sets.some((s) => s.exercise_id === selectedId);
  }, [sets, selectedId]);

  // Fetch PR session whenever the selected exercise changes
  useEffect(() => {
    if (!selectedId) {
      setPrSession(null);
      return;
    }
    let cancelled = false;
    setLoadingPR(true);
    fetchExercisePRSession(selectedId)
      .then((pr) => {
        if (!cancelled) setPrSession(pr);
      })
      .catch(() => {
        if (!cancelled) setPrSession(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPR(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleLoadPR() {
    if (!prSession || !sessionId || !selectedId) return;
    setLoadingPRSets(true);
    setError(null);
    try {
      const ex = exercises.find((e) => e.id === selectedId);
      for (let i = 0; i < prSession.sets.length; i++) {
        const s = prSession.sets[i];
        const created = await addSet({
          sessionId,
          exerciseId: selectedId,
          setNumber: nextSetNumber + i,
          weightKg: s.weight_kg,
          reps: s.reps,
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
      void markWorkoutDone(dateISO);
    } catch (e) {
      setError(`Failed to load PR sets: ${(e as Error).message}`);
    } finally {
      setLoadingPRSets(false);
    }
  }

  async function handleSaveSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleName.trim()) return;
    setSavingSchedule(true);
    setError(null);
    try {
      await createScheduleFromDate(scheduleName.trim(), dateISO);
      setScheduleSavedMessage(`Saved "${scheduleName.trim()}" to your schedules.`);
      setShowSaveSchedule(false);
      setScheduleName("");
      setTimeout(() => setScheduleSavedMessage(null), 3000);
    } catch (err) {
      setError(`Couldn't save schedule: ${(err as Error).message}`);
    } finally {
      setSavingSchedule(false);
    }
  }

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
      // Auto-tick the "workout" habit for this day. Fire-and-forget.
      void markWorkoutDone(dateISO);
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

  async function handleUpdate(
    id: string,
    patch: { weightKg?: number; reps?: number },
  ) {
    const updated = await updateSet(id, patch);
    setSets((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, weight_kg: updated.weight_kg, reps: updated.reps }
          : s,
      ),
    );
    // Re-check PR after edit
    const exerciseId = sets.find((s) => s.id === id)?.exercise_id;
    if (exerciseId) void checkPR(exerciseId, id);
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
      // Loading a schedule = working out today. Auto-tick the habit.
      if (scheduleExercises.length > 0) void markWorkoutDone(dateISO);
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

      {/* Save-as-schedule modal */}
      {showSaveSchedule && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Save as schedule</h3>
              <button
                type="button"
                onClick={() => { setShowSaveSchedule(false); setScheduleName(""); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Save today's workout as a reusable template. We'll keep the
              exercises in order with each one's set count and most-common reps.
            </p>
            <form onSubmit={handleSaveSchedule} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g. Push Day A"
                className="input text-base"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowSaveSchedule(false); setScheduleName(""); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule || !scheduleName.trim()}
                  className="btn-primary flex-1"
                >
                  {savingSchedule ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduleSavedMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          {scheduleSavedMessage}
        </div>
      )}

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Log a set</h3>
          <div className="flex items-center gap-1">
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
              <span className="hidden sm:inline">{loadingSchedule ? "Loading…" : "Load schedule"}</span>
              <span className="sm:hidden">{loadingSchedule ? "…" : "Load"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSaveSchedule(true)}
              disabled={sets.length === 0}
              className="btn-ghost flex items-center gap-1.5 text-xs disabled:opacity-40"
              title={sets.length === 0 ? "Log a set first" : "Save today as schedule"}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save as schedule</span>
              <span className="sm:hidden">Save</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <ExerciseCombobox
            exercises={exercises}
            selectedId={selectedId}
            onSelect={(ex) => setSelectedId(ex.id)}
            onCreated={(ex) => setExercises((prev) => [...prev, ex])}
          />

          {/* PR Session card */}
          {selectedId && !hasTodaySetsForSelected && (loadingPR || prSession) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              {loadingPR ? (
                <p className="flex items-center gap-2 text-sm text-amber-800">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Looking up your PR…
                </p>
              ) : prSession ? (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">
                      Your PR — {format(parseISO(prSession.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <ul className="mb-3 space-y-0.5 text-xs text-amber-900">
                    {prSession.sets.map((s) => (
                      <li key={s.set_number} className="tabular-nums">
                        Set {s.set_number}: <strong>{s.weight_kg} kg</strong> × {s.reps} reps
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={handleLoadPR}
                    disabled={loadingPRSets}
                    className="flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {loadingPRSets ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Load PR sets (target to beat)
                  </button>
                </>
              ) : null}
            </div>
          )}

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
                      onUpdate={(patch) => handleUpdate(s.id, patch)}
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
