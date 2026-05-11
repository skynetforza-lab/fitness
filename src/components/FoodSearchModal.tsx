import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, Plus } from "lucide-react";
import type { FoodLog, FoodSearchResult } from "@/lib/types";
import { searchLocalFoods, searchRemoteFoods } from "@/lib/nutrition";
import { addFoodLog } from "@/lib/db";

interface Props {
  mealType: FoodLog["meal_type"];
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

interface ResultItem {
  food: FoodSearchResult;
  source: "common" | "branded";
}

export default function FoodSearchModal({ mealType, date, onAdded, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<ResultItem[]>([]);
  const [remoteResults, setRemoteResults] = useState<ResultItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [qty, setQty] = useState(100);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setLocalResults([]);
      setRemoteResults([]);
      setRemoteLoading(false);
      return;
    }

    // Instant local search
    const local = searchLocalFoods(q).map(
      (food): ResultItem => ({ food, source: "common" }),
    );
    setLocalResults(local);
    setRemoteResults([]);

    // Debounced remote search
    setRemoteLoading(true);
    debounceRef.current = setTimeout(async () => {
      const remote = await searchRemoteFoods(q);
      // Filter out remote items whose name already appears in local
      const localNames = new Set(local.map((r) => r.food.product_name.toLowerCase()));
      const filtered = remote
        .filter((r) => !localNames.has(r.product_name.toLowerCase()))
        .map((food): ResultItem => ({ food, source: "branded" }));
      setRemoteResults(filtered);
      setRemoteLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const allResults = [...localResults, ...remoteResults];
  const showNoResults =
    query.trim() !== "" && !remoteLoading && allResults.length === 0;

  const computed = selected
    ? {
        calories: (selected.calories_per_100g * qty) / 100,
        protein: (selected.protein_per_100g * qty) / 100,
        carbs: (selected.carbs_per_100g * qty) / 100,
        fat: (selected.fat_per_100g * qty) / 100,
      }
    : null;

  async function handleAdd() {
    if (!selected || !computed) return;
    setAdding(true);
    try {
      await addFoodLog({
        date,
        meal_type: mealType,
        food_name: selected.product_name,
        quantity: qty,
        unit: "g",
        calories: Math.round(computed.calories * 10) / 10,
        protein_g: Math.round(computed.protein * 100) / 100,
        carbs_g: Math.round(computed.carbs * 100) / 100,
        fat_g: Math.round(computed.fat * 100) / 100,
      });
      onAdded();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
      setAdding(false);
    }
  }

  const mealLabels: Record<FoodLog["meal_type"], string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snacks",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Add to {mealLabels[mealType]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search food (e.g. boiled egg, paneer, biryani…)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            className="input pl-9"
          />
          {remoteLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>

        {/* No-results state */}
        {!selected && showNoResults && (
          <p className="mb-2 text-sm text-slate-500">
            No results found — try a simpler name or check the spelling
          </p>
        )}

        {/* Hint when no query */}
        {!selected && !query.trim() && (
          <p className="mb-2 text-xs text-slate-400">
            Try “egg”, “paneer”, “rice”, “chicken”, “oats”…
          </p>
        )}

        {/* Results list */}
        {!selected && allResults.length > 0 && (
          <div className="mb-3 max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
            {allResults.map((item, i) => (
              <button
                key={`${item.source}-${i}`}
                type="button"
                onClick={() => { setSelected(item.food); setQty(100); }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-medium text-slate-800 line-clamp-1">
                    {item.food.product_name}
                  </span>
                  {item.source === "common" && (
                    <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-700">
                      Common
                    </span>
                  )}
                </div>
                <span className="ml-3 shrink-0 text-xs text-slate-500">
                  {Math.round(item.food.calories_per_100g)} kcal/100g
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected food + quantity */}
        {selected && computed && (
          <div className="mb-3 space-y-3 rounded-lg bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900 leading-snug">
                {selected.product_name}
              </p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 text-xs text-brand-600 hover:underline"
              >
                Change
              </button>
            </div>

            {/* Quantity input */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600 shrink-0">Quantity (g)</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="input w-24 text-right"
              />
            </div>

            {/* Live preview */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { label: "Calories", val: computed.calories, unit: "kcal", cls: "text-slate-800 font-semibold" },
                { label: "Protein", val: computed.protein, unit: "g", cls: "text-emerald-700" },
                { label: "Carbs", val: computed.carbs, unit: "g", cls: "text-amber-700" },
                { label: "Fat", val: computed.fat, unit: "g", cls: "text-violet-700" },
              ].map(({ label, val, unit, cls }) => (
                <div key={label} className="rounded bg-white p-1.5 shadow-sm">
                  <div className={`font-medium tabular-nums ${cls}`}>
                    {Math.round(val)}{unit}
                  </div>
                  <div className="text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mb-2 text-sm text-red-600">{error}</p>
        )}

        {/* Add button */}
        {selected && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding}
            className="btn-primary w-full"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add to {mealLabels[mealType]}
          </button>
        )}
      </div>
    </div>
  );
}
