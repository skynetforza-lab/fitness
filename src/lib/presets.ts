// Preset list mirrors what supabase/schema.sql seeds. Used as a fallback
// for the muscle-group dropdown when adding a custom exercise.
export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Cardio",
  "Other",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
