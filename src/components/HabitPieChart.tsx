import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { HABIT_COLORS, HABIT_LABELS } from "@/lib/types";
import type { HabitKey } from "@/lib/types";

interface Props {
  habit: HabitKey;
  hit: number;
  total: number;
}

export default function HabitPieChart({ habit, hit, total }: Props) {
  const missed = Math.max(0, total - hit);
  const pct = total === 0 ? 0 : Math.round((hit / total) * 100);
  const data = [
    { name: "Hit", value: hit, color: HABIT_COLORS[habit] },
    { name: "Missed", value: missed, color: "#e2e8f0" },
  ];
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{HABIT_LABELS[habit]}</h3>
        <span className="text-xs text-slate-500">
          {hit} / {total} days
        </span>
      </div>
      <div className="relative h-40">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={1}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-semibold">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
