import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/presets";
import { createExercise } from "@/lib/db";
import type { Exercise } from "@/lib/types";

interface Props {
  exercises: Exercise[];
  selectedId: string | null;
  onSelect: (ex: Exercise) => void;
  onCreated?: (ex: Exercise) => void;
}

export default function ExerciseCombobox({
  exercises,
  selectedId,
  onSelect,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<MuscleGroup>("Chest");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const grouped = useMemo(() => {
    const filtered = exercises.filter((e) =>
      e.name.toLowerCase().includes(query.toLowerCase()),
    );
    const byGroup = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const list = byGroup.get(ex.muscle_group) ?? [];
      list.push(ex);
      byGroup.set(ex.muscle_group, list);
    }
    return Array.from(byGroup.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercises, query]);

  const selected = exercises.find((e) => e.id === selectedId) ?? null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const created = await createExercise(newName, newGroup);
      onCreated?.(created);
      onSelect(created);
      setAdding(false);
      setNewName("");
      setQuery("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between text-left"
      >
        <span className={cn(!selected && "text-slate-400")}>
          {selected ? selected.name : "Select an exercise…"}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="sticky top-0 border-b border-slate-200 bg-white p-2">
            <input
              autoFocus
              placeholder="Search exercises…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input"
            />
          </div>

          {adding ? (
            <form onSubmit={handleCreate} className="space-y-2 p-3">
              <div>
                <label className="label">Exercise name</label>
                <input
                  className="input"
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Bulgarian Split Squat"
                />
              </div>
              <div>
                <label className="label">Muscle group</label>
                <select
                  className="input"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  className="btn-primary flex-1"
                >
                  {busy ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {grouped.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  No matching exercises.
                </div>
              )}
              {grouped.map(([group, list]) => (
                <div key={group}>
                  <div className="bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group}
                  </div>
                  {list.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        onSelect(ex);
                        setOpen(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        {ex.name}
                        {!ex.is_preset && (
                          <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                            custom
                          </span>
                        )}
                      </span>
                      {selectedId === ex.id && (
                        <Check className="h-4 w-4 text-brand-600" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAdding(true);
                  setNewName(query);
                }}
                className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4" />
                Add new exercise{query ? `: "${query}"` : ""}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
