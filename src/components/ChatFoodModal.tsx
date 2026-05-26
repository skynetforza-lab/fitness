import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Check, Sparkles } from "lucide-react";
import type { CustomFood, FoodLog } from "@/lib/types";
import { addFoodLog, fetchCustomFoods } from "@/lib/db";

interface Props {
  initialMealType: FoodLog["meal_type"];
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIItem {
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface AIResponse {
  message: string;
  items: AIItem[];
  needs_clarification: boolean;
  clarification_question: string | null;
}

const MEAL_LABELS: Record<FoodLog["meal_type"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const MEAL_KEYS: FoodLog["meal_type"][] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export default function ChatFoodModal({
  initialMealType,
  date,
  onAdded,
  onClose,
}: Props) {
  const [mealType, setMealType] = useState<FoodLog["meal_type"]>(initialMealType);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<AIItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    fetchCustomFoods()
      .then(setCustomFoods)
      .catch(() => setCustomFoods([]));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pendingItems]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    setPendingItems([]);

    try {
      const res = await fetch("/api/chat-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          customFoods: customFoods.map((cf) => ({
            name: cf.name,
            calories_per_100g: cf.calories_per_100g,
            protein_per_100g: cf.protein_per_100g,
            carbs_per_100g: cf.carbs_per_100g,
            fat_per_100g: cf.fat_per_100g,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AIResponse;
      setMessages([
        ...next,
        { role: "assistant", content: data.message || "(no response)" },
      ]);
      if (!data.needs_clarification && data.items.length > 0) {
        setPendingItems(data.items);
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Sorry, I ran into an error: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmLog() {
    if (pendingItems.length === 0) return;
    setLogging(true);
    try {
      for (const item of pendingItems) {
        await addFoodLog({
          date,
          meal_type: mealType,
          food_name: item.food_name,
          quantity: item.quantity,
          unit: item.unit || "g",
          calories: Math.round(item.calories * 10) / 10,
          protein_g: Math.round(item.protein_g * 100) / 100,
          carbs_g: Math.round(item.carbs_g * 100) / 100,
          fat_g: Math.round(item.fat_g * 100) / 100,
        });
      }
      onAdded();
      onClose();
    } catch (e) {
      setError(`Failed to log: ${(e as Error).message}`);
      setLogging(false);
    }
  }

  const totals = pendingItems.reduce(
    (a, i) => ({
      cals: a.cals + i.calories,
      p: a.p + i.protein_g,
      c: a.c + i.carbs_g,
      f: a.f + i.fat_g,
    }),
    { cals: 0, p: 0, c: 0, f: 0 },
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <div>
              <h2 className="text-base font-semibold">AI Quick Log</h2>
              <p className="text-xs text-slate-500">
                Powered by Claude · Adding to{" "}
                <select
                  value={mealType}
                  onChange={(e) =>
                    setMealType(e.target.value as FoodLog["meal_type"])
                  }
                  className="font-medium text-brand-700 underline-offset-2 hover:underline"
                >
                  {MEAL_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {MEAL_LABELS[k]}
                    </option>
                  ))}
                </select>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
              <p className="mb-2">👋 Tell me what you ate!</p>
              <p className="text-xs leading-relaxed">
                Try things like:
                <br />
                <span className="italic">
                  "200g chicken breast, 2 rotis, 1 small bowl dal"
                </span>
                <br />
                <span className="italic">
                  "Had a banana, 2 boiled eggs, and chai with milk"
                </span>
                <br />
                <span className="italic">
                  "1 plate chicken biryani"
                </span>
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
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

          {pendingItems.length > 0 && (
            <div className="space-y-2 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Ready to log to {MEAL_LABELS[mealType]}
              </div>
              <ul className="space-y-1 text-sm">
                {pendingItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="min-w-0 text-slate-800">
                      <span className="break-words">{item.food_name}</span>{" "}
                      <span className="text-slate-500">
                        ({item.quantity}
                        {item.unit})
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-600">
                      {Math.round(item.calories)} kcal
                    </span>
                  </li>
                ))}
              </ul>
              <div className="grid grid-cols-4 gap-1.5 border-t border-emerald-200 pt-2 text-center text-xs">
                <div>
                  <div className="font-bold tabular-nums text-slate-900">
                    {Math.round(totals.cals)}
                  </div>
                  <div className="text-slate-500">kcal</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-emerald-700">
                    {Math.round(totals.p)}g
                  </div>
                  <div className="text-slate-500">protein</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-amber-700">
                    {Math.round(totals.c)}g
                  </div>
                  <div className="text-slate-500">carbs</div>
                </div>
                <div>
                  <div className="font-semibold tabular-nums text-violet-700">
                    {Math.round(totals.f)}g
                  </div>
                  <div className="text-slate-500">fat</div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div ref={endRef} />
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-slate-200 px-4 py-3">
          {pendingItems.length > 0 && (
            <button
              type="button"
              onClick={confirmLog}
              disabled={logging}
              className="btn-primary w-full"
            >
              {logging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Log all {pendingItems.length} item
              {pendingItems.length > 1 ? "s" : ""} to{" "}
              {MEAL_LABELS[mealType]}
            </button>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="What did you eat?"
              disabled={loading}
              className="input flex-1 text-base"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn-primary px-4"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
