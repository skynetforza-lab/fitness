import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Layers, Plus, Trash2, TrendingDown } from "lucide-react";
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
  updateScheduleExercise,
} from "@/lib/db";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/presets";
import type { Exercise, WorkoutSchedule, ScheduleExercise } from "@/lib/types";
import ExerciseCombobox from "@/components/ExerciseCombobox";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

type Tab = "library" | "schedules";

// ─── Library tab ────────────────────────────────────────────────────────────

function LibraryTab() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("Chest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises().then(setExercises);
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
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
            {list.map((ex) => {
              const isOwnCustom = !ex.is_preset && ex.user_id === currentUserId;
              const isSharedCustom = !ex.is_preset && ex.user_id !== currentUserId;
              return (
                <li key={ex.id} className="flex items-center justify-between py-2">
                  <span>
                    {ex.name}
                    {isOwnCustom && (
                      <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                        custom
                      </span>
                    )}
                    {isSharedCustom && (
                      <span className="ml-2 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                        shared
                      </span>
                    )}
                  </span>
                  {isOwnCustom && (
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
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

// ─── Schedule exercise row (superset group + drop set editable inline) ──────

function ScheduleItemRow({
  item,
  onRemove,
  onToggleDropSet,
  onSetSupersetGroup,
}: {
  item: ScheduleExercise;
  onRemove: () => void;
  onToggleDropSet: () => void;
  onSetSupersetGroup: (value: string) => void;
}) {
  const [group, setGroup] = useState(item.superset_group ?? "");

  // Keep local state in sync if parent prop updates
  useEffect(() => setGroup(item.superset_group ?? ""), [item.superset_group]);

  function commitGroup() {
    if (group.trim() === (item.superset_group ?? "")) return;
    onSetSupersetGroup(group);
  }

  return (
    <li className="flex flex-col gap-1.5 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{item.exercise?.name ?? "—"}</span>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            {item.set_count} × {item.default_reps} reps
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Layers className="h-3 w-3 text-purple-500" />
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            onBlur={commitGroup}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="Superset (e.g. A)"
            className="w-32 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />
        </div>
        <button
          type="button"
          onClick={onToggleDropSet}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition",
            item.is_drop_set
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
          )}
        >
          <TrendingDown className="h-3 w-3" /> Drop set
        </button>
      </div>
    </li>
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
  const [supersetGroup, setSupersetGroup] = useState("");
  const [isDropSet, setIsDropSet] = useState(false);
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
        supersetGroup,
        isDropSet,
      );
      const ex = localExercises.find((e) => e.id === selectedId);
      setItems((prev) => [
        ...prev,
        { ...created, exercise: ex ? { id: ex.id, name: ex.name, muscle_group: ex.muscle_group } : undefined },
      ]);
      setSelectedId(null);
      setSupersetGroup("");
      setIsDropSet(false);
    } finally {
      setAddBusy(false);
    }
  }

  async function handleRemove(id: string) {
    await removeScheduleExercise(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleToggleDropSet(item: ScheduleExercise) {
    const updated = await updateScheduleExercise(item.id, { isDropSet: !item.is_drop_set });
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_drop_set: updated.is_drop_set } : i)),
    );
  }

  async function handleSetSupersetGroup(item: ScheduleExercise, value: string) {
    const updated = await updateScheduleExercise(item.id, { supersetGroup: value });
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, superset_group: updated.superset_group } : i)),
    );
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
                <ScheduleItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item.id)}
                  onToggleDropSet={() => handleToggleDropSet(item)}
                  onSetSupersetGroup={(value) => handleSetSupersetGroup(item, value)}
                />
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
            <div>
              <label className="label">Superset</label>
              <input
                type="text"
                placeholder="e.g. A"
                className="input w-24"
                value={supersetGroup}
                onChange={(e) => setSupersetGroup(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-1.5 pb-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={isDropSet}
                onChange={(e) => setIsDropSet(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
              />
              Drop set
            </label>
            <button
              type="submit"
              disabled={addBusy || !selectedId}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
          <p className="text-xs text-slate-400">
            Give two or more exercises the same superset label (e.g. "A") to
            group them back-to-back. Mark "Drop set" to flag an exercise's
            last set as a drop set.
          </p>

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
