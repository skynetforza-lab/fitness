import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Search,
  X,
  Loader2,
  Plus,
  ScanLine,
  ChefHat,
  Trash2,
} from "lucide-react";
import type {
  CustomFood,
  FoodLog,
  FoodSearchResult,
  FoodServing,
} from "@/lib/types";
import {
  lookupBarcode,
  searchLocalFoods,
  searchRemoteFoods,
} from "@/lib/nutrition";
import { addFoodLog, deleteCustomFood, fetchCustomFoods } from "@/lib/db";
import CustomFoodModal from "./CustomFoodModal";

// Lazy-load the barcode scanner — keeps the html5-qrcode bundle (~300KB)
// out of the main chunk until the user actually taps "Scan barcode".
const BarcodeScanner = lazy(() => import("./BarcodeScanner"));

interface Props {
  mealType: FoodLog["meal_type"];
  date: string;
  onAdded: () => void;
  onClose: () => void;
}

type Source = "common" | "mine" | "branded";

interface ResultItem {
  food: FoodSearchResult;
  source: Source;
  customId?: string; // present when source = "mine"
}

const MEAL_LABELS: Record<FoodLog["meal_type"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export default function FoodSearchModal({
  mealType,
  date,
  onAdded,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [selectedSource, setSelectedSource] = useState<Source>("common");
  const [qty, setQty] = useState(100);
  const [activeServing, setActiveServing] = useState<FoodServing | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showScanner, setShowScanner] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);
  const [missingBarcode, setMissingBarcode] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load custom foods on mount
  useEffect(() => {
    fetchCustomFoods().then(setCustomFoods).catch(() => setCustomFoods([]));
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search effect: combines local DB + custom foods + (debounced) remote
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (!q) {
      setResults([]);
      setRemoteLoading(false);
      return;
    }
    const qLower = q.toLowerCase();

    // 1. Custom foods (user's own) — instant
    const mine: ResultItem[] = customFoods
      .filter((cf) => cf.name.toLowerCase().includes(qLower))
      .map((cf) => ({
        food: customFoodToResult(cf),
        source: "mine",
        customId: cf.id,
      }));

    // 2. Curated local DB — instant
    const local: ResultItem[] = searchLocalFoods(q).map((food) => ({
      food,
      source: "common",
    }));

    setResults([...mine, ...local]);
    setRemoteLoading(true);

    debounceRef.current = setTimeout(async () => {
      const remote = await searchRemoteFoods(q);
      const seen = new Set(
        [...mine, ...local].map((r) => r.food.product_name.toLowerCase()),
      );
      const branded: ResultItem[] = remote
        .filter((r) => !seen.has(r.product_name.toLowerCase()))
        .map((food) => ({ food, source: "branded" }));
      setResults([...mine, ...local, ...branded]);
      setRemoteLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, customFoods]);

  const computed = selected
    ? {
        calories: (selected.calories_per_100g * qty) / 100,
        protein: (selected.protein_per_100g * qty) / 100,
        carbs: (selected.carbs_per_100g * qty) / 100,
        fat: (selected.fat_per_100g * qty) / 100,
      }
    : null;

  function selectFood(item: ResultItem) {
    setSelected(item.food);
    setSelectedSource(item.source);
    if (item.food.servings && item.food.servings.length > 0) {
      setActiveServing(item.food.servings[0]);
      setQty(item.food.servings[0].grams);
    } else {
      setActiveServing(null);
      setQty(100);
    }
  }

  async function handleBarcodeDetected(code: string) {
    setShowScanner(false);
    setBarcodeStatus(`Looking up barcode ${code}…`);
    setError(null);
    setMissingBarcode(null);
    const product = await lookupBarcode(code);
    if (!product) {
      setBarcodeStatus(null);
      setMissingBarcode(code);
      return;
    }
    setBarcodeStatus(null);
    setSelected(product);
    setSelectedSource("branded");
    setQty(100);
    setActiveServing(null);
  }

  async function handleAdd() {
    if (!selected || !computed) return;
    setAdding(true);
    try {
      const displayName = activeServing
        ? `${selected.product_name} (${activeServing.label})`
        : selected.product_name;

      await addFoodLog({
        date,
        meal_type: mealType,
        food_name: displayName,
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

  async function handleDeleteCustom(id: string) {
    if (!confirm("Delete this custom food? This can't be undone.")) return;
    await deleteCustomFood(id);
    setCustomFoods((prev) => prev.filter((cf) => cf.id !== id));
  }

  const showNoResults =
    query.trim() !== "" && !remoteLoading && results.length === 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
        <div className="flex h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-900">
              Add to {MEAL_LABELS[mealType]}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!selected ? (
              <>
                {/* Search input */}
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search food…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input pl-10 pr-10 text-base"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  {remoteLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>

                {/* Action buttons row */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <ScanLine className="h-4 w-4 text-brand-600" />
                    Scan barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustom(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <ChefHat className="h-4 w-4 text-brand-600" />
                    New food
                  </button>
                </div>

                {/* Barcode status */}
                {barcodeStatus && (
                  <p className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {barcodeStatus}
                  </p>
                )}

                {/* Barcode not found — offer to create custom */}
                {missingBarcode && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-medium text-amber-900">
                      Barcode {missingBarcode} not in our database
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      Many Indian and regional products aren't in Open Food Facts yet.
                      Create it as a custom food and we'll save it to your library.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustom(true);
                          setMissingBarcode(null);
                        }}
                        className="flex-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                      >
                        Create custom food
                      </button>
                      <button
                        type="button"
                        onClick={() => setMissingBarcode(null)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <p className="mb-2 text-sm text-red-600">{error}</p>
                )}

                {/* No-results */}
                {showNoResults && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center">
                    <p className="text-sm text-slate-500">
                      No results for “{query.trim()}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCustom(true)}
                      className="mt-2 text-sm font-medium text-brand-600 hover:underline"
                    >
                      Create it as a custom food
                    </button>
                  </div>
                )}

                {/* Hint */}
                {!query.trim() && (
                  <p className="text-xs text-slate-400">
                    Try “egg”, “paneer”, “rice”, “chicken”, “oats”…
                  </p>
                )}

                {/* Results */}
                {results.length > 0 && (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {results.map((item, i) => (
                      <div
                        key={`${item.source}-${i}`}
                        className="flex items-center gap-2 hover:bg-slate-50"
                      >
                        <button
                          type="button"
                          onClick={() => selectFood(item)}
                          className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-3 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="line-clamp-1 text-sm font-medium text-slate-800">
                              {item.food.product_name}
                            </span>
                            <SourceBadge source={item.source} />
                          </div>
                          <span className="ml-2 shrink-0 text-xs text-slate-500">
                            {Math.round(item.food.calories_per_100g)} kcal/100g
                          </span>
                        </button>
                        {item.customId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustom(item.customId!)}
                            className="mr-2 shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            aria-label="Delete custom food"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Selected food + quantity */
              computed && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-base font-medium text-slate-900">
                          {selected.product_name}
                        </p>
                        <SourceBadge source={selectedSource} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(null);
                          setActiveServing(null);
                          setError(null);
                        }}
                        className="shrink-0 text-sm font-medium text-brand-600 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Serving chips */}
                  {selected.servings && selected.servings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selected.servings.map((s) => {
                        const isActive =
                          activeServing?.label === s.label && qty === s.grams;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => {
                              setActiveServing(s);
                              setQty(s.grams);
                            }}
                            className={
                              isActive
                                ? "rounded-full bg-brand-600 px-3 py-1.5 text-sm font-medium text-white"
                                : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                            }
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Quantity input */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">
                      {selected.servings && selected.servings.length > 0
                        ? "Or custom (g)"
                        : "Quantity (g)"}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      max={9999}
                      value={qty}
                      onChange={(e) => {
                        setQty(Math.max(1, Number(e.target.value)));
                        setActiveServing(null);
                      }}
                      className="input w-24 text-right text-base"
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
                      <div key={label} className="rounded bg-white p-2 shadow-sm">
                        <div className={`font-medium tabular-nums ${cls}`}>
                          {Math.round(val)}{unit}
                        </div>
                        <div className="mt-0.5 text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Footer: Add button */}
          {selected && (
            <div className="shrink-0 border-t border-slate-200 px-4 py-3">
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
                Add to {MEAL_LABELS[mealType]}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barcode scanner (lazy-loaded) */}
      {showScanner && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          }
        >
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}

      {/* Custom food creator */}
      {showCustom && (
        <CustomFoodModal
          onClose={() => setShowCustom(false)}
          onSaved={(food) => {
            setCustomFoods((prev) => [food, ...prev]);
            setShowCustom(false);
            // Auto-select the just-created food
            setSelected(customFoodToResult(food));
            setSelectedSource("mine");
            setQty(100);
            setActiveServing(null);
          }}
        />
      )}
    </>
  );
}

// ============================================================
// Helpers
// ============================================================
function customFoodToResult(cf: CustomFood): FoodSearchResult {
  return {
    product_name: cf.name,
    calories_per_100g: cf.calories_per_100g,
    protein_per_100g: cf.protein_per_100g,
    carbs_per_100g: cf.carbs_per_100g,
    fat_per_100g: cf.fat_per_100g,
  };
}

function SourceBadge({ source }: { source: Source }) {
  if (source === "mine") {
    return (
      <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        Mine
      </span>
    );
  }
  if (source === "common") {
    return (
      <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
        Common
      </span>
    );
  }
  return null;
}
