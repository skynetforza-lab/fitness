import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  createExercise,
  deleteExercise,
  fetchExercises,
  fetchSchedules,
  createSchedule,
  deleteSchedule,
  fetchScheduleExercises,
  addScheduleExercise,
  removeScheduleExercise,
} from "@/lib/db";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/presets";
import type { Exercise, WorkoutSchedule, ScheduleExercise } from "@/lib/types";
import ExerciseCombobox from "@/components/ExerciseCombobox";
import { cn } from "@/lib/cn";

type Tab = "library" | "schedules";

// ─── Library tab ────────────────────────────────────────────────────────────

function LibraryTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("Chest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises().then(setExercises);
  }, []);

  const grouped = useMemo(() => {
    const m = new Map<string, Exercise[]>();
    for (const e of exercises) {
      const list = m.get(e.muscle_group) ?? [];
      list.push(e);
      m.set(e.muscle_group, list);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createExercise(name, group);
      setExercises((prev) => [...prev, created]);
      setName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(ex: Exercise) {
    if (ex.is_preset) return;
    if (!confirm(`Delete "${ex.name}"? Sets logged for it will remain.`)) return;
    try {
      await deleteExercise(ex.id);
      setExercises((prev) => prev.filter((e) => e.id !== ex.id));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <>
      <div className="card p-4">
        <h2 className="mb-1 text-base font-semibold">Exercise library</h2>
        <p className="text-sm text-slate-600">
          Presets are read-only. Add custom exercises — they'll appear in the
          dropdown when logging.
        </p>
      </div>

      <form onSubmit={handleAdd} className="card flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Exercise name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Goblet Squat"
          />
        </div>
        <div>
          <label className="label">Muscle group</label>
          <select
            className="input"
            value={group}
            onChange={(e) => setGroup(e.target.value as MuscleGroup)}
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={busy || !name.trim()} className="btn-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
        {error && <p className="w-full text-sm text-rose-600">{error}</p>}
      </form>

      {grouped.map(([g, list]) => (
        <div key={g} className="card p-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {g}
          </h3>
          <ul className="divide-y divide-slate-100">
            {list.map((ex) => (
              <li key={ex.id} className="flex items-center justify-between py-2">
                <span>
                  {ex.name}
                  {!ex.is_preset && (
                    <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                      custom
                    </span>
                  )}
                </span>
                {!ex.is_preset && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ex)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

// ─── Single schedule accordion ───────────────────────────────────────────────

function ScheduleCard({
  schedule,
  exercises,
  onDeleted,
}: {
  schedule: WorkoutSchedule;
  exercises: Exercise[];
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ScheduleExercise[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [setCount, setSetCount] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [addBusy, setAddBusy] = useState(false);
  const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises);

  // keep local exercise list in sync when parent reloads
  useEffect(() => setLocalExercises(exercises), [exercises]);

  async function toggle() {
    if (!open && items.length === 0) {
      setLoadingItems(true);
      try {
        const data = await fetchScheduleExercises(schedule.id);
        setItems(data);
      } finally {
        setLoadingItems(false);
      }
    }
    setOpen((v) => !v);
  }

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setAddBusy(true);
    try {
      const created = await addScheduleExercise(
        schedule.id,
        selectedId,
        setCount,
        defaultReps,
        items.length,
      );
      const ex = localExercises.find((e) => e.id === selectedId);
      setItems((prev) => [
        ...prev,
        { ...created, exercise: ex ? { id: ex.id, name: ex.name, muscle_group: ex.muscle_group } : undefined },
      ]);
      setSelectedId(null);
    } finally {
      setAddBusy(false);
    }
  }

  async function handleRemove(id: string) {
    await removeScheduleExercise(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleDeleteSchedule() {
    if (!confirm(`Delete schedule "${schedule.name}"?`)) return;
    await deleteSchedule(schedule.id);
    onDeleted();
  }

  return (
    <div className="card">
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-t-2xl p-4 text-left hover:bg-slate-50"
      >
        <span className="font-semibold">{schedule.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {loadingItems ? "…" : open ? `${items.length} exercises` : ""}
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Exercise list */}
          {items.length === 0 ? (
            <p className="text-sm text-slate-400">No exercises yet — add one below.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{item.exercise?.name ?? "—"}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">
                      {item.set_count} × {item.default_reps} reps
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add exercise to schedule */}
          <form
            onSubmit={handleAddExercise}
            className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100"
          >
            <div className="flex-1 min-w-[180px]">
              <label className="label">Exercise</label>
              <ExerciseCombobox
                exercises={localExercises}
                selectedId={selectedId}
                onSelect={(ex) => setSelectedId(ex.id)}
                onCreated={(ex) => {
                  setLocalExercises((prev) => [...prev, ex]);
                  setSelectedId(ex.id);
                }}
              />
            </div>
            <div>
              <label className="label">Sets</label>
              <input
                type="number"
                min={1}
                max={20}
                className="input w-16"
                value={setCount}
                onChange={(e) => setSetCount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Reps</label>
              <input
                type="number"
                min={1}
                max={100}
                className="input w-16"
                value={defaultReps}
                onChange={(e) => setDefaultReps(Number(e.target.value))}
              />
            </div>
            <button
              type="submit"
              disabled={addBusy || !selectedId}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>

          {/* Delete schedule */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDeleteSchedule}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete this schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Schedules tab ───────────────────────────────────────────────────────────

function SchedulesTab() {
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchExercises()])
      .then(([s, e]) => {
        setSchedules(s);
        setExercises(e);
      })
      .catch((e) => setLoadError((e as Error).message));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    setCreateError(null);
    try {
      const created = await createSchedule(newName);
      setSchedules((prev) => [...prev, created]);
      setNewName("");
    } catch (e) {
      setCreateError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card p-4">
        <h2 className="mb-1 text-base font-semibold">Workout schedules</h2>
        <p className="text-sm text-slate-600">
          Build named day templates (e.g. "Push Day", "Pull Day"). When you
          start a workout, load a schedule and every set is pre-filled with your
          last logged weight.
        </p>
      </div>

      {loadError && (
        <div className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <strong>Database error:</strong> {loadError}
          <p className="mt-1 text-xs">
            Make sure you've run the required SQL in your Supabase SQL editor.
          </p>
        </div>
      )}

      {/* New schedule */}
      <form onSubmit={handleCreate} className="card flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1">
          <label className="label">Schedule name</label>
          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Push Day A"
          />
        </div>
        <button type="submit" disabled={busy || !newName.trim()} className="btn-primary">
          <Plus className="h-4 w-4" /> Create
        </button>
        {createError && <p className="w-full text-sm text-rose-600">{createError}</p>}
      </form>

      {schedules.length === 0 ? (
        <div className="card p-6 text-center text-sm text-slate-400">
          No schedules yet. Create one above.
        </div>
      ) : (
        schedules.map((s) => (
          <ScheduleCard
            key={s.id}
            schedule={s}
            exercises={exercises}
            onDeleted={() => setSchedules((prev) => prev.filter((x) => x.id !== s.id))}
          />
        ))
      )}
    </>
  );
}

// ─── Page shell ─────────────────────────────────────────────────────────────

export default function ExercisesPage() {
  const [tab, setTab] = useState<Tab>("library");

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      <div className="card p-1 flex gap-1">
        {(["library", "schedules"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition",
              tab === t
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {t === "library" ? "Library" : "Schedules"}
          </button>
        ))}
      </div>

      {tab === "library" ? <LibraryTab /> : <SchedulesTab />}
    </div>
  );
}
