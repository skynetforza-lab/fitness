-- Fitness Tracker schema
-- Run this in the Supabase SQL editor for your project.
-- All tables are owned by auth.users via user_id and protected by RLS.

create extension if not exists "pgcrypto";

-- Daily habit log (one row per calendar day)
create table if not exists public.daily_logs (
  date          date not null,
  user_id       uuid not null references auth.users(id) on delete cascade,
  workout       boolean not null default false,
  trainer       boolean not null default false,
  steps_10k     boolean not null default false,
  clean_eating  boolean not null default false,
  notes         text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, date)
);

-- Exercise library (presets seeded; user can add their own)
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  muscle_group  text not null,
  is_preset     boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists exercises_user_idx on public.exercises (user_id);
create index if not exists exercises_preset_idx on public.exercises (is_preset);
create unique index if not exists exercises_preset_name_uniq
  on public.exercises (name) where is_preset = true;

-- Workout sessions (one per date you log sets)
create table if not exists public.workout_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

-- Individual sets within a session
create table if not exists public.exercise_sets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete restrict,
  set_number   int not null,
  weight_kg    numeric(6,2) not null default 0,
  reps         int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists sets_user_idx on public.exercise_sets (user_id);
create index if not exists sets_exercise_idx on public.exercise_sets (exercise_id);
create index if not exists sets_session_idx on public.exercise_sets (session_id);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.daily_logs        enable row level security;
alter table public.exercises         enable row level security;
alter table public.workout_sessions  enable row level security;
alter table public.exercise_sets     enable row level security;

-- daily_logs: owner-only
drop policy if exists "daily_logs_owner" on public.daily_logs;
create policy "daily_logs_owner" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- exercises: presets visible to everyone; custom visible to owner AND linked partner
drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises
  for select using (
    is_preset = true
    or auth.uid() = user_id
    or exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.partner_id = exercises.user_id
    )
  );

drop policy if exists "exercises_insert" on public.exercises;
create policy "exercises_insert" on public.exercises
  for insert with check (auth.uid() = user_id and is_preset = false);

drop policy if exists "exercises_update" on public.exercises;
create policy "exercises_update" on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercises_delete" on public.exercises;
create policy "exercises_delete" on public.exercises
  for delete using (auth.uid() = user_id);

-- workout_sessions: owner-only
drop policy if exists "sessions_owner" on public.workout_sessions;
create policy "sessions_owner" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- exercise_sets: owner-only
drop policy if exists "sets_owner" on public.exercise_sets;
create policy "sets_owner" on public.exercise_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Preset exercise seed (idempotent)
-- ---------------------------------------------------------------
insert into public.exercises (name, muscle_group, is_preset, user_id) values
  ('Bench Press',          'Chest',     true, null),
  ('Incline DB Press',     'Chest',     true, null),
  ('Push-up',              'Chest',     true, null),
  ('Cable Fly',            'Chest',     true, null),
  ('Deadlift',             'Back',      true, null),
  ('Barbell Row',          'Back',      true, null),
  ('Pull-up',              'Back',      true, null),
  ('Lat Pulldown',         'Back',      true, null),
  ('Back Squat',           'Legs',      true, null),
  ('Leg Press',            'Legs',      true, null),
  ('Romanian Deadlift',    'Legs',      true, null),
  ('Lunge',                'Legs',      true, null),
  ('Leg Curl',             'Legs',      true, null),
  ('Overhead Press',       'Shoulders', true, null),
  ('Lateral Raise',        'Shoulders', true, null),
  ('Face Pull',            'Shoulders', true, null),
  ('Barbell Curl',         'Arms',      true, null),
  ('Tricep Pushdown',      'Arms',      true, null),
  ('Hammer Curl',          'Arms',      true, null),
  ('Skullcrusher',         'Arms',      true, null),
  ('Plank',                'Core',      true, null),
  ('Hanging Leg Raise',    'Core',      true, null),
  ('Cable Crunch',         'Core',      true, null)
on conflict (name) where is_preset = true do nothing;

-- ---------------------------------------------------------------
-- Workout schedules (named day templates)
-- ---------------------------------------------------------------

