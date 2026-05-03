import type { ExerciseSet } from "./types";

// Epley 1RM: weight * (1 + reps/30)
export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export interface ExercisePRs {
  maxWeight: number;
  maxReps: number;
  maxE1RM: number;
}

export function computePRs(sets: ExerciseSet[]): ExercisePRs {
  let maxWeight = 0;
  let maxReps = 0;
  let maxE1RM = 0;
  for (const s of sets) {
    if (s.weight_kg > maxWeight) maxWeight = s.weight_kg;
    if (s.reps > maxReps) maxReps = s.reps;
    const e = epley1RM(s.weight_kg, s.reps);
    if (e > maxE1RM) maxE1RM = e;
  }
  return { maxWeight, maxReps, maxE1RM };
}

// Best e1RM per date for charting progression.
export function dailyBestE1RM(
  sets: (ExerciseSet & { date: string })[],
): { date: string; e1rm: number }[] {
  const byDate = new Map<string, number>();
  for (const s of sets) {
    const e = epley1RM(s.weight_kg, s.reps);
    const cur = byDate.get(s.date) ?? 0;
    if (e > cur) byDate.set(s.date, e);
  }
  return Array.from(byDate.entries())
    .map(([date, e1rm]) => ({ date, e1rm: Math.round(e1rm * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
