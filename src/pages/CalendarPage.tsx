import { useEffect, useMemo, useState } from "react";
import {
  endOfMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Dumbbell, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import AgendaView from "@/components/AgendaView";
import CalendarView from "@/components/CalendarView";
import DayDetailDialog from "@/components/DayDetailDialog";
import {
  fetchCaloriesByDateInRange,
  fetchDailyLogs,
  fetchMyProfile,
  fetchWorkoutDatesInRange,
  upsertDailyLog,
} from "@/lib/db";
import { SCHEDULE_START, toISODate } from "@/lib/dates";
import { DEFAULT_GOALS } from "@/lib/types";
import type { DailyLog, HabitKey } from "@/lib/types";

export default function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<Date>(() =>
    today < SCHEDULE_START ? SCHEDULE_START : today,
  );
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [caloriesByDate, setCaloriesByDate] = useState<Map<string, number>>(
    new Map(),
  );
  const [caloriesGoal, setCaloriesGoal] = useState<number>(DEFAULT_GOALS.calories);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Grid view needs the week-padded range; agenda only needs the month itself.
  const gridFromISO = toISODate(
    startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
  );
  const gridToISO = toISODate(
    endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  );
  const monthFromISO = toISODate(startOfMonth(month));
  const monthToISO = toISODate(endOfMonth(month));

  // Daily habits cover the wider grid range (for desktop)
  useEffect(() => {
    fetchDailyLogs(gridFromISO, gridToISO).then(setLogs);
  }, [gridFromISO, gridToISO]);

  // Workout sessions + calories cover the month range (for agenda)
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchWorkoutDatesInRange(monthFromISO, monthToISO),
      fetchCaloriesByDateInRange(monthFromISO, monthToISO),
    ]).then(([dates, cals]) => {
      if (cancelled) return;
      setWorkoutDates(dates);
      setCaloriesByDate(cals);
    });
    return () => {
      cancelled = true;
    };
  }, [monthFromISO, monthToISO]);

  // User's calorie goal — load once on mount
  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        if (p?.calories_goal) setCaloriesGoal(p.calories_goal);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const logsByDate = useMemo(() => {
    const m = new Map<string, DailyLog>();
    for (const l of logs) m.set(l.date, l);
    return m;
  }, [logs]);

  const selectedLog = selectedDate
    ? logsByDate.get(toISODate(selectedDate)) ?? null
    : null;

  async function handleToggle(habit: HabitKey, next: boolean) {
    if (!selectedDate) return;
    const iso = toISODate(selectedDate);
    const existing = logsByDate.get(iso);
    const updated = await upsertDailyLog(iso, {
      workout: existing?.workout ?? false,
      trainer: existing?.trainer ?? false,
      steps_10k: existing?.steps_10k ?? false,
      clean_eating: existing?.clean_eating ?? false,
      [habit]: next,
    });
    setLogs((prev) => {
      const without = prev.filter((l) => l.date !== iso);
      return [...without, updated];
    });
  }

  const todayISO = toISODate(today);
  const canLogToday = today >= SCHEDULE_START;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-4">
      <div className="card flex items-start justify-between gap-3 p-4">
        <div>
          <h1 className="text-xl font-semibold">Your fitness calendar</h1>
          <p className="text-sm text-slate-600">
            Schedule starts <strong>18 May 2026</strong>. Tap a day to mark your
            habits and log a workout.
          </p>
        </div>
        {canLogToday && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <Link
              to={`/workout/${todayISO}`}
              className="btn-primary whitespace-nowrap"
            >
              <Dumbbell className="h-4 w-4" />
              Log workout
            </Link>
            <Link
              to={`/nutrition/${todayISO}`}
              className="btn-secondary whitespace-nowrap"
            >
              <Utensils className="h-4 w-4" />
              Log food
            </Link>
          </div>
        )}
      </div>

      {/* Mobile: agenda list */}
      <div className="sm:hidden">
        <AgendaView
          month={month}
          setMonth={setMonth}
          logsByDate={logsByDate}
          workoutDates={workoutDates}
          caloriesByDate={caloriesByDate}
          caloriesGoal={caloriesGoal}
          onSelectDate={setSelectedDate}
          today={today}
        />
      </div>

      {/* Desktop: grid */}
      <div className="hidden sm:block">
        <CalendarView
          month={month}
          setMonth={setMonth}
          logsByDate={logsByDate}
          onSelectDate={setSelectedDate}
          onToggleHabit={async (iso, habit, next) => {
            const existing = logsByDate.get(iso);
            const updated = await upsertDailyLog(iso, {
              workout: existing?.workout ?? false,
              trainer: existing?.trainer ?? false,
              steps_10k: existing?.steps_10k ?? false,
              clean_eating: existing?.clean_eating ?? false,
              [habit]: next,
            });
            setLogs((prev) => {
              const without = prev.filter((l) => l.date !== iso);
              return [...without, updated];
            });
          }}
          today={today}
        />
      </div>

      <DayDetailDialog
        date={selectedDate}
        log={selectedLog}
        onClose={() => setSelectedDate(null)}
        onToggle={handleToggle}
        onSavePlank={async (seconds) => {
          if (!selectedDate) return;
          const iso = toISODate(selectedDate);
          const existing = logsByDate.get(iso);
          const updated = await upsertDailyLog(iso, {
            workout: existing?.workout ?? false,
            trainer: existing?.trainer ?? false,
            steps_10k: existing?.steps_10k ?? false,
            clean_eating: existing?.clean_eating ?? false,
            plank_seconds: seconds,
          });
          setLogs((prev) => {
            const without = prev.filter((l) => l.date !== iso);
            return [...without, updated];
          });
        }}
      />
    </div>
  );
}
