import { supabase } from "./supabase";
import type {
  DailyLog,
  Exercise,
  ExerciseSet,
  ExerciseSetWithExercise,
  HabitKey,
  WorkoutSession,
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
  patch: Partial<Pick<DailyLog, HabitKey | "notes">>,
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
