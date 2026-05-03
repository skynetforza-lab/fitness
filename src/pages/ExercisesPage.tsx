import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createExercise, deleteExercise, fetchExercises } from "@/lib/db";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/presets";
import type { Exercise } from "@/lib/types";

export default function ExercisesPage() {
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
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      <div className="card p-4">
        <h1 className="text-xl font-semibold">Exercise library</h1>
        <p className="text-sm text-slate-600">
          Presets are read-only. Add your own custom exercises here — they'll
          show up in the dropdown when logging a workout.
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
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
        {error && <p className="w-full text-sm text-rose-600">{error}</p>}
      </form>

      {grouped.map(([g, list]) => (
        <div key={g} className="card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {g}
          </h2>
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
    </div>
  );
}
