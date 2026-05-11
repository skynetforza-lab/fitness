import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addDays, format, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";
import MacroSummaryBar from "@/components/MacroSummaryBar";
import MealSection from "@/components/MealSection";
import NutritionGoalsModal from "@/components/NutritionGoalsModal";
import { fetchFoodLogs, fetchMyProfile } from "@/lib/db";
import { DEFAULT_GOALS } from "@/lib/types";
import type { FoodLog, NutritionGoals, UserProfile } from "@/lib/types";

const MEALS: { key: FoodLog["meal_type"]; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "🌅" },
  { key: "lunch", label: "Lunch", emoji: "☀️" },
  { key: "dinner", label: "Dinner", emoji: "🌙" },
  { key: "snack", label: "Snacks", emoji: "🍎" },
];

export default function NutritionPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showGoals, setShowGoals] = useState(false);

  const dateObj = useMemo(
    () => (date ? parseISO(date) : new Date()),
    [date],
  );
  const displayDate = format(dateObj, "EEE d MMM yyyy");

  const goals: NutritionGoals = {
    calories: profile?.calories_goal ?? DEFAULT_GOALS.calories,
    protein: profile?.protein_goal ?? DEFAULT_GOALS.protein,
    carbs: profile?.carbs_goal ?? DEFAULT_GOALS.carbs,
    fat: profile?.fat_goal ?? DEFAULT_GOALS.fat,
  };

  const totals = useMemo(
    () =>
      logs.reduce(
        (acc, l) => ({
          calories: acc.calories + l.calories,
          protein: acc.protein + l.protein_g,
          carbs: acc.carbs + l.carbs_g,
          fat: acc.fat + l.fat_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [logs],
  );

  async function load() {
    if (!date) return;
    const [foodLogs, myProfile] = await Promise.all([
      fetchFoodLogs(date),
      fetchMyProfile(),
    ]);
    setLogs(foodLogs);
    setProfile(myProfile);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function navigateDay(delta: number) {
    const next = delta > 0 ? addDays(dateObj, 1) : subDays(dateObj, 1);
    navigate(`/nutrition/${format(next, "yyyy-MM-dd")}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
      {/* Date header */}
      <div className="card flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => navigateDay(-1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold text-slate-900">
          {displayDate}
        </h1>
        <button
          type="button"
          onClick={() => navigateDay(1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowGoals(true)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          title="Set daily goals"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Macro summary */}
      <MacroSummaryBar totals={totals} goals={goals} />

      {/* Meal sections */}
      {MEALS.map(({ key, label, emoji }) => (
        <MealSection
          key={key}
          mealType={key}
          label={label}
          emoji={emoji}
          items={logs.filter((l) => l.meal_type === key)}
          date={date ?? format(new Date(), "yyyy-MM-dd")}
          onRefresh={load}
        />
      ))}

      {/* Goals modal */}
      {showGoals && (
        <NutritionGoalsModal
          current={goals}
          onClose={() => setShowGoals(false)}
          onSaved={(newGoals) => {
            setProfile((p) =>
              p
                ? {
                    ...p,
                    calories_goal: newGoals.calories,
                    protein_goal: newGoals.protein,
                    carbs_goal: newGoals.carbs,
                    fat_goal: newGoals.fat,
                  }
                : null,
            );
            setShowGoals(false);
          }}
        />
      )}
    </div>
  );
}