create table if not exists public.workout_schedules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Exercises that belong to a schedule (ordered by position)
create table if not exists public.schedule_exercises (
  id           uuid primary key default gen_random_uuid(),
  schedule_id  uuid not null references public.workout_schedules(id) on delete cascade,
  exercise_id  uuid not null references public.exercises(id) on delete cascade,
  position     int not null default 0,
  set_count    int not null default 3,
  default_reps int not null default 10
);

create index if not exists sch_exercises_schedule_idx on public.schedule_exercises (schedule_id);

-- RLS
alter table public.workout_schedules  enable row level security;
alter table public.schedule_exercises enable row level security;

drop policy if exists "schedules_owner" on public.workout_schedules;
create policy "schedules_owner" on public.workout_schedules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sch_exercises_owner" on public.schedule_exercises;
create policy "sch_exercises_owner" on public.schedule_exercises
  for all using (
    exists (
      select 1 from public.workout_schedules ws
      where ws.id = schedule_id and ws.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- User profiles + partner comparison
-- ---------------------------------------------------------------

create table if not exists public.user_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Me',
  partner_id    uuid references auth.users(id) on delete set null
);

alter table public.user_profiles enable row level security;

-- Anyone authenticated can read profiles (only display_name is stored)
drop policy if exists "profiles_read" on public.user_profiles;
create policy "profiles_read" on public.user_profiles
  for select using (auth.role() = 'authenticated');

-- Only owner can write their own profile
drop policy if exists "profiles_write" on public.user_profiles;
create policy "profiles_write" on public.user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Relax RLS on daily_logs, workout_sessions, exercise_sets
-- to allow a linked partner to read each other's data
-- ---------------------------------------------------------------

-- Helper: returns true if the requesting user has linked `target_user_id` as their partner
-- (one-directional: if YOU set THEM as partner, you can read their data)

-- daily_logs: split owner-all into write-owner + select-owner-or-partner
drop policy if exists "daily_logs_owner" on public.daily_logs;

create policy "daily_logs_owner_write" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_logs_partner_read" on public.daily_logs
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.partner_id = daily_logs.user_id
    )
  );

-- workout_sessions: split owner-all + partner select
drop policy if exists "sessions_owner" on public.workout_sessions;

create policy "sessions_owner_write" on public.workout_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_partner_read" on public.workout_sessions
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.partner_id = workout_sessions.user_id
    )
  );

-- exercise_sets: split owner-all + partner select
drop policy if exists "sets_owner" on public.exercise_sets;

create policy "sets_owner_write" on public.exercise_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sets_partner_read" on public.exercise_sets
  for select using (
    exists (
      select 1 from public.user_profiles up
      where up.user_id = auth.uid() and up.partner_id = exercise_sets.user_id
    )
  );

-- ---------------------------------------------------------------
-- Nutrition tracking: daily calorie & macro goals on user_profiles
-- ---------------------------------------------------------------
alter table public.user_profiles
  add column if not exists calories_goal int,
  add column if not exists protein_goal  int,
  add column if not exists carbs_goal    int,
  add column if not exists fat_goal      int;

-- ---------------------------------------------------------------
-- Food logs (nutrition diary)
-- ---------------------------------------------------------------
create table if not exists public.food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  meal_type   text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name   text not null,
  quantity    numeric(8,2) not null default 100,
  unit        text not null default 'g',
  calories    numeric(8,1) not null,
  protein_g   numeric(8,2) not null default 0,
  carbs_g     numeric(8,2) not null default 0,
  fat_g       numeric(8,2) not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists food_logs_user_date on public.food_logs (user_id, date);

alter table public.food_logs enable row level security;

drop policy if exists "food_logs_owner" on public.food_logs;
create policy "food_logs_owner" on public.food_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Custom foods (user-created foods + recipes)
-- ---------------------------------------------------------------
create table if not exists public.custom_foods (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  calories_per_100g numeric(8,1) not null,
  protein_per_100g  numeric(8,2) not null default 0,
  carbs_per_100g    numeric(8,2) not null default 0,
  fat_per_100g      numeric(8,2) not null default 0,
  ingredients       jsonb,        -- [{name, grams, calories, protein, carbs, fat}, ...]
  total_grams       numeric(8,1), -- total weight of the recipe (when is_recipe = true)
  is_recipe         boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists custom_foods_user_idx on public.custom_foods (user_id);

alter table public.custom_foods enable row level security;

drop policy if exists "custom_foods_owner" on public.custom_foods;
create policy "custom_foods_owner" on public.custom_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
