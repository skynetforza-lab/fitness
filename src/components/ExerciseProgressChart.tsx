import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fetchExercises, fetchSetsForExercise } from "@/lib/db";
import { computePRs, dailyBestWeight } from "@/lib/pr";
import type { Exercise } from "@/lib/types";

export default function ExerciseProgressChart() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [points, setPoints] = useState<{ date: string; weight: number }[]>([]);
  const [prs, setPRs] = useState<{ maxWeight: number; maxReps: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExercises().then(setExercises);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setPoints([]);
      setPRs(null);
      return;
    }
    setLoading(true);
    fetchSetsForExercise(selectedId)
      .then((sets) => {
        setPoints(dailyBestWeight(sets));
        setPRs(computePRs(sets));
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const grouped = useMemo(() => {
    const m = new Map<string, Exercise[]>();
    for (const e of exercises) {
      const list = m.get(e.muscle_group) ?? [];
      list.push(e);
      m.set(e.muscle_group, list);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [exercises]);

  return (
    <div className="card p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">Exercise progression</h3>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="input sm:w-64"
        >
          <option value="">Select exercise…</option>
          {grouped.map(([group, list]) => (
            <optgroup key={group} label={group}>
              {list.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {prs && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-center">
          <PRBadge label="Max weight" value={`${prs.maxWeight} kg`} />
          <PRBadge label="Max reps" value={`${prs.maxReps}`} />
        </div>
      )}

      <div className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        ) : !selectedId ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Pick an exercise to see your progression.
          </div>
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No sets logged yet for this exercise.
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => format(parseISO(d), "MMM d")}
                stroke="#94a3b8"
                fontSize={12}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `${v}kg`}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                labelFormatter={(d: string) => format(parseISO(d), "EEE, MMM d")}
                formatter={(v: number) => [`${v} kg`, "Max weight"]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0d9eff"
                strokeWidth={2}
                dot={{ r: 4, fill: "#0d9eff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PRBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
