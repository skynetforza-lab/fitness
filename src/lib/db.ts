import { supabase } from "./supabase";
import type {
  CustomFood,
  DailyLog,
  Exercise,
  ExerciseSet,
  ExerciseSetWithExercise,
  FoodLog,
  HabitKey,
  PRSession,
  RecipeIngredient,
  WorkoutSession,
  WorkoutSchedule,
  ScheduleExercise,
  UserProfile,
} from "./types";

async function uid(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

// ---------- daily_logs ----------
export async function fetchDailyLogs(
  fromISO: string,
  toISO: string,
): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("date", fromISO)
    .lte("date", toISO)
    .order("date");
  if (error) throw error;
  return data as DailyLog[];
}

export async function fetchAllDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("date");
  if (error) throw error;
  return data as DailyLog[];
}

export async function fetchDailyLog(dateISO: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("date", dateISO)
    .maybeSingle();
  if (error) throw error;
  return data as DailyLog | null;
}

export async function upsertDailyLog(
  dateISO: string,
  patch: Partial<Pick<DailyLog, HabitKey | "notes" | "plank_seconds">>,
): Promise<DailyLog> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(
      { date: dateISO, user_id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id,date" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as DailyLog;
}

/**
 * Marks the "workout" habit as true for the given date without disturbing
 * other habits. No-op if it's already true. Called automatically when a
 * set is logged so the user doesn't have to tick the box manually.
 */
export async function markWorkoutDone(dateISO: string): Promise<void> {
  const existing = await fetchDailyLog(dateISO);
  if (existing?.workout) return;
  await upsertDailyLog(dateISO, {
    workout: true,
    trainer: existing?.trainer ?? false,
    steps_10k: existing?.steps_10k ?? false,
    clean_eating: existing?.clean_eating ?? false,
  });
}

// ---------- exercises ----------
export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group")
    .order("name");
  if (error) throw error;
  return data as Exercise[];
}

export async function createExercise(
  name: string,
  muscle_group: string,
): Promise<Exercise> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name: name.trim(), muscle_group, is_preset: false, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as Exercise;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

// ---------- workout sessions + sets ----------
export async function getOrCreateSession(
  dateISO: string,
): Promise<WorkoutSession> {
  const user_id = await uid();
  const existing = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("date", dateISO)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as WorkoutSession;
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ date: dateISO, user_id })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSession;
}

export async function fetchSetsForDate(
  dateISO: string,
): Promise<ExerciseSetWithExercise[]> {
  const { data, error } = await supabase
    .from("exercise_sets")
    .select(
      "*, workout_sessions!inner(date), exercise:exercises(id, name, muscle_group)",
    )
    .eq("workout_sessions.date", dateISO)
    .order("set_number");
  if (error) throw error;
  return (data ?? []) as unknown as ExerciseSetWithExercise[];
}

export async function fetchSetsForExercise(
  exerciseId: string,
): Promise<(ExerciseSet & { date: string })[]> {
  const { data, error } = await supabase
    .from("exercise_sets")
    .select("*, workout_sessions!inner(date)")
    .eq("exercise_id", exerciseId)
    .order("created_at");
  if (error) throw error;
  type Row = ExerciseSet & { workout_sessions: { date: string } };
  return (data as unknown as Row[]).map((r) => ({
    ...r,
    date: r.workout_sessions.date,
  }));
}

