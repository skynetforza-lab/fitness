import { useEffect, useMemo, useState } from "react";
import { Copy, Loader2, Settings2, Trophy } from "lucide-react";
import {
  fetchMyProfile,
  upsertMyProfile,
  fetchProfileForUser,
  fetchAllDailyLogsForUser,
  fetchWorkoutSessionsForUser,
  fetchExercisePRsForUser,
  type ExercisePRRow,
} from "@/lib/db";
import { summarise } from "@/lib/habitStats";
import { HABIT_COLORS, HABIT_KEYS, HABIT_LABELS } from "@/lib/types";
import type { DailyLog, UserProfile, WorkoutSession } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

// ─── helpers ────────────────────────────────────────────────────────────────

function Leader({
  mine,
  theirs,
  higherIsBetter = true,
}: {
  mine: number;
  theirs: number;
  higherIsBetter?: boolean;
}) {
  const diff = mine - theirs;
  if (diff === 0) return <span className="text-xs text-slate-400">Tied</span>;
  const meWins = higherIsBetter ? diff > 0 : diff < 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        meWins ? "text-brand-600" : "text-purple-600",
      )}
    >
      <Trophy className="h-3 w-3" />
      {meWins ? "You" : "Partner"} +{Math.abs(diff)}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h2>
  );
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function SetupPanel({
  myId,
  existing,
  onSaved,
}: {
  myId: string;
  existing: UserProfile | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(existing?.display_name ?? "");
  const [partnerId, setPartnerId] = useState(existing?.partner_id ?? "");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await upsertMyProfile(name.trim(), partnerId.trim() || null);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copyId() {
    navigator.clipboard.writeText(myId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card mx-auto max-w-md p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Set up comparison</h2>
        <p className="mt-1 text-sm text-slate-600">
          Share your User ID with your training partner. Ask them to paste it
          into their Compare setup, and paste theirs below.
        </p>
      </div>

      {/* My ID */}
      <div>
        <label className="label">Your User ID (share this)</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={myId}
            className="input flex-1 font-mono text-xs"
          />
          <button type="button" onClick={copyId} className="btn-ghost px-3">
            <Copy className="h-4 w-4" />
            <span className="ml-1 text-xs">{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label">Your display name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Samarth"
          />
        </div>
        <div>
          <label className="label">Partner's User ID</label>
          <input
            className="input font-mono text-xs"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            placeholder="Paste your partner's User ID here"
          />
          <p className="mt-1 text-xs text-slate-400">
            Leave blank to view your own stats only.
          </p>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="btn-primary w-full"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save &amp; compare
        </button>
      </form>
    </div>
  );
}

// ─── Comparison view ─────────────────────────────────────────────────────────

interface CompareData {
  myProfile: UserProfile;
  partnerProfile: UserProfile | null;
  myLogs: DailyLog[];
  partnerLogs: DailyLog[];
  mySessions: WorkoutSession[];
  partnerSessions: WorkoutSession[];
  myPRs: ExercisePRRow[];
  partnerPRs: ExercisePRRow[];
}

function CompareView({
  data,
  onSetup,
}: {
  data: CompareData;
  onSetup: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const partnerName = data.partnerProfile?.display_name ?? "Partner";

  // Habit summaries
  const myHabits = useMemo(
    () => HABIT_KEYS.map((k) => ({ key: k, ...summarise(data.myLogs, k, today) })),
    [data.myLogs, today],
  );
  const partnerHabits = useMemo(
    () =>
      HABIT_KEYS.map((k) => ({ key: k, ...summarise(data.partnerLogs, k, today) })),
    [data.partnerLogs, today],
  );

  // Workout volume stats
  const myVolume = useMemo(
    () => ({
      total: data.mySessions.length,
      thisWeek: data.mySessions.filter((s) => {
        const d = new Date(s.date + "T00:00:00");
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        return d >= weekAgo;
      }).length,
      thisMonth: data.mySessions.filter((s) => {
        const d = new Date(s.date + "T00:00:00");
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      }).length,
    }),
    [data.mySessions, today],
  );
  const partnerVolume = useMemo(
    () => ({
      total: data.partnerSessions.length,
      thisWeek: data.partnerSessions.filter((s) => {
        const d = new Date(s.date + "T00:00:00");
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        return d >= weekAgo;
      }).length,
      thisMonth: data.partnerSessions.filter((s) => {
        const d = new Date(s.date + "T00:00:00");
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      }).length,
    }),
    [data.partnerSessions, today],
  );

  // Shared PRs (exercises both users have logged)
  const sharedPRs = useMemo(() => {
    const partnerMap = new Map(data.partnerPRs.map((p) => [p.name, p]));
    return data.myPRs
      .filter((m) => partnerMap.has(m.name))
      .map((m) => ({ ...m, partner: partnerMap.get(m.name)! }))
      .sort((a, b) => a.muscle_group.localeCompare(b.muscle_group) || a.name.localeCompare(b.name));
  }, [data.myPRs, data.partnerPRs]);

  const myName = data.myProfile.display_name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card flex items-center justify-between p-4">
        <div>
          <h1 className="text-xl font-semibold">
            <span className="text-brand-600">{myName}</span>
            <span className="mx-2 text-slate-400">vs</span>
            <span className="text-purple-600">{partnerName}</span>
          </h1>
          {!data.partnerProfile && data.myProfile.partner_id && (
            <p className="mt-1 text-xs text-amber-600">
              Partner hasn't set up their profile yet — showing available data.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onSetup}
          className="btn-ghost flex items-center gap-1.5 text-xs"
        >
          <Settings2 className="h-3.5 w-3.5" /> Setup
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-semibold">
        <span className="text-slate-500">Habit</span>
        <span className="text-brand-600">{myName}</span>
        <span className="text-purple-600">{partnerName}</span>
        <span className="text-slate-400 w-14 text-right">Lead</span>
      </div>

      {/* ── Habits ── */}
      <section className="space-y-2">
        <SectionTitle>Habits</SectionTitle>
        <div className="card divide-y divide-slate-100">
          {HABIT_KEYS.map((k, i) => {
            const my = myHabits[i];
            const their = partnerHabits[i];
            return (
              <div
                key={k}
                className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: HABIT_COLORS[k] }}
                  />
                  <span className="text-sm font-medium">{HABIT_LABELS[k]}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-brand-700">
                    {my.hitCumulative}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">
                    ({my.hitWeek}w / {my.hitMonth}m)
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-purple-700">
                    {their.hitCumulative}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">
                    ({their.hitWeek}w / {their.hitMonth}m)
                  </span>
                </div>
                <div className="w-14 text-right">
                  <Leader mine={my.hitCumulative} theirs={their.hitCumulative} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Workouts ── */}
      <section className="space-y-2">
        <SectionTitle>Workouts</SectionTitle>
        <div className="card divide-y divide-slate-100">
          {(
            [
              { label: "Total sessions", mine: myVolume.total, theirs: partnerVolume.total },
              { label: "This month", mine: myVolume.thisMonth, theirs: partnerVolume.thisMonth },
              { label: "This week", mine: myVolume.thisWeek, theirs: partnerVolume.thisWeek },
            ] as const
          ).map(({ label, mine, theirs }) => (
            <div
              key={label}
              className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-700">{label}</span>
              <span className="text-sm font-semibold text-brand-700">{mine}</span>
              <span className="text-sm font-semibold text-purple-700">{theirs}</span>
              <div className="w-14 text-right">
                <Leader mine={mine} theirs={theirs} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRs ── */}
      <section className="space-y-2">
        <SectionTitle>Exercise PRs (shared exercises)</SectionTitle>
        {sharedPRs.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">
            No shared exercises logged yet. Once both of you log the same
            exercises, PRs will appear here.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100">
            {/* Sub-header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-4 py-2 text-xs text-slate-400">
              <span>Exercise</span>
              <span className="text-brand-500">{myName} (kg)</span>
              <span className="text-purple-500">{partnerName} (kg)</span>
              <span className="w-14 text-right">Lead</span>
            </div>
            {sharedPRs.map((row) => (
              <div
                key={row.exercise_id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium">{row.name}</span>
                  <span className="ml-1.5 text-[10px] text-slate-400">
                    {row.muscle_group}
                  </span>
                </div>
                <span className="text-sm font-semibold text-brand-700">
                  {row.max_weight}
                </span>
                <span className="text-sm font-semibold text-purple-700">
                  {row.partner.max_weight}
                </span>
                <div className="w-14 text-right">
                  <Leader mine={row.max_weight} theirs={row.partner.max_weight} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────

export default function ComparePage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current user ID + profile on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setMyId(data.user?.id ?? null);
        const p = await fetchMyProfile();
        setProfile(p);
        if (!p) setShowSetup(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load comparison data whenever profile changes
  useEffect(() => {
    if (!profile || showSetup) return;
    const uid = profile.user_id;
    const pid = profile.partner_id;

    setLoadingCompare(true);
    setError(null);

    const basePromises = [
      fetchAllDailyLogsForUser(uid),
      fetchWorkoutSessionsForUser(uid),
      fetchExercisePRsForUser(uid),
    ] as const;

    const partnerPromises = pid
      ? ([
          fetchAllDailyLogsForUser(pid),
          fetchWorkoutSessionsForUser(pid),
          fetchExercisePRsForUser(pid),
          fetchProfileForUser(pid),
        ] as const)
      : ([
          Promise.resolve([] as DailyLog[]),
          Promise.resolve([] as WorkoutSession[]),
          Promise.resolve([] as ExercisePRRow[]),
          Promise.resolve(null),
        ] as const);

    Promise.all([...basePromises, ...partnerPromises])
      .then(
        ([myLogs, mySessions, myPRs, partnerLogs, partnerSessions, partnerPRs, partnerProfile]) => {
          setCompareData({
            myProfile: profile,
            partnerProfile: partnerProfile ?? null,
            myLogs,
            partnerLogs,
            mySessions,
            partnerSessions,
            myPRs,
            partnerPRs,
          });
        },
      )
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoadingCompare(false));
  }, [profile, showSetup]);

  function handleSaved() {
    setLoading(true);
    fetchMyProfile()
      .then((p) => {
        setProfile(p);
        setShowSetup(false);
      })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      {showSetup || !profile ? (
        <SetupPanel
          myId={myId ?? ""}
          existing={profile}
          onSaved={handleSaved}
        />
      ) : loadingCompare ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-sm text-rose-600">{error}</div>
      ) : compareData ? (
        <CompareView data={compareData} onSetup={() => setShowSetup(true)} />
      ) : null}
    </div>
  );
}
