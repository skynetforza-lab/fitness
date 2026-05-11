import { useEffect, useMemo, useRef, useState } from "react";
import { X, Save, Plus, Trash2, Loader2, Search } from "lucide-react";
import type {
  CustomFood,
  FoodSearchResult,
  RecipeIngredient,
} from "@/lib/types";
import { searchLocalFoods, searchRemoteFoods } from "@/lib/nutrition";
import { addCustomFood } from "@/lib/db";

interface Props {
  onClose: () => void;
  onSaved: (food: CustomFood) => void;
}

type Mode = "quick" | "recipe";

export default function CustomFoodModal({ onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>("quick");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick mode state (per-100g)
  const [qCals, setQCals] = useState<string>("");
  const [qP, setQP] = useState<string>("");
  const [qC, setQC] = useState<string>("");
  const [qF, setQF] = useState<string>("");

  // Recipe mode state
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (a, i) => ({
        grams: a.grams + i.grams,
        calories: a.calories + i.calories,
        protein: a.protein + i.protein,
        carbs: a.carbs + i.carbs,
        fat: a.fat + i.fat,
      }),
      { grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [ingredients]);

  const per100 = useMemo(() => {
    if (totals.grams <= 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const f = 100 / totals.grams;
    return {
      calories: totals.calories * f,
      protein: totals.protein * f,
      carbs: totals.carbs * f,
      fat: totals.fat * f,
    };
  }, [totals]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Please give your food a name.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      let saved: CustomFood;
      if (mode === "quick") {
        const calories = Number(qCals) || 0;
        if (calories <= 0) {
          setError("Please enter calories per 100g.");
          setSaving(false);
          return;
        }
        saved = await addCustomFood({
          name: name.trim(),
          calories_per_100g: calories,
          protein_per_100g: Number(qP) || 0,
          carbs_per_100g: Number(qC) || 0,
          fat_per_100g: Number(qF) || 0,
          is_recipe: false,
        });
      } else {
        if (ingredients.length === 0) {
          setError("Add at least one ingredient.");
          setSaving(false);
          return;
        }
        saved = await addCustomFood({
          name: name.trim(),
          calories_per_100g: Math.round(per100.calories * 10) / 10,
          protein_per_100g: Math.round(per100.protein * 100) / 100,
          carbs_per_100g: Math.round(per100.carbs * 100) / 100,
          fat_per_100g: Math.round(per100.fat * 100) / 100,
          ingredients,
          total_grams: Math.round(totals.grams * 10) / 10,
          is_recipe: true,
        });
      }
      onSaved(saved);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:h-auto sm:max-h-[85vh] sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">
            Create custom food
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex shrink-0 border-b border-slate-200">
          {(["quick", "recipe"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={
                "flex-1 px-4 py-3 text-sm font-medium transition " +
                (mode === m
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50")
              }
            >
              {m === "quick" ? "Quick entry" : "Build recipe"}
            </button>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Name input */}
          <div className="mb-4">
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                mode === "recipe"
                  ? "e.g. My breakfast bowl"
                  : "e.g. Protein shake"
              }
              className="input"
            />
          </div>

          {mode === "quick" ? (
            <QuickEntryForm
              cals={qCals}
              setCals={setQCals}
              p={qP}
              setP={setQP}
              c={qC}
              setC={setQC}
              f={qF}
              setF={setQF}
            />
          ) : (
            <RecipeBuilder
              ingredients={ingredients}
              setIngredients={setIngredients}
              totals={totals}
              per100={per100}
              showAddIngredient={showAddIngredient}
              setShowAddIngredient={setShowAddIngredient}
            />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 px-4 py-3">
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save food
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Quick entry form
// ============================================================
interface QuickEntryProps {
  cals: string;
  setCals: (v: string) => void;
  p: string;
  setP: (v: string) => void;
  c: string;
  setC: (v: string) => void;
  f: string;
  setF: (v: string) => void;
}

function QuickEntryForm({ cals, setCals, p, setP, c, setC, f, setF }: QuickEntryProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Enter nutrition values per <strong>100 grams</strong>. You can find
        these on the food label.
      </p>
      <NumberField label="Calories" value={cals} onChange={setCals} unit="kcal" color="text-brand-600" />
      <NumberField label="Protein" value={p} onChange={setP} unit="g" color="text-emerald-600" />
      <NumberField label="Carbs" value={c} onChange={setC} unit="g" color="text-amber-600" />
      <NumberField label="Fat" value={f} onChange={setF} unit="g" color="text-violet-600" />
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  color: string;
}

function NumberField({ label, value, onChange, unit, color }: NumberFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <label className={`w-20 text-sm font-medium ${color}`}>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input flex-1 text-right"
        placeholder="0"
      />
      <span className="w-10 shrink-0 text-sm text-slate-500">{unit}</span>
    </div>
  );
}

// ============================================================
// Recipe builder
// ============================================================
interface RecipeBuilderProps {
  ingredients: RecipeIngredient[];
  setIngredients: (val: RecipeIngredient[]) => void;
  totals: { grams: number; calories: number; protein: number; carbs: number; fat: number };
  per100: { calories: number; protein: number; carbs: number; fat: number };
  showAddIngredient: boolean;
  setShowAddIngredient: (v: boolean) => void;
}

function RecipeBuilder({
  ingredients,
  setIngredients,
  totals,
  per100,
  showAddIngredient,
  setShowAddIngredient,
}: RecipeBuilderProps) {
  function removeIngredient(idx: number) {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Add ingredients — macros will be calculated automatically for the
        whole recipe and per 100g.
      </p>

      {/* Ingredients list */}
      <div className="space-y-2">
        {ingredients.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            No ingredients yet
          </p>
        )}
        {ingredients.map((ing, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-sm font-medium text-slate-800">
                  {ing.name}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {ing.grams}g
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {Math.round(ing.calories)} kcal · P {Math.round(ing.protein)}g
                · C {Math.round(ing.carbs)}g · F {Math.round(ing.fat)}g
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add ingredient button */}
      <button
        type="button"
        onClick={() => setShowAddIngredient(true)}
        className="btn-secondary w-full"
      >
        <Plus className="h-4 w-4" />
        Add ingredient
      </button>

      {/* Totals */}
      {ingredients.length > 0 && (
        <div className="space-y-3 rounded-lg bg-brand-50/60 p-3">
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              Whole recipe ({Math.round(totals.grams)}g total)
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <StatChip val={Math.round(totals.calories)} unit="kcal" cls="text-slate-900 font-bold" label="Total" />
              <StatChip val={Math.round(totals.protein)} unit="g" cls="text-emerald-700" label="Protein" />
              <StatChip val={Math.round(totals.carbs)} unit="g" cls="text-amber-700" label="Carbs" />
              <StatChip val={Math.round(totals.fat)} unit="g" cls="text-violet-700" label="Fat" />
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              Per 100g (saved values)
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <StatChip val={Math.round(per100.calories)} unit="kcal" cls="text-slate-900 font-bold" label="Calories" />
              <StatChip val={Math.round(per100.protein)} unit="g" cls="text-emerald-700" label="Protein" />
              <StatChip val={Math.round(per100.carbs)} unit="g" cls="text-amber-700" label="Carbs" />
              <StatChip val={Math.round(per100.fat)} unit="g" cls="text-violet-700" label="Fat" />
            </div>
          </div>
        </div>
      )}

      {/* Inline ingredient search */}
      {showAddIngredient && (
        <IngredientSearch
          onClose={() => setShowAddIngredient(false)}
          onAdd={(ing) => {
            setIngredients([...ingredients, ing]);
            setShowAddIngredient(false);
          }}
        />
      )}
    </div>
  );
}

function StatChip({ val, unit, cls, label }: { val: number; unit: string; cls: string; label: string }) {
  return (
    <div className="rounded bg-white p-1.5 shadow-sm">
      <div className={`tabular-nums ${cls}`}>{val}{unit}</div>
      <div className="text-slate-400">{label}</div>
    </div>
  );
}

// ============================================================
// Inline ingredient search (no logging, just selects)
// ============================================================
interface IngredientSearchProps {
  onClose: () => void;
  onAdd: (ing: RecipeIngredient) => void;
}

function IngredientSearch({ onClose, onAdd }: IngredientSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [qty, setQty] = useState(100);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const local = searchLocalFoods(q);
    setResults(local);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const remote = await searchRemoteFoods(q);
      const localNames = new Set(local.map((r) => r.product_name.toLowerCase()));
      setResults([
        ...local,
        ...remote.filter((r) => !localNames.has(r.product_name.toLowerCase())),
      ]);
      setLoading(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleAdd() {
    if (!selected) return;
    const factor = qty / 100;
    onAdd({
      name: selected.product_name,
      grams: qty,
      calories: selected.calories_per_100g * factor,
      protein: selected.protein_per_100g * factor,
      carbs: selected.carbs_per_100g * factor,
      fat: selected.fat_per_100g * factor,
    });
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-brand-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Add ingredient</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!selected ? (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search ingredient…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-9"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            )}
          </div>
          {results.length > 0 && (
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelected(r);
                    setQty(r.servings?.[0]?.grams ?? 100);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <span className="truncate text-sm text-slate-800">{r.product_name}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {Math.round(r.calories_per_100g)} kcal/100g
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-slate-900">{selected.product_name}</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-brand-600 hover:underline"
            >
              Change
            </button>
          </div>
          {selected.servings && selected.servings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.servings.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setQty(s.grams)}
                  className={
                    qty === s.grams
                      ? "rounded-full bg-brand-600 px-2.5 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Grams</label>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="input w-24 text-right"
            />
          </div>
          <button type="button" onClick={handleAdd} className="btn-primary w-full">
            <Plus className="h-4 w-4" />
            Add to recipe
          </button>
        </div>
      )}
    </div>
  );
}
