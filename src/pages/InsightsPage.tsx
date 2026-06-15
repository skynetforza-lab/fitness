import { useEffect, useMemo, useRef, useState } from "react";
import {
  differenceInCalendarDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import {
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Check,
} from "lucide-react";
import { fetchFoodLogsInRange, fetchMyProfile } from "@/lib/db";
import { DEFAULT_GOALS } from "@/lib/types";
import type { FoodLog, NutritionGoals } from "@/lib/types";
import { cn } from "@/lib/cn";

type Period = "3d" | "7d" | "14d" | "custom";

const PERIOD_PRESETS: { key: Period; label: string }[] = [
  { key: "3d", label: "3 days" },
  { key: "7d", label: "7 days" },
  { key: "14d", label: "14 days" },
  { key: "custom", label: "Custom" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TopFoodRow {
  name: string;
  total: number;
  entries: number;
}

interface FoodAggregates {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  topFoods: {
    by_calories: TopFoodRow[];
    by_carbs: TopFoodRow[];
    by_fat: TopFoodRow[];
    by_protein: TopFoodRow[];
  };
}

function computeAggregates(logs: FoodLog[]): FoodAggregates {
  const totals = logs.reduce(
    (a, l) => ({
      calories: a.calories + l.calories,
      protein: a.protein + l.protein_g,
      carbs: a.carbs + l.carbs_g,
      fat: a.fat + l.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  // Group by food name (normalize whitespace, ignore serving-size suffix)
  const norm = (s: string) => s.trim().toLowerCase();
  const groups = new Map<
    string,
    {
      display: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      entries: number;
    }
  >();
  for (const l of logs) {
    const key = norm(l.food_name);
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        display: l.food_name,
        calories: l.calories,
        protein: l.protein_g,
        carbs: l.carbs_g,
        fat: l.fat_g,
        entries: 1,
      });
    } else {
      existing.calories += l.calories;
      existing.protein += l.protein_g;
      existing.carbs += l.carbs_g;
      existing.fat += l.fat_g;
      existing.entries += 1;
    }
  }

  const arr = Array.from(groups.values());
  const top = (sortKey: keyof typeof arr[number]): TopFoodRow[] =>
    [...arr]
      .filter((g) => (g[sortKey] as number) > 0)
      .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
      .slice(0, 5)
      .map((g) => ({
        name: g.display,
        total: g[sortKey] as number,
        entries: g.entries,
      }));

  return {
    totals,
    topFoods: {
      by_calories: top("calories"),
      by_carbs: top("carbs"),
      by_fat: top("fat"),
      by_protein: top("protein"),
    },
  };
}

interface SummaryRowProps {
  label: string;
  actual: number;
  target: number;
  unit: string;
  color: string;
}

function SummaryRow({ label, actual, target, unit, color }: SummaryRowProps) {
  const delta = actual - target;
  const onTrack = Math.abs(delta) <= target * 0.05;
  const over = delta > target * 0.05;
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <span className="flex items-baseline gap-2 text-sm tabular-nums text-slate-600">
        <span>
          {Math.round(actual).toLocaleString()}
          <span className="text-slate-400">
            {" "}
            / {Math.round(target).toLocaleString()}
            {unit}
          </span>
        </span>
        <span
          className={cn(
            "flex shrink-0 items-center gap-0.5 text-xs font-medium",
            onTrack
              ? "text-emerald-600"
              : over
                ? "text-red-600"
                : "text-amber-600",
          )}
        >
          {onTrack ? (
            <>
              <Check className="h-3 w-3" /> on track
            </>
          ) : over ? (
            <>
              <TrendingUp className="h-3 w-3" /> +
              {Math.round(delta).toLocaleString()}
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3" />{" "}
              {Math.round(delta).toLocaleString()}
            </>
          )}
        </span>
      </span>
    </div>
  );
}

export default function InsightsPage() {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>("7d");
  const [customFrom, setCustomFrom] = useState<string>(
    format(subDays(today, 6), "yyyy-MM-dd"),
  );
  const [customTo, setCustomTo] = useState<string>(format(today, "yyyy-MM-dd"));

  const { from, to } = useMemo(() => {
    if (period === "3d")
      return { from: startOfDay(subDays(today, 2)), to: endOfDay(today) };
    if (period === "7d")
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    if (period === "14d")
      return { from: startOfDay(subDays(today, 13)), to: endOfDay(today) };
    return {
      from: startOfDay(parseISO(customFrom)),
      to: endOfDay(parseISO(customTo)),
    };
  }, [period, today, customFrom, customTo]);

  const fromISO = format(from, "yyyy-MM-dd");
  const toISO = format(to, "yyyy-MM-dd");
  const days = Math.max(1, differenceInCalendarDays(to, from) + 1);

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchFoodLogsInRange(fromISO, toISO)
      .then(setLogs)
      .catch(() => setLogs([]));
  }, [fromISO, toISO]);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p) {
          setGoals({
            calories: p.calories_goal ?? DEFAULT_GOALS.calories,
            protein: p.protein_goal ?? DEFAULT_GOALS.protein,
            carbs: p.carbs_goal ?? DEFAULT_GOALS.carbs,
            fat: p.fat_goal ?? DEFAULT_GOALS.fat,
          });
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  // Reset chat whenever the analyzed range changes
  useEffect(() => {
    setMessages([]);
    setError(null);
  }, [fromISO, toISO]);

  // Scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const { totals, topFoods } = useMemo(() => computeAggregates(logs), [logs]);
  const daysLogged = useMemo(
    () => new Set(logs.map((l) => l.date)).size,
    [logs],
  );

  const targets = {
    calories: goals.calories * days,
    protein: goals.protein * days,
    carbs: goals.carbs * days,
    fat: goals.fat * days,
  };

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: text.trim() },
    ];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nutrition-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: { from: fromISO, to: toISO, days, daysLogged },
          goals,
          totals,
          topFoods,
          messages: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMessages([
        ...next,
        { role: "assistant", content: data.message || "(no response)" },
      ]);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setMessages([
        ...next,
        { role: "assistant", content: `Sorry, I ran into an error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function analyze() {
    void send(
      "Analyze my nutrition for this period. Tell me which goals I met or missed (with numbers and %), the top foods that drove the result, what I should eat MORE of in the next few days, and what I should eat LESS of.",
    );
  }

  const noData = logs.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
      {/* Header */}
      <div className="card flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h1 className="text-xl font-semibold">Nutrition insights</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            AI-powered analysis of your food log — pick a period and ask
            questions.
          </p>
        </div>
      </div>

      {/* Period picker */}
      <div className="card space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                period === p.key
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 active:bg-slate-200",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-2 text-sm">
            <div>
              <label className="block text-xs text-slate-500">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo}
                className="input py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                max={format(today, "yyyy-MM-dd")}
                className="input py-1 text-sm"
              />
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500">
          {format(from, "MMM d")} – {format(to, "MMM d, yyyy")} · {days} day
          {days > 1 ? "s" : ""}
          {daysLogged < days && ` · ${daysLogged} logged`}
        </p>
      </div>

      {/* Quick numbers card */}
      <div className="card p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Period at a glance
        </div>
        <div className="divide-y divide-slate-100">
          <SummaryRow
            label="Calories"
            actual={totals.calories}
            target={targets.calories}
            unit=" kcal"
            color="text-brand-700"
          />
          <SummaryRow
            label="Protein"
            actual={totals.protein}
            target={targets.protein}
            unit="g"
            color="text-emerald-700"
          />
          <SummaryRow
            label="Carbs"
            actual={totals.carbs}
            target={targets.carbs}
            unit="g"
            color="text-amber-700"
          />
          <SummaryRow
            label="Fat"
            actual={totals.fat}
            target={targets.fat}
            unit="g"
            color="text-violet-700"
          />
        </div>
      </div>

      {/* Conversation */}
      <div className="card flex min-h-[200px] flex-col p-4">
        {noData && messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            No food logged in this period. Log some meals on the Nutrition page
            and come back to get insights.
          </p>
        ) : messages.length === 0 ? (
          <div className="space-y-3 py-4 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-brand-500" />
            <p className="text-sm text-slate-600">
              Tap below to get a personalized analysis of this period — what
              you hit, what you missed, and what to do next.
            </p>
            <button
              type="button"
              onClick={analyze}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Analyze this period
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    thinking…
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            {error && (
              <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask a follow-up…"
                disabled={loading}
                className="input flex-1 text-base"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="btn-primary px-4"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
