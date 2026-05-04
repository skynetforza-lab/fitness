import type { ExerciseSet } from "./types";

export interface ExercisePRs {
  maxWeight: number;
  maxReps: number;
}

export function computePRs(sets: ExerciseSet[]): ExercisePRs {
  let maxWeight = 0;
  let maxReps = 0;
  for (const s of sets) {
    if (s.weight_kg > maxWeight) maxWeight = s.weight_kg;
    if (s.reps > maxReps) maxReps = s.reps;
  }
  return { maxWeight, maxReps };
}

/** Best weight per session date, for the progression chart. */
export function dailyBestWeight(
  sets: (ExerciseSet & { date: string })[],
): { date: string; weight: number }[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const cur = byDate.get(s.date) ?? 0;
    if (s.weight_kg > cur) byDate.set(s.date, s.weight_kg);
  }
  return Array.from(byDate.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
