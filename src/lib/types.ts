export type HabitKey = "workout" | "trainer" | "steps_10k" | "clean_eating";

export interface DailyLog {
  date: string; // YYYY-MM-DD
  user_id: string;
  workout: boolean;
  trainer: boolean;
  steps_10k: boolean;
  clean_eating: boolean;
  notes: string | null;
  plank_seconds: number | null;
  updated_at: string;
}

export interface PRSession {
  date: string;
  maxWeight: number;
  sets: { set_number: number; weight_kg: number; reps: number }[];
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  is_preset: boolean;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface ExerciseSet {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  // Superset label copied from the schedule when loaded; groups exercises
  // performed back-to-back.
  superset_group: string | null;
  // A reduced-weight set performed straight after the working sets.
  is_drop_set: boolean;
  created_at: string;
}

export interface ExerciseSetWithExercise extends ExerciseSet {
  exercise: Pick<Exercise, "id" | "name" | "muscle_group">;
}

export const HABIT_LABELS: Record<HabitKey, string> = {
  workout: "Workout",
  trainer: "Trainer session",
  steps_10k: "10K steps",
  clean_eating: "Clean eating",
};

export const HABIT_COLORS: Record<HabitKey, string> = {
  workout: "#22c55e",
  trainer: "#a855f7",
  steps_10k: "#3b82f6",
  clean_eating: "#f59e0b",
};

export const HABIT_KEYS: HabitKey[] = [
  "workout",
  "trainer",
  "steps_10k",
  "clean_eating",
];

// ---------- User profile ----------
export interface UserProfile {
  user_id: string;
  display_name: string;
  partner_id: string | null;
  calories_goal?: number | null;
  protein_goal?: number | null;
  carbs_goal?: number | null;
  fat_goal?: number | null;
}

// ---------- Nutrition / food logs ----------
export interface FoodLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface FoodServing {
  label: string;
  grams: number;
}

export interface FoodSearchResult {
  product_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  servings?: FoodServing[];
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const DEFAULT_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

// ---------- Custom foods & recipes ----------
export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;  // total kcal for this ingredient amount
  protein: number;   // total g
  carbs: number;     // total g
  fat: number;       // total g
}

export interface CustomFood {
  id: string;
  user_id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  ingredients: RecipeIngredient[] | null;
  total_grams: number | null;
  is_recipe: boolean;
  created_at: string;
}

// ---------- Workout schedules ----------
export interface WorkoutSchedule {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface ScheduleExercise {
  id: string;
  schedule_id: string;
  exercise_id: string;
  position: number;
  set_count: number;
  default_reps: number;
  // Free-text label (e.g. "A") shared by exercises meant to be done
  // back-to-back as a superset. Null/empty = not part of a superset.
  superset_group: string | null;
  // Marks this exercise's final set as a drop set.
  is_drop_set: boolean;
  exercise?: Pick<Exercise, "id" | "name" | "muscle_group">;
}
