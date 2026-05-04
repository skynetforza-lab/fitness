export type HabitKey = "workout" | "trainer" | "steps_10k" | "clean_eating";

export interface DailyLog {
  date: string; // YYYY-MM-DD
  user_id: string;
  workout: boolean;
  trainer: boolean;
  steps_10k: boolean;
  clean_eating: boolean;
  notes: string | null;
  updated_at: string;
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
  exercise?: Pick<Exercise, "id" | "name" | "muscle_group">;
}
