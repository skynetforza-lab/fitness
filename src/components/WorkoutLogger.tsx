import { useEffect, useMemo, useState } from "react";
import {
  BookmarkPlus,
  CalendarDays,
  Check,
  Layers,
  Loader2,
  Plus,
  TrendingDown,
  Trophy,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import ExerciseCombobox from "./ExerciseCombobox";
import SetRow from "./SetRow";
import RestTimer from "./RestTimer";
import {
  addSet,
  createScheduleFromDate,
  deleteSet,
  fetchExercisePRSession,
  fetchExercises,
  fetchSchedules,
  fetchScheduleExercises,
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
import { cn } from "@/lib/cn";

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
  const [addAsDropSet, setAddAsDropSet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [prSetIds, setPrSetIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Rest timer. runKey is bumped on every tick so the countdown restarts even
  // when the duration is unchanged.
  const [timer, setTimer] = useState<{
    seconds: number;
    label: string;
    runKey: number;
  } | null>(null);

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

  // Collect exercises sharing a superset label into one block, keeping the
  // order each first appears in. Unlabelled exercises stay standalone.
  const blocks = useMemo(() => {
    type Entry = (typeof grouped)[number];
    type Block = { label: string | null; entries: Entry[] };
    const out: Block[] = [];
    const byLabel = new Map<string, Block>();
    for (const entry of grouped) {
      const label = entry[1].find((s) => s.superset_group)?.superset_group ?? null;
      if (!label) {
        out.push({ label: null, entries: [entry] });
        continue;
      }
      const existing = byLabel.get(label);
      if (existing) {
        existing.entries.push(entry);
      } else {
        const block: Block = { label, entries: [entry] };
        byLabel.set(label, block);
        out.push(block);
      }
    }
    return out;
  }, [grouped]);

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
      // Inherit the superset label from the sets already logged for this
      // exercise today, so a manually added set stays in its group.
      const existingGroup =
        sets.find((s) => s.exercise_id === selectedId && s.superset_group)
          ?.superset_group ?? null;
      const created = await addSet({
        sessionId,
        exerciseId: selectedId,
        setNumber: nextSetNumber,
        weightKg: w,
        reps: r,
        supersetGroup: existingGroup,
        isDropSet: addAsDropSet,
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
      setAddAsDropSet(false);
      // A drop set is deliberately lighter, so its high rep count would
      // otherwise trip the reps-based PR check.
      if (!addAsDropSet) void checkPR(selectedId, created.id);
      // Auto-tick the "workout" habit for this day. Fire-and-forget.
      void markWorkoutDone(dateISO);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const REST_BETWEEN_SETS = 30;
  const REST_BETWEEN_EXERCISES = 60;

  async function handleToggleDone(set: ExerciseSetWithExercise) {
    const nowDone = !set.is_done;
    // Update locally first so the tick responds immediately.
    setSets((prev) =>
      prev.map((s) => (s.id === set.id ? { ...s, is_done: nowDone } : s)),
    );

    if (nowDone) {
      // Every other set of this exercise finished → longer rest before moving
      // on. Otherwise it's a normal between-sets break.
      const remaining = sets.filter(
        (s) => s.exercise_id === set.exercise_id && s.id !== set.id && !s.is_done,
      ).length;
      const exerciseComplete = remaining === 0;
      setTimer((t) => ({
        seconds: exerciseComplete ? REST_BETWEEN_EXERCISES : REST_BETWEEN_SETS,
        label: exerciseComplete ? "Next exercise" : "Rest",
        runKey: (t?.runKey ?? 0) + 1,
      }));
    }

    try {
      await updateSet(set.id, { isDone: nowDone });
    } catch (e) {
      // Roll back the tick if it didn't persist.
      setSets((prev) =>
        prev.map((s) => (s.id === set.id ? { ...s, is_done: !nowDone } : s)),
      );
      setError((e as Error).message);
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
    // Re-check PR after edit, but never for a drop set — typing in its
    // (lighter) weight by hand shouldn't be able to flash a PR badge.
    const edited = sets.find((s) => s.id === id);
    if (edited && !edited.is_drop_set) void checkPR(edited.exercise_id, id);
  }

  async function handleLoadSchedule(schedule: WorkoutSchedule) {
    if (!sessionId) return;
    setShowPicker(false);
    setLoadingSchedule(true);
    setError(null);
    try {
      const scheduleExercises = await fetchScheduleExercises(schedule.id);

      for (const item of scheduleExercises) {
        // Pre-fill with the PR session's sets — the heaviest weights/reps the
        // user has ever logged for this exercise — so each set is something
        // to match or beat.
        const pr = await fetchExercisePRSession(item.exercise_id);
        const prSets = pr?.sets ?? [];
        // Fallback for slots beyond what the PR session had: use the heaviest
        // single set from the PR session (max weight, ties → most reps).
        const fallback =
          prSets.length > 0
            ? prSets.reduce(
                (best, s) =>
                  s.weight_kg > best.weight_kg ||
                  (s.weight_kg === best.weight_kg && s.reps > best.reps)
                    ? s
                    : best,
                prSets[0],
              )
            : null;
        const ex = exercises.find((e) => e.id === item.exercise_id);

        for (let i = 0; i < item.set_count; i++) {
          const src = prSets[i] ?? fallback;
          const w = src?.weight_kg ?? 0;
          const r = src?.reps ?? item.default_reps;
          const created = await addSet({
            sessionId,
            exerciseId: item.exercise_id,
            setNumber: i + 1,
            weightKg: w,
            reps: r,
            supersetGroup: item.superset_group,
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

        // Append the drop set after the working sets. Weight is left at 0 for
        // the user to type in — how far to drop is a judgement call made in
        // the moment, so we don't guess a percentage.
        if (item.is_drop_set) {
          const created = await addSet({
            sessionId,
            exerciseId: item.exercise_id,
            setNumber: item.set_count + 1,
            weightKg: 0,
            reps: item.default_reps,
            supersetGroup: item.superset_group,
            isDropSet: true,
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
      {timer && (
        <RestTimer
          seconds={timer.seconds}
          label={timer.label}
          runKey={timer.runKey}
          onDismiss={() => setTimer(null)}
        />
      )}

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
              <Plus className="h-4 w-4" />{" "}
              {addAsDropSet ? "Add drop set" : `Add set #${nextSetNumber}`}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAddAsDropSet((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition",
              addAsDropSet
                ? "bg-orange-100 text-orange-700"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200",
            )}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            {addAsDropSet ? "Logging as drop set" : "Log as drop set"}
          </button>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-500">
          No sets logged yet for this day. Pick an exercise above, or load a
          schedule to auto-fill your usual weights.
        </div>
      ) : (
        blocks.map((block, bi) => {
          const body = block.entries.map(([exerciseId, list]) => {
            const ex = list[0].exercise;
            return (
              <div key={exerciseId}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h4 className="font-semibold">{ex.name}</h4>
                  <span className="text-xs text-slate-500">{ex.muscle_group}</span>
                </div>
                <div className="space-y-2">
                  {[...list]
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((s) => (
                      <SetRow
                        key={s.id}
                        set={s}
                        isPR={prSetIds.has(s.id)}
                        onDelete={() => handleDelete(s.id)}
                        onUpdate={(patch) => handleUpdate(s.id, patch)}
                        onToggleDone={() => void handleToggleDone(s)}
                      />
                    ))}
                </div>
              </div>
            );
          });

          if (!block.label) {
            return (
              <div key={block.entries[0][0]} className="card p-4">
                {body}
              </div>
            );
          }
          return (
            <div
              key={`ss-${block.label}-${bi}`}
              className="card border-purple-200 p-4"
            >
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-600">
                <Layers className="h-3.5 w-3.5" />
                Superset {block.label}
                <span className="ml-1 font-normal normal-case tracking-normal text-slate-400">
                  — back-to-back, no rest between
                </span>
              </div>
              <div className="space-y-4">{body}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
