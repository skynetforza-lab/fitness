import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy } from "lucide-react";
import type { DailyLog } from "@/lib/types";

interface Props {
  logs: DailyLog[];
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PlankProgressionChart({ logs }: Props) {
  const points = useMemo(() => {
    return logs
      .filter((l) => (l.plank_seconds ?? 0) > 0)
      .map((l) => ({
        date: l.date,
        seconds: l.plank_seconds!,
        label: format(parseISO(l.date), "MMM d"),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs]);

  const best = points.reduce((m, p) => (p.seconds > m ? p.seconds : m), 0);

  if (points.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">
        Log plank time on any calendar day to see your progression.
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">
          Plank duration over time
        </h3>
        <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Trophy className="h-3.5 w-3.5" />
          Best: {formatMMSS(best)}
        </span>
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, bottom: 0, left: -10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickMargin={6}
            />
            <YAxis
              tickFormatter={(v) => formatMMSS(Number(v))}
              tick={{ fontSize: 11, fill: "#64748b" }}
              width={48}
            />
            <Tooltip
              formatter={(v: number) => [formatMMSS(v), "Duration"]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="seconds"
              stroke="#0d9eff"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0d9eff" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
