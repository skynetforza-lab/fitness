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

-- exercises: presets visible to everyone, custom visible only to owner
drop policy if exists "exercises_select" on public.exercises;
create policy "exercises_select" on public.exercises
  for select using (is_preset = true or auth.uid() = user_id);

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
