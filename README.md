# Fitness Tracker

A personal fitness tracker (Fitbod-inspired) with:

- **Calendar** — daily check-ins for 4 habits: workout, trainer session, 10K steps, clean eating. Schedule starts **4 May 2026**.
- **Workout logger** — log exercises set-by-set (weight × reps). Exercise list comes pre-loaded with common lifts; add your own and they appear in the dropdown.
- **Personal bests** — auto-detected per exercise (max weight, max reps, best estimated 1RM via Epley). PR badge flashes on the set that beat them.
- **Stats**:
  - Summary cards per habit: this week, this month, cumulative since 4 May 2026, missed days, and progress toward the 2026 target (242 days).
  - Pie charts of habit consistency over a selectable date range.
  - Line chart of best-set est. 1RM over time, per exercise.

## Stack

React 18 + Vite + TypeScript • Tailwind CSS • Recharts • Supabase (Postgres + Auth) • date-fns • react-router-dom

## Setup

### 1. Create a Supabase project

1. Go to <https://supabase.com> and create a new project.
2. In the SQL editor, run the contents of `supabase/schema.sql`. This creates the four tables, RLS policies, and seeds the preset exercise list.
3. Go to **Authentication → Users → Add user** and create yourself a single user with email + password (this is a single-user app).

### 2. Configure env vars

```bash
cp .env.example .env.local
```

Fill in:

- `VITE_SUPABASE_URL` — `Project Settings → API → Project URL`
- `VITE_SUPABASE_ANON_KEY` — `Project Settings → API → anon public key`

### 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>, sign in with the user you created.

## Deploy to Vercel

1. Push this repo to GitHub (the `claude/fitness-tracker-app-4IBNX` branch).
2. Import the repo in Vercel.
3. Set the two `VITE_SUPABASE_*` environment variables in the Vercel project settings.
4. Deploy. Vercel auto-detects Vite and runs `npm run build`.

## Project layout

```
src/
  lib/         # supabase client, db helpers, PR math, habit stats
  components/  # CalendarView, WorkoutLogger, charts, etc.
  pages/       # routed pages (Login, Calendar, Workout, Exercises, Stats)
supabase/
  schema.sql   # tables, RLS, preset exercise seed
```

## Notes

- The calendar disables days before 4 May 2026 and after today.
- Adding a custom exercise from the workout logger inserts it into your library so it appears in the dropdown forever after.
- Deleting a custom exercise is blocked while sets reference it (FK is `on delete restrict`). Delete the sets first, or just leave the exercise.