export async function addSet(input: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}): Promise<ExerciseSet> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("exercise_sets")
    .insert({
      user_id,
      session_id: input.sessionId,
      exercise_id: input.exerciseId,
      set_number: input.setNumber,
      weight_kg: input.weightKg,
      reps: input.reps,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ExerciseSet;
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from("exercise_sets").delete().eq("id", id);
  if (error) throw error;
}

export async function updateSet(
  id: string,
  patch: { weightKg?: number; reps?: number },
): Promise<ExerciseSet> {
  const update: Record<string, number> = {};
  if (patch.weightKg !== undefined) update.weight_kg = patch.weightKg;
  if (patch.reps !== undefined) update.reps = patch.reps;
  const { data, error } = await supabase
    .from("exercise_sets")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ExerciseSet;
}

// ---------- Workout schedules ----------

export async function fetchSchedules(): Promise<WorkoutSchedule[]> {
  const { data, error } = await supabase
    .from("workout_schedules")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data as WorkoutSchedule[];
}

export async function createSchedule(name: string): Promise<WorkoutSchedule> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("workout_schedules")
    .insert({ name: name.trim(), user_id })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSchedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase
    .from("workout_schedules")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function fetchScheduleExercises(
  scheduleId: string,
): Promise<ScheduleExercise[]> {
  const { data, error } = await supabase
    .from("schedule_exercises")
    .select("*, exercise:exercises(id, name, muscle_group)")
    .eq("schedule_id", scheduleId)
    .order("position");
  if (error) throw error;
  return data as unknown as ScheduleExercise[];
}

export async function addScheduleExercise(
  scheduleId: string,
  exerciseId: string,
  setCount: number,
  defaultReps: number,
  position: number,
): Promise<ScheduleExercise> {
  const { data, error } = await supabase
    .from("schedule_exercises")
    .insert({
      schedule_id: scheduleId,
      exercise_id: exerciseId,
      set_count: setCount,
      default_reps: defaultReps,
      position,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ScheduleExercise;
}

export async function removeScheduleExercise(id: string): Promise<void> {
  const { error } = await supabase
    .from("schedule_exercises")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/**
 * Returns the sets from the most recent session this exercise was performed in,
 * sorted by set_number ascending. Used to prefill schedule loads.
 */
export async function fetchLastWorkoutSets(
  exerciseId: string,
): Promise<{ set_number: number; weight_kg: number; reps: number }[]> {
  const all = await fetchSetsForExercise(exerciseId);
  if (all.length === 0) return [];
  // Find most recent date
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const latestDate = sorted[0].date;
  return sorted
    .filter((s) => s.date === latestDate)
    .sort((a, b) => a.set_number - b.set_number)
    .map(({ set_number, weight_kg, reps }) => ({ set_number, weight_kg, reps }));
}

// ---------- User profiles ----------

export async function fetchMyProfile(): Promise<UserProfile | null> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

export async function upsertMyProfile(
  displayName: string,
  partnerId: string | null,
): Promise<UserProfile> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      { user_id, display_name: displayName.trim(), partner_id: partnerId || null },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

export async function upsertNutritionGoals(goals: {
  calories_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
}): Promise<void> {
  const user_id = await uid();
  const { error } = await supabase
    .from("user_profiles")
    .upsert({ user_id, ...goals }, { onConflict: "user_id" });
  if (error) throw error;
}

// ---------- Food logs ----------

export async function fetchFoodLogs(dateISO: string): Promise<FoodLog[]> {
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("date", dateISO)
    .order("created_at");
  if (error) throw error;
  return data as FoodLog[];
}

export async function addFoodLog(entry: {
  date: string;
  meal_type: FoodLog["meal_type"];
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}): Promise<FoodLog> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("food_logs")
    .insert({ user_id, ...entry })
    .select()
    .single();
  if (error) throw error;
  return data as FoodLog;
}

export async function deleteFoodLog(id: string): Promise<void> {
  const { error } = await supabase.from("food_logs").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Custom foods & recipes ----------

export async function fetchCustomFoods(): Promise<CustomFood[]> {
  const { data, error } = await supabase
    .from("custom_foods")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CustomFood[];
}

export async function addCustomFood(input: {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  ingredients?: RecipeIngredient[];
  total_grams?: number;
  is_recipe?: boolean;
}): Promise<CustomFood> {
  const user_id = await uid();
  const { data, error } = await supabase
    .from("custom_foods")
    .insert({
      user_id,
      name: input.name.trim(),
      calories_per_100g: input.calories_per_100g,
      protein_per_100g: input.protein_per_100g,
      carbs_per_100g: input.carbs_per_100g,
      fat_per_100g: input.fat_per_100g,
      ingredients: input.ingredients ?? null,
      total_grams: input.total_grams ?? null,
      is_recipe: input.is_recipe ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as CustomFood;
}

export async function deleteCustomFood(id: string): Promise<void> {
  const { error } = await supabase.from("custom_foods").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Save workout as schedule ----------

/**
 * Creates a new schedule from the workout logged on `dateISO`. Groups sets
 * by exercise (preserving the order each exercise first appeared), uses
 * set count + mode reps to populate schedule_exercises.
 */
export async function createScheduleFromDate(
  name: string,
  dateISO: string,
): Promise<WorkoutSchedule> {
  const sets = await fetchSetsForDate(dateISO);
  if (sets.length === 0) throw new Error("No sets logged for this date.");

  // Group by exercise, preserving the order each exercise first appeared.
  const order: string[] = [];
  const groups = new Map<string, { reps: number[]; lastReps: number }>();
  for (const s of sets) {
    if (!groups.has(s.exercise_id)) {
      order.push(s.exercise_id);
      groups.set(s.exercise_id, { reps: [], lastReps: s.reps });
    }
    const g = groups.get(s.exercise_id)!;
    g.reps.push(s.reps);
    g.lastReps = s.reps;
  }

  const schedule = await createSchedule(name);

  for (let i = 0; i < order.length; i++) {
    const exerciseId = order[i];
    const g = groups.get(exerciseId)!;
    // Mode reps (most common value); ties fall back to lastReps
    const counts = new Map<number, number>();
    for (const r of g.reps) counts.set(r, (counts.get(r) ?? 0) + 1);
    let modeReps = g.lastReps;
    let modeCount = 0;
    for (const [r, c] of counts) {
      if (c > modeCount) { modeReps = r; modeCount = c; }
    }
    await addScheduleExercise(schedule.id, exerciseId, g.reps.length, modeReps, i);
  }

  return schedule;
}

// ---------- Exercise PR session ----------

/**
 * Returns the workout session that contained the heaviest lift for this
 * exercise, along with all sets from that session sorted by set_number.
 * Ties on weight → most recent date wins.
 */
export async function fetchExercisePRSession(
  exerciseId: string,
): Promise<PRSession | null> {
  const all = await fetchSetsForExercise(exerciseId);
  if (all.length === 0) return null;

  // Find the heaviest set (ties → most recent date)
  let best = all[0];
  for (const s of all) {
    if (
      s.weight_kg > best.weight_kg ||
      (s.weight_kg === best.weight_kg && s.date > best.date)
    ) {
      best = s;
    }
  }

  const prSets = all
    .filter((s) => s.date === best.date)
    .sort((a, b) => a.set_number - b.set_number)
    .map(({ set_number, weight_kg, reps }) => ({ set_number, weight_kg, reps }));

  return {
    date: best.date,
    maxWeight: best.weight_kg,
    sets: prSets,
  };
}

export async function fetchProfileForUser(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

// ---------- Cross-user comparison data (partner RLS must be enabled) ----------

export async function fetchAllDailyLogsForUser(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date");
  if (error) throw error;
  return data as DailyLog[];
}

export async function fetchWorkoutSessionsForUser(
  userId: string,
): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date");
  if (error) throw error;
  return data as WorkoutSession[];
}

export interface ExercisePRRow {
  exercise_id: string;
  name: string;
  muscle_group: string;
  max_weight: number;
  max_reps: number;
}

export async function fetchExercisePRsForUser(
  userId: string,
): Promise<ExercisePRRow[]> {
  const { data, error } = await supabase
    .from("exercise_sets")
    .select("exercise_id, weight_kg, reps, exercise:exercises(name, muscle_group)")
    .eq("user_id", userId);
  if (error) throw error;

  type Row = ExerciseSet & { exercise: Pick<Exercise, "name" | "muscle_group"> };
  const rows = data as unknown as Row[];

  const map = new Map<
    string,
    { name: string; muscle_group: string; max_weight: number; max_reps: number }
  >();
  for (const r of rows) {
    const existing = map.get(r.exercise_id);
    if (!existing) {
      map.set(r.exercise_id, {
        name: r.exercise.name,
        muscle_group: r.exercise.muscle_group,
        max_weight: r.weight_kg,
        max_reps: r.reps,
      });
    } else {
      if (r.weight_kg > existing.max_weight) existing.max_weight = r.weight_kg;
      if (r.reps > existing.max_reps) existing.max_reps = r.reps;
    }
  }

  return Array.from(map.entries())
    .map(([exercise_id, v]) => ({ exercise_id, ...v }))
    .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name));
}
